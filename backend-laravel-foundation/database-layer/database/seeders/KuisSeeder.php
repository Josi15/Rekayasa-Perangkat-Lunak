<?php

namespace Database\Seeders;

use App\Models\Kuis;
use App\Models\MataPelajaran;
use Illuminate\Database\Seeder;

class KuisSeeder extends Seeder
{
    public function run(): void
    {
        foreach (MataPelajaran::query()->orderBy('id_mapel')->get() as $mapel) {
            Kuis::factory()->create([
                'id_mapel' => $mapel->id_mapel,
                'judul' => "{$mapel->nama_mapel} - Kuis 1",
            ]);
        }
    }
}
