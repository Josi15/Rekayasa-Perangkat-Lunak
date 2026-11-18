<?php

namespace App\Services;

use App\Exceptions\KonflikBisnisException;
use App\Models\MataPelajaran;
use App\Models\Materi;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Urutan operasi menjaga konsistensi baris DB dan file:
 *  - buat/ganti: file ditulis DI DALAM transaksi; bila apa pun gagal, file baru dihapus (rollback manual);
 *    file lama baru dihapus SETELAH commit.
 *  - hapus: baris dihapus dulu (commit), lalu file; kegagalan hapus file hanya dicatat (file yatim),
 *    bukan baris yang menunjuk file hilang.
 * Mengelola materi pada mata pelajaran yang diarsipkan ditolak (409); menghapus tetap boleh.
 */
class MateriService
{
    public function __construct(private readonly PenyimpananMateri $penyimpanan) {}

    public function buat(MataPelajaran $mapel, string $judul, UploadedFile $berkas): Materi
    {
        $path = null;

        try {
            return DB::transaction(function () use ($mapel, $judul, $berkas, &$path): Materi {
                $this->kunciMapelAktif($mapel->getKey());
                $path = $this->penyimpanan->simpan($berkas, (int) $mapel->getKey());

                return Materi::query()
                    ->create(['judul' => $judul, 'file' => $path, 'id_mapel' => $mapel->getKey()])
                    ->refresh();
            });
        } catch (Throwable $e) {
            $this->penyimpanan->hapus($path);

            throw $e;
        }
    }

    public function ubahJudul(Materi $materi, string $judul): Materi
    {
        return DB::transaction(function () use ($materi, $judul): Materi {
            $materi = $this->kunciMateri($materi);
            $this->kunciMapelAktif($materi->id_mapel);

            $materi->fill(['judul' => $judul])->save();

            return $materi;
        });
    }

    public function gantiFile(Materi $materi, UploadedFile $berkas): Materi
    {
        $baru = null;

        try {
            [$materi, $lama] = DB::transaction(function () use ($materi, $berkas, &$baru): array {
                $materi = $this->kunciMateri($materi);
                $this->kunciMapelAktif($materi->id_mapel);

                $baru = $this->penyimpanan->simpan($berkas, (int) $materi->id_mapel);
                $lama = $materi->file;
                $materi->file = $baru;
                $materi->save();

                return [$materi, $lama];
            });
        } catch (Throwable $e) {
            $this->penyimpanan->hapus($baru);

            throw $e;
        }

        $this->penyimpanan->hapus($lama); // setelah commit; gagal = file yatim tercatat di log

        return $materi;
    }

    public function hapus(Materi $materi): void
    {
        $path = DB::transaction(function () use ($materi): ?string {
            $materi = $this->kunciMateri($materi);
            $path = $materi->file;
            $materi->delete();

            return $path;
        });

        $this->penyimpanan->hapus($path);
    }

    private function kunciMateri(Materi $materi): Materi
    {
        return Materi::query()->lockForUpdate()->findOrFail($materi->getKey());
    }

    private function kunciMapelAktif(int|string $idMapel): void
    {
        $mapel = MataPelajaran::query()->lockForUpdate()->findOrFail($idMapel);

        if (! $mapel->aktif()) {
            throw new KonflikBisnisException('Mata pelajaran sudah diarsipkan; materi tidak dapat ditambah atau diubah.', 'subject_archived');
        }
    }
}
