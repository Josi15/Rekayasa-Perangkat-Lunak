<?php

namespace Database\Factories;

use App\Models\MataPelajaran;
use App\Models\Pengguna;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MataPelajaran>
 */
class MataPelajaranFactory extends Factory
{
    protected $model = MataPelajaran::class;

    public function definition(): array
    {
        return [
            'nama_mapel' => fake()->randomElement([
                'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS', 'PKN', 'Seni Budaya',
            ]),
            'id_guru' => Pengguna::factory()->guru(),
        ];
    }

    public function diarsipkan(): static
    {
        return $this->state(fn () => ['diarsipkan_pada' => now()]);
    }
}
