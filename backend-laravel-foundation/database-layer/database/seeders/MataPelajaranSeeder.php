<?php

namespace Database\Seeders;

use App\Enums\Peran;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use Illuminate\Database\Seeder;

class MataPelajaranSeeder extends Seeder
{
    public function run(): void
    {
        $guru = Pengguna::query()->where('peran', Peran::Guru->value)->orderBy('id_pengguna')->get();

        foreach (['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS'] as $i => $nama) {
            MataPelajaran::query()->create(['nama_mapel' => $nama, 'id_guru' => $guru[$i]->id_pengguna]);
        }
    }
}
