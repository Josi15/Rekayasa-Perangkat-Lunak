<?php

namespace App\Services;

use App\Exceptions\PenyimpananGagalException;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Operasi file tugas (lampiran & jawaban) lewat Laravel Storage pada disk privat.
 * Nama file dibuat server (UUID + ekstensi daftar putih); nama dari pengguna tidak pernah dipakai.
 */
class PenyimpananBerkas
{
    private function disk(): Filesystem
    {
        return Storage::disk((string) config('tugas.disk'));
    }

    /**
     * @param  string  $direktori  direktori tujuan relatif pada disk
     * @param  string  $kunciJenis  kunci daftar putih di config/tugas.php
     * @return string path relatif (disimpan di DB)
     */
    public function simpan(UploadedFile $berkas, string $direktori, string $kunciJenis): string
    {
        $ekstensi = ((array) config('tugas.'.$kunciJenis))[(string) $berkas->getMimeType()] ?? null;

        if ($ekstensi === null) {
            throw new InvalidArgumentException('Jenis file tidak ada dalam daftar putih.'); // validasi seharusnya sudah menolak
        }

        $nama = Str::uuid()->toString().'.'.$ekstensi;

        try {
            $hasil = $this->disk()->putFileAs($direktori, $berkas, $nama, ['visibility' => 'private']);
        } catch (Throwable $e) {
            Log::error('Gagal menulis file tugas.', ['direktori' => $direktori, 'error' => $e::class.': '.$e->getMessage()]);

            throw new PenyimpananGagalException(sebelumnya: $e);
        }

        if ($hasil === false) {
            Log::error('Penyimpanan menolak menulis file tugas.', ['direktori' => $direktori]);

            throw new PenyimpananGagalException;
        }

        return $direktori.'/'.$nama;
    }

    /** Tidak pernah melempar: kegagalan dicatat (file yatim). Mengembalikan false bila gagal. */
    public function hapus(?string $path): bool
    {
        if ($path === null || $path === '') {
            return true;
        }

        try {
            if ($this->disk()->delete($path) !== false) {
                return true;
            }
        } catch (Throwable $e) {
            Log::warning('Gagal menghapus file tugas (file yatim).', ['path' => $path, 'error' => $e::class.': '.$e->getMessage()]);

            return false;
        }

        Log::warning('Penyimpanan menolak menghapus file tugas (file yatim).', ['path' => $path]);

        return false;
    }

    /**
     * Respons unduhan: attachment, Content-Type dari ekstensi tersimpan, nosniff, tanpa cache bersama.
     *
     * @param  string  $direktoriDasar  path wajib berada di bawah direktori ini
     */
    public function unduh(?string $path, string $direktoriDasar, string $kunciJenis, string $namaDasar): StreamedResponse
    {
        $path = (string) $path;

        if ($path === '' || ! str_starts_with($path, $direktoriDasar.'/') || str_contains($path, '..')) {
            Log::error('Path file tugas tidak valid.', ['path' => $path]);

            throw new NotFoundHttpException('File tidak ditemukan.');
        }

        try {
            $ada = $this->disk()->exists($path);
        } catch (Throwable $e) {
            Log::error('Gagal memeriksa file tugas.', ['error' => $e::class]);

            throw new PenyimpananGagalException(sebelumnya: $e);
        }

        if (! $ada) {
            Log::error('Baris menunjuk file yang tidak ada.', ['path' => $path]);

            throw new NotFoundHttpException('File tidak ditemukan.');
        }

        $ekstensi = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = array_search($ekstensi, (array) config('tugas.'.$kunciJenis), true) ?: 'application/octet-stream';
        $nama = (Str::slug($namaDasar) ?: 'berkas').'.'.$ekstensi;

        return $this->disk()->download($path, $nama, [
            'Content-Type' => $mime,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
        ]);
    }
}
