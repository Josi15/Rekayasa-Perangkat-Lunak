<?php

namespace Database\Seeders;

use App\Enums\Peran;
use App\Models\Kelas;
use App\Models\Pengguna;
use Illuminate\Database\Seeder;

/** Membagi siswa merata ke semua kelas (tiap siswa tepat satu kelas). */
class SiswaKelasSeeder extends Seeder
{
    public function run(): void
    {
        $kelas = Kelas::query()->orderBy('id_kelas')->get();

        Pengguna::query()
            ->where('peran', Peran::Siswa->value)
            ->orderBy('id_pengguna')
            ->pluck('id_pengguna')
            ->values()
            ->each(fn (int $idSiswa, int $i) => $kelas[$i % $kelas->count()]->siswa()->attach($idSiswa));
    }
}
