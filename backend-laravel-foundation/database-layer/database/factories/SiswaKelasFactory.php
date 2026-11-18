<?php

namespace Database\Factories;

use App\Models\Kelas;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SiswaKelas>
 */
class SiswaKelasFactory extends Factory
{
    protected $model = SiswaKelas::class;

    public function definition(): array
    {
        return [
            'id_siswa' => Pengguna::factory(),
            'id_kelas' => Kelas::factory(),
        ];
    }
}
