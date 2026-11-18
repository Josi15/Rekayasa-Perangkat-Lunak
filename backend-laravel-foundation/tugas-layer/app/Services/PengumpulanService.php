<?php

namespace App\Services;

use App\Enums\StatusPengumpulan;
use App\Exceptions\KonflikBisnisException;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Tugas;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Aturan pengumpulan (eksplisit):
 *  1. Hanya siswa yang mengikuti mapel tugas (dicek di FormRequest/Policy -> 403).
 *  2. Satu pengumpulan per (siswa, tugas) — ERD unique. Pengumpulan kedua lewat POST = 409 already_submitted;
 *     perubahan memakai revisi.
 *  3. Diterima hanya sampai batas akhir (batas_waktu + toleransi; bawaan toleransi 0): selebihnya 409 deadline_passed.
 *  4. REVISI = pengumpulan ulang yang mengganti file, diperbolehkan selama tugas masih menerima pengumpulan dan
 *     belum dinilai; setiap revisi memperbarui waktu_kumpul dan menghitung ulang status.
 *  5. Setelah dinilai (status dinilai / ada nilai) pengumpulan terkunci: 409 already_graded.
 *  6. status & waktu_kumpul HANYA ditentukan server: waktu_kumpul = now(); status = terlambat bila
 *     waktu_kumpul > batas_waktu, selain itu dikumpulkan. Perubahan deadline tidak menulis ulang status lama.
 * Mapel diarsipkan = 409 subject_archived.
 */
class PengumpulanService
{
    public function __construct(private readonly PenyimpananTugas $penyimpanan) {}

    public function kumpul(Tugas $tugas, Pengguna $siswa, UploadedFile $berkas): PengumpulanTugas
    {
        $path = null;

        try {
            return DB::transaction(function () use ($tugas, $siswa, $berkas, &$path): PengumpulanTugas {
                $tugas = $this->kunciTugasYangMenerima($tugas);

                if (PengumpulanTugas::query()->where('id_siswa', $siswa->getKey())->where('id_tugas', $tugas->id_tugas)->exists()) {
                    throw new KonflikBisnisException('Anda sudah mengumpulkan tugas ini. Gunakan revisi untuk mengganti jawaban.', 'already_submitted');
                }

                $sekarang = now();
                $path = $this->penyimpanan->simpan($berkas, config('tugas.direktori_jawaban').'/'.$tugas->id_tugas);

                $pengumpulan = new PengumpulanTugas([
                    'id_siswa' => $siswa->getKey(), 'id_tugas' => $tugas->id_tugas, 'jawaban_file' => $path,
                ]);
                $pengumpulan->forceFill(['status' => $this->tentukanStatus($tugas, $sekarang), 'waktu_kumpul' => $sekarang])->save();

                return $pengumpulan->refresh();
            });
        } catch (UniqueConstraintViolationException $e) { // balapan dua permintaan serentak
            $this->penyimpanan->hapus($path);

            throw new KonflikBisnisException('Anda sudah mengumpulkan tugas ini. Gunakan revisi untuk mengganti jawaban.', 'already_submitted');
        } catch (Throwable $e) {
            $this->penyimpanan->hapus($path);

            throw $e;
        }
    }

    public function revisi(Tugas $tugas, Pengguna $siswa, UploadedFile $berkas): PengumpulanTugas
    {
        $baru = null;

        try {
            [$pengumpulan, $lama] = DB::transaction(function () use ($tugas, $siswa, $berkas, &$baru): array {
                $tugas = $this->kunciTugasYangMenerima($tugas);

                $pengumpulan = PengumpulanTugas::query()->lockForUpdate()
                    ->where('id_siswa', $siswa->getKey())->where('id_tugas', $tugas->id_tugas)->first();

                if ($pengumpulan === null) {
                    throw new NotFoundHttpException('Anda belum mengumpulkan tugas ini.');
                }

                if ($pengumpulan->status === StatusPengumpulan::Dinilai || $pengumpulan->nilai()->exists()) {
                    throw new KonflikBisnisException('Pengumpulan sudah dinilai dan tidak dapat direvisi.', 'already_graded');
                }

                $sekarang = now();
                $baru = $this->penyimpanan->simpan($berkas, config('tugas.direktori_jawaban').'/'.$tugas->id_tugas);
                $lama = $pengumpulan->jawaban_file;

                $pengumpulan->jawaban_file = $baru;
                $pengumpulan->forceFill(['status' => $this->tentukanStatus($tugas, $sekarang), 'waktu_kumpul' => $sekarang])->save();

                return [$pengumpulan, $lama];
            });
        } catch (Throwable $e) {
            $this->penyimpanan->hapus($baru);

            throw $e;
        }

        $this->penyimpanan->hapus($lama); // setelah commit; gagal = file yatim tercatat

        return $pengumpulan;
    }

    private function tentukanStatus(Tugas $tugas, \Carbon\CarbonInterface $saat): StatusPengumpulan
    {
        return $saat->greaterThan($tugas->batas_waktu) ? StatusPengumpulan::Terlambat : StatusPengumpulan::Dikumpulkan;
    }

    /** Mengunci tugas & mapel; menolak bila mapel diarsipkan atau tenggat (termasuk toleransi) sudah lewat. */
    private function kunciTugasYangMenerima(Tugas $tugas): Tugas
    {
        $tugas = Tugas::query()->lockForUpdate()->findOrFail($tugas->getKey());
        $mapel = MataPelajaran::query()->lockForUpdate()->findOrFail($tugas->id_mapel);

        if (! $mapel->aktif()) {
            throw new KonflikBisnisException('Mata pelajaran sudah diarsipkan; tugas tidak menerima pengumpulan.', 'subject_archived');
        }

        if (! $tugas->menerimaPengumpulan()) {
            throw new KonflikBisnisException('Batas waktu pengumpulan sudah lewat.', 'deadline_passed');
        }

        return $tugas;
    }
}
