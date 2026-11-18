<?php

namespace Database\Seeders;

use App\Models\MataPelajaran;
use App\Models\Tugas;
use Illuminate\Database\Seeder;

/** Per mapel: satu tugas yang sudah lewat tenggat dan satu yang masih terbuka. */
class TugasSeeder extends Seeder
{
    public function run(): void
    {
        foreach (MataPelajaran::query()->orderBy('id_mapel')->get() as $mapel) {
            Tugas::factory()->create([
                'id_mapel' => $mapel->id_mapel,
                'judul' => "{$mapel->nama_mapel} - Tugas 1",
                'batas_waktu' => now()->subDays(3),
            ]);
            Tugas::factory()->denganLampiran()->create([
                'id_mapel' => $mapel->id_mapel,
                'judul' => "{$mapel->nama_mapel} - Tugas 2",
                'batas_waktu' => now()->addDays(7),
            ]);
        }
    }
}
