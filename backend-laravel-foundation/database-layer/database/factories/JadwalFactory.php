<?php

namespace Database\Factories;

use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Jadwal>
 */
class JadwalFactory extends Factory
{
    protected $model = Jadwal::class;

    public function definition(): array
    {
        return [
            'id_mapel' => MataPelajaran::factory(),
            'id_kelas' => Kelas::factory(),
            // Guru jadwal mengikuti guru mata pelajaran (nilai id_mapel sudah terisi di sini).
            'id_guru' => fn (array $attrs) => MataPelajaran::query()->whereKey($attrs['id_mapel'])->value('id_guru'),
            'waktu_mulai' => fn () => Carbon::instance(fake()->dateTimeBetween('-2 weeks', '+2 weeks'))
                ->setTime(fake()->numberBetween(7, 14), 0),
            'waktu_selesai' => fn (array $attrs) => Carbon::parse($attrs['waktu_mulai'])->addMinutes(90),
        ];
    }
}
