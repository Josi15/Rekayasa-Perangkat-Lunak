<?php

namespace Database\Seeders;

use App\Models\MataPelajaran;
use App\Models\Materi;
use Illuminate\Database\Seeder;

class MateriSeeder extends Seeder
{
    public function run(): void
    {
        foreach (MataPelajaran::query()->orderBy('id_mapel')->get() as $mapel) {
            foreach ([1, 2] as $bab) {
                Materi::factory()->create([
                    'id_mapel' => $mapel->id_mapel,
                    'judul' => "{$mapel->nama_mapel} - Bab {$bab}",
                ]);
            }
        }
    }
}
