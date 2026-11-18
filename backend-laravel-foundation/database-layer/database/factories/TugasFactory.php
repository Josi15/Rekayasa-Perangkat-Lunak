<?php

namespace Database\Factories;

use App\Models\MataPelajaran;
use App\Models\Tugas;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Tugas>
 */
class TugasFactory extends Factory
{
    protected $model = Tugas::class;

    public function definition(): array
    {
        return [
            'judul' => 'Tugas: '.fake()->sentence(3),
            'instruksi' => fake()->paragraph(),
            'batas_waktu' => fn () => Carbon::instance(fake()->dateTimeBetween('+1 day', '+3 weeks')),
            'lampiran' => null,
            'id_mapel' => MataPelajaran::factory(),
        ];
    }

    public function denganLampiran(): static
    {
        return $this->state(fn () => ['lampiran' => 'lampiran/'.fake()->uuid().'.pdf']);
    }
}
