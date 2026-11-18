<?php

namespace App\Services;

use App\Exceptions\KonflikBisnisException;
use App\Models\MataPelajaran;
use App\Models\Tugas;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Tugas tidak punya kolom status di ERD, sehingga:
 *  - "menutup" tugas = memajukan batas_waktu ke sekarang (tidak ada skema baru; dibuka lagi dengan PATCH batas_waktu);
 *  - "mengarsipkan" tidak disediakan (butuh kolom baru);
 *  - menghapus hanya bila belum ada pengumpulan (409 task_has_submissions).
 * Mengubah deadline TIDAK menulis ulang status pengumpulan yang sudah ada (status = keadaan saat dikumpulkan).
 * Tugas pada mata pelajaran yang diarsipkan tidak bisa dibuat/diubah (409); menutup & menghapus tetap boleh.
 */
class TugasService
{
    public function __construct(private readonly PenyimpananTugas $penyimpanan) {}

    /**
     * @param  array{judul: string, instruksi: string, batas_waktu: mixed}  $data
     */
    public function buat(MataPelajaran $mapel, array $data, ?UploadedFile $lampiran): Tugas
    {
        $path = null;

        try {
            return DB::transaction(function () use ($mapel, $data, $lampiran, &$path): Tugas {
                $this->kunciMapelAktif($mapel->getKey());

                if ($lampiran !== null) {
                    $path = $this->penyimpanan->simpan($lampiran, config('tugas.direktori_lampiran').'/'.$mapel->getKey());
                }

                return Tugas::query()->create([
                    'judul' => $data['judul'],
                    'instruksi' => $data['instruksi'],
                    'batas_waktu' => $this->waktu($data['batas_waktu']),
                    'lampiran' => $path,
                    'id_mapel' => $mapel->getKey(),
                ])->refresh();
            });
        } catch (Throwable $e) {
            $this->penyimpanan->hapus($path);

            throw $e;
        }
    }

    /**
     * @param  array<string, mixed>  $data  judul|instruksi|batas_waktu
     */
    public function ubah(Tugas $tugas, array $data): Tugas
    {
        return DB::transaction(function () use ($tugas, $data): Tugas {
            $tugas = $this->kunci($tugas);
            $this->kunciMapelAktif($tugas->id_mapel);

            $isi = array_intersect_key($data, array_flip(['judul', 'instruksi', 'batas_waktu']));

            if (isset($isi['batas_waktu'])) {
                $isi['batas_waktu'] = $this->waktu($isi['batas_waktu']);
            }

            $tugas->fill($isi)->save();

            return $tugas;
        });
    }

    /** Menutup pengumpulan sekarang juga (idempotent). Pengumpulan yang sudah ada tidak berubah. */
    public function tutup(Tugas $tugas): Tugas
    {
        return DB::transaction(function () use ($tugas): Tugas {
            $tugas = $this->kunci($tugas);

            if ($tugas->menerimaPengumpulan()) {
                // dikurangi toleransi + 1 detik agar batas AKHIR efektif benar-benar sudah lewat
                $tugas->batas_waktu = now()->subHours((int) config('tugas.toleransi_terlambat_jam', 0))->subSecond();
                $tugas->save();
            }

            return $tugas;
        });
    }

    public function gantiLampiran(Tugas $tugas, UploadedFile $berkas): Tugas
    {
        $baru = null;

        try {
            [$tugas, $lama] = DB::transaction(function () use ($tugas, $berkas, &$baru): array {
                $tugas = $this->kunci($tugas);
                $this->kunciMapelAktif($tugas->id_mapel);

                $baru = $this->penyimpanan->simpan($berkas, config('tugas.direktori_lampiran').'/'.$tugas->id_mapel);
                $lama = $tugas->lampiran;
                $tugas->lampiran = $baru;
                $tugas->save();

                return [$tugas, $lama];
            });
        } catch (Throwable $e) {
            $this->penyimpanan->hapus($baru);

            throw $e;
        }

        $this->penyimpanan->hapus($lama);

        return $tugas;
    }

    public function hapusLampiran(Tugas $tugas): Tugas
    {
        [$tugas, $lama] = DB::transaction(function () use ($tugas): array {
            $tugas = $this->kunci($tugas);
            $this->kunciMapelAktif($tugas->id_mapel);

            $lama = $tugas->lampiran;
            $tugas->lampiran = null;
            $tugas->save();

            return [$tugas, $lama];
        });

        $this->penyimpanan->hapus($lama);

        return $tugas;
    }

    public function hapus(Tugas $tugas): void
    {
        $lampiran = DB::transaction(function () use ($tugas): ?string {
            $tugas = $this->kunci($tugas);

            if ($tugas->pengumpulan()->exists()) {
                throw new KonflikBisnisException('Tugas sudah memiliki pengumpulan dan tidak dapat dihapus. Tutup tugas sebagai gantinya.', 'task_has_submissions');
            }

            $lampiran = $tugas->lampiran;
            $tugas->delete();

            return $lampiran;
        });

        $this->penyimpanan->hapus($lampiran);
    }

    /** Input ISO-8601 (dengan offset) dinormalisasi ke zona waktu aplikasi sebelum disimpan. */
    private function waktu(mixed $nilai): Carbon
    {
        return Carbon::parse($nilai)->setTimezone((string) config('app.timezone'));
    }

    private function kunci(Tugas $tugas): Tugas
    {
        return Tugas::query()->lockForUpdate()->findOrFail($tugas->getKey());
    }

    private function kunciMapelAktif(int|string $idMapel): void
    {
        $mapel = MataPelajaran::query()->lockForUpdate()->findOrFail($idMapel);

        if (! $mapel->aktif()) {
            throw new KonflikBisnisException('Mata pelajaran sudah diarsipkan; tugas tidak dapat ditambah atau diubah.', 'subject_archived');
        }
    }
}
