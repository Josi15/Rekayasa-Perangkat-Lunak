<?php

namespace App\Services;

use App\Enums\StatusPengumpulan;
use App\Exceptions\KonflikBisnisException;
use App\Models\Jadwal;
use App\Models\Kuis;
use App\Models\Nilai;
use App\Models\PengumpulanTugas;
use App\Models\SiswaKelas;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Aturan nilai:
 *  - Skala 0–100, maksimal 2 desimal (selaras CHECK nilai_rentang_check di database).
 *  - Sumber TEPAT SATU: pengumpulan tugas ATAU kuis (CHECK nilai_sumber_tunggal_check).
 *  - Nilai tugas: id_siswa DITURUNKAN dari pengumpulan (bukan dari klien) -> selalu konsisten (FK komposit).
 *    Memberi nilai menandai pengumpulan "dinilai" dalam transaksi yang sama (dan mengunci revisi siswa).
 *  - Nilai kuis: siswa harus anggota kelas yang berjadwal mapel kuis tersebut.
 *  - Satu nilai per pengumpulan dan per (siswa, kuis); ulang = 409 grade_exists, perubahan lewat update.
 *  - Tidak ada rumus nilai akhir/rata-rata: belum ada aturan akademik yang ditetapkan.
 */
class NilaiService
{
    public function beriNilaiTugas(PengumpulanTugas $pengumpulan, string|int|float $nilai, ?string $umpanBalik): Nilai
    {
        try {
            return DB::transaction(function () use ($pengumpulan, $nilai, $umpanBalik): Nilai {
                $p = PengumpulanTugas::query()->lockForUpdate()->findOrFail($pengumpulan->getKey());

                if ($p->nilai()->exists()) {
                    throw $this->sudahAda();
                }

                $baris = Nilai::query()->create([
                    'id_siswa' => $p->id_siswa,
                    'id_pengumpulan' => $p->id_pengumpulan,
                    'id_kuis' => null,
                    'nilai' => $nilai,
                    'umpan_balik' => $umpanBalik,
                ]);

                $p->forceFill(['status' => StatusPengumpulan::Dinilai])->save();

                return $baris->refresh();
            });
        } catch (UniqueConstraintViolationException) { // balapan dua permintaan serentak
            throw $this->sudahAda();
        }
    }

    public function catatNilaiKuis(Kuis $kuis, int $idSiswa, string|int|float $nilai, ?string $umpanBalik): Nilai
    {
        try {
            return DB::transaction(function () use ($kuis, $idSiswa, $nilai, $umpanBalik): Nilai {
                $kuis = Kuis::query()->lockForUpdate()->findOrFail($kuis->getKey());

                $mengikuti = SiswaKelas::query()->where('id_siswa', $idSiswa)
                    ->whereIn('id_kelas', Jadwal::query()->where('id_mapel', $kuis->id_mapel)->select('id_kelas'))->exists();

                if (! $mengikuti) {
                    throw ValidationException::withMessages(['id_siswa' => 'Siswa tidak mengikuti mata pelajaran kuis ini.']);
                }

                if (Nilai::query()->where('id_siswa', $idSiswa)->where('id_kuis', $kuis->id_kuis)->exists()) {
                    throw $this->sudahAda();
                }

                return Nilai::query()->create([
                    'id_siswa' => $idSiswa,
                    'id_pengumpulan' => null,
                    'id_kuis' => $kuis->id_kuis,
                    'nilai' => $nilai,
                    'umpan_balik' => $umpanBalik,
                ])->refresh();
            });
        } catch (UniqueConstraintViolationException) {
            throw $this->sudahAda();
        }
    }

    /**
     * Hanya nilai & umpan_balik yang dapat berubah; siswa, sumber, dan pengumpulan/kuis tidak.
     *
     * @param  array<string, mixed>  $data
     */
    public function ubah(Nilai $nilai, array $data): Nilai
    {
        return DB::transaction(function () use ($nilai, $data): Nilai {
            $nilai = Nilai::query()->lockForUpdate()->findOrFail($nilai->getKey());

            foreach (['nilai', 'umpan_balik'] as $kolom) {
                if (array_key_exists($kolom, $data)) {
                    $nilai->{$kolom} = $data[$kolom];
                }
            }

            $nilai->save();

            return $nilai->refresh();
        });
    }

    private function sudahAda(): KonflikBisnisException
    {
        return new KonflikBisnisException('Nilai untuk sumber ini sudah ada. Gunakan perubahan nilai.', 'grade_exists');
    }
}
