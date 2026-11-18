<?php

namespace Database\Seeders;

use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use Illuminate\Database\Seeder;

/**
 * Setiap kelas x mapel mendapat dua sesi: 2 hari lalu (sudah lewat) dan 2 hari lagi.
 * Jam mulai = 7 + ((i + j) mod 5) sehingga tidak bentrok pada constraint unique
 * (kelas, waktu_mulai) maupun (guru, waktu_mulai).
 */
class JadwalSeeder extends Seeder
{
    public function run(): void
    {
        $kelas = Kelas::query()->orderBy('id_kelas')->get();
        $mapel = MataPelajaran::query()->orderBy('id_mapel')->get();
        $hariIni = now()->startOfDay();

        foreach ($kelas as $j => $k) {
            foreach ($mapel as $i => $m) {
                $jam = 7 + (($i + $j) % 5);

                foreach ([-2, 2] as $selisihHari) {
                    $mulai = $hariIni->copy()->addDays($selisihHari)->setTime($jam, 0);

                    Jadwal::query()->create([
                        'id_mapel' => $m->id_mapel,
                        'id_kelas' => $k->id_kelas,
                        'id_guru' => $m->id_guru,
                        'waktu_mulai' => $mulai,
                        'waktu_selesai' => $mulai->copy()->addMinutes(60),
                    ]);
                }
            }
        }
    }
}
