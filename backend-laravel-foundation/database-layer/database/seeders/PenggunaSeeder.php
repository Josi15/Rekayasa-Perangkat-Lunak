<?php

namespace Database\Seeders;

use App\Models\Pengguna;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * 1 admin, 5 guru, 30 siswa. Semua akun demo memakai satu password dari
 * SEED_DEFAULT_PASSWORD; jika kosong dibuat acak dan ditampilkan sekali di konsol.
 */
class PenggunaSeeder extends Seeder
{
    public function run(): void
    {
        $plain = config('simba.seed_password');

        if (blank($plain)) {
            $plain = Str::random(16);
            $this->command?->warn("SEED_DEFAULT_PASSWORD kosong. Password acak untuk semua akun demo: {$plain}");
        }

        $hash = Hash::make($plain); // dihitung sekali, dipakai ulang

        Pengguna::factory()->admin()->withHash($hash)->create(['username' => 'admin', 'email' => 'admin@lms-simba.test']);
        Pengguna::factory()->guru()->withHash($hash)->count(5)->create();
        Pengguna::factory()->withHash($hash)->count(30)->create();
    }
}
