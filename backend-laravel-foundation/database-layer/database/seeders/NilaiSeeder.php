<?php

namespace Database\Seeders;

use App\Enums\StatusPengumpulan;
use App\Models\Jadwal;
use App\Models\Kuis;
use App\Models\Nilai;
use App\Models\PengumpulanTugas;
use App\Models\SiswaKelas;
use Illuminate\Database\Seeder;

/** Setiap nilai punya tepat satu sumber: pengumpulan tugas ATAU kuis. */
class NilaiSeeder extends Seeder
{
    public function run(): void
    {
        // Nilai dari pengumpulan tugas (sebagian belum dinilai).
        foreach (PengumpulanTugas::query()->get() as $pengumpulan) {
            if (random_int(1, 100) > 60) {
                continue;
            }

            Nilai::query()->create([
                'id_siswa' => $pengumpulan->id_siswa,
                'id_pengumpulan' => $pengumpulan->id_pengumpulan,
                'nilai' => random_int(6000, 10000) / 100,
                'umpan_balik' => 'Kerja bagus, pertahankan.',
            ]);

            $pengumpulan->forceFill(['status' => StatusPengumpulan::Dinilai])->save();
        }

        // Nilai dari kuis: siswa pada kelas yang punya jadwal mapel kuis.
        foreach (Kuis::query()->get() as $kuis) {
            $siswaIds = SiswaKelas::query()
                ->whereIn('id_kelas', Jadwal::query()->where('id_mapel', $kuis->id_mapel)->select('id_kelas'))
                ->pluck('id_siswa')
                ->unique();

            foreach ($siswaIds as $idSiswa) {
                if (random_int(1, 100) > 80) {
                    continue;
                }

                Nilai::query()->create([
                    'id_siswa' => $idSiswa,
                    'id_kuis' => $kuis->id_kuis,
                    'nilai' => random_int(4000, 10000) / 100,
                    'umpan_balik' => null,
                ]);
            }
        }
    }
}
