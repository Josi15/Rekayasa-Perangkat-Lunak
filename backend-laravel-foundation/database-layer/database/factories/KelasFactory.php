<?php

namespace Database\Factories;

use App\Models\Kelas;
use App\Models\Pengguna;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Kelas>
 */
class KelasFactory extends Factory
{
    protected $model = Kelas::class;

    public function definition(): array
    {
        return [
            'nama_kelas' => 'Kelas '.fake()->unique()->bothify('##??'),
            'id_wali' => Pengguna::factory()->guru(),
        ];
    }

    public function diarsipkan(): static
    {
        return $this->state(fn () => ['diarsipkan_pada' => now()]);
    }
}
