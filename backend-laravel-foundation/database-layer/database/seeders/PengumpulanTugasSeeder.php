<?php

namespace Database\Seeders;

use App\Enums\StatusPengumpulan;
use App\Models\Jadwal;
use App\Models\PengumpulanTugas;
use App\Models\SiswaKelas;
use App\Models\Tugas;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/** Hanya siswa dari kelas yang punya jadwal pada mapel tugas tersebut yang mengumpulkan. */
class PengumpulanTugasSeeder extends Seeder
{
    public function run(): void
    {
        PengumpulanTugas::unguarded(function (): void {
            foreach (Tugas::query()->get() as $tugas) {
                $sudahLewat = $tugas->batas_waktu->isPast();
                $peluang = $sudahLewat ? 80 : 30;

                $siswaIds = SiswaKelas::query()
                    ->whereIn('id_kelas', Jadwal::query()->where('id_mapel', $tugas->id_mapel)->select('id_kelas'))
                    ->pluck('id_siswa')
                    ->unique();

                foreach ($siswaIds as $idSiswa) {
                    if (random_int(1, 100) > $peluang) {
                        continue;
                    }

                    $waktu = $sudahLewat
                        ? $tugas->batas_waktu->copy()->addMinutes(random_int(-48 * 60, 24 * 60))
                        : now()->subMinutes(random_int(60, 24 * 60));

                    PengumpulanTugas::query()->create([
                        'id_siswa' => $idSiswa,
                        'id_tugas' => $tugas->id_tugas,
                        'jawaban_file' => 'jawaban/'.Str::uuid().'.pdf',
                        'status' => $waktu->greaterThan($tugas->batas_waktu)
                            ? StatusPengumpulan::Terlambat
                            : StatusPengumpulan::Dikumpulkan,
                        'waktu_kumpul' => $waktu,
                    ]);
                }
            }
        });
    }
}
