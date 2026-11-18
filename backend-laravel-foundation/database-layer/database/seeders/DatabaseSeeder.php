<?php

namespace Database\Seeders;

use App\Models\Pengguna;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Data demo hanya untuk database KOSONG. Jika tabel pengguna sudah berisi,
     * seeder dilewati agar data yang ada tidak tercampur/duplikat. Seluruh proses
     * berjalan dalam satu transaksi (gagal di tengah = tidak ada data setengah jadi).
     */
    public function run(): void
    {
        if (Pengguna::query()->exists()) {
            $this->command?->warn('Tabel pengguna sudah berisi data: seeder demo dilewati.');

            return;
        }

        DB::transaction(function (): void {
            $this->call([
                PenggunaSeeder::class,
                KelasSeeder::class,
                SiswaKelasSeeder::class,
                MataPelajaranSeeder::class,
                JadwalSeeder::class,
                PresensiSeeder::class,
                MateriSeeder::class,
                TugasSeeder::class,
                PengumpulanTugasSeeder::class,
                KuisSeeder::class,
                NilaiSeeder::class,
                PengumumanSeeder::class,
            ]);
        });
    }
}
