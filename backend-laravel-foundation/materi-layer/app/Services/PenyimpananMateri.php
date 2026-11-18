<?php

namespace App\Services;

use App\Exceptions\PenyimpananGagalException;
use App\Models\Materi;
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
 * Seluruh operasi file materi lewat Laravel Storage pada disk privat.
 * Nama file dibuat server (UUID + ekstensi dari daftar putih); nama dari pengguna tidak pernah dipakai.
 */
class PenyimpananMateri
{
    private function disk(): Filesystem
    {
        return Storage::disk((string) config('materi.disk'));
    }

    /** Menyimpan file dan mengembalikan path relatif (disimpan di kolom materi.file). */
    public function simpan(UploadedFile $berkas, int $idMapel): string
    {
        $ekstensi = ((array) config('materi.jenis'))[(string) $berkas->getMimeType()] ?? null;

        if ($ekstensi === null) {
            throw new InvalidArgumentException('Jenis file tidak ada dalam daftar putih.'); // validasi seharusnya sudah menolak
        }

        $direktori = config('materi.direktori').'/'.$idMapel;
        $nama = Str::uuid()->toString().'.'.$ekstensi;

        try {
            $hasil = $this->disk()->putFileAs($direktori, $berkas, $nama, ['visibility' => 'private']);
        } catch (Throwable $e) {
            Log::error('Gagal menulis file materi.', ['id_mapel' => $idMapel, 'error' => $e::class.': '.$e->getMessage()]);

            throw new PenyimpananGagalException(sebelumnya: $e);
        }

        if ($hasil === false) {
            Log::error('Penyimpanan menolak menulis file materi.', ['id_mapel' => $idMapel]);

            throw new PenyimpananGagalException;
        }

        return $direktori.'/'.$nama;
    }

    /**
     * Menghapus file. Tidak pernah melempar: kegagalan dicatat (file yatim) agar tidak menggagalkan
     * operasi basis data yang sudah benar. Mengembalikan false bila gagal.
     */
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
            Log::warning('Gagal menghapus file materi (file yatim).', ['path' => $path, 'error' => $e::class.': '.$e->getMessage()]);

            return false;
        }

        Log::warning('Penyimpanan menolak menghapus file materi (file yatim).', ['path' => $path]);

        return false;
    }

    /** Respons unduhan: selalu attachment, tipe dari ekstensi tersimpan, tanpa sniffing, tanpa cache bersama. */
    public function unduh(Materi $materi): StreamedResponse
    {
        $path = (string) $materi->file;

        // Pertahanan berlapis: path hanya boleh berada di bawah direktori materi.
        if (! str_starts_with($path, config('materi.direktori').'/') || str_contains($path, '..')) {
            Log::error('Path materi tidak valid.', ['id_materi' => $materi->id_materi]);

            throw new NotFoundHttpException('File materi tidak ditemukan.');
        }

        try {
            $ada = $this->disk()->exists($path);
        } catch (Throwable $e) {
            Log::error('Gagal memeriksa file materi.', ['id_materi' => $materi->id_materi, 'error' => $e::class]);

            throw new PenyimpananGagalException(sebelumnya: $e);
        }

        if (! $ada) {
            Log::error('Baris materi menunjuk file yang tidak ada.', ['id_materi' => $materi->id_materi, 'path' => $path]);

            throw new NotFoundHttpException('File materi tidak ditemukan.');
        }

        $ekstensi = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = array_search($ekstensi, (array) config('materi.jenis'), true) ?: 'application/octet-stream';
        $nama = (Str::slug((string) $materi->judul) ?: 'materi').'.'.$ekstensi;

        return $this->disk()->download($path, $nama, [
            'Content-Type' => $mime,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
        ]);
    }
}
