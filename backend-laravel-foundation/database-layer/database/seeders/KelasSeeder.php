<?php

namespace Database\Seeders;

use App\Enums\Peran;
use App\Models\Kelas;
use App\Models\Pengguna;
use Illuminate\Database\Seeder;

class KelasSeeder extends Seeder
{
    public function run(): void
    {
        $guru = Pengguna::query()->where('peran', Peran::Guru->value)->orderBy('id_pengguna')->get();

        foreach (['Kelas 7A', 'Kelas 7B', 'Kelas 7C'] as $i => $nama) {
            Kelas::query()->create(['nama_kelas' => $nama, 'id_wali' => $guru[$i]->id_pengguna]);
        }
    }
}
