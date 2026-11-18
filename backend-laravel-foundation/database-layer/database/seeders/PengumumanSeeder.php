<?php

namespace Database\Seeders;

use App\Enums\CakupanPengumuman;
use App\Enums\Peran;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Pengumuman;
use Illuminate\Database\Seeder;

class PengumumanSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Pengguna::query()->where('peran', Peran::Admin->value)->orderBy('id_pengguna')->firstOrFail();

        foreach (['Selamat datang di LMS Simba', 'Jadwal ujian akan diumumkan'] as $judul) {
            Pengumuman::query()->create([
                'judul' => $judul,
                'isi' => 'Pengumuman umum untuk seluruh pengguna.',
                'cakupan' => CakupanPengumuman::Umum,
                'id_penulis' => $admin->id_pengguna,
                'id_mapel' => null,
            ]);
        }

        foreach (MataPelajaran::query()->orderBy('id_mapel')->get() as $mapel) {
            Pengumuman::query()->create([
                'judul' => "Info {$mapel->nama_mapel}",
                'isi' => "Pengumuman khusus mata pelajaran {$mapel->nama_mapel}.",
                'cakupan' => CakupanPengumuman::Mapel,
                'id_penulis' => $mapel->id_guru,
                'id_mapel' => $mapel->id_mapel,
            ]);
        }
    }
}
