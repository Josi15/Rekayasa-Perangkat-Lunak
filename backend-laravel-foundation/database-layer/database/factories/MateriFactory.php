<?php

namespace Database\Factories;

use App\Models\MataPelajaran;
use App\Models\Materi;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Materi>
 */
class MateriFactory extends Factory
{
    protected $model = Materi::class;

    public function definition(): array
    {
        return [
            'judul' => 'Materi: '.fake()->sentence(3),
            'file' => 'materi/'.fake()->uuid().'.pdf',
            'id_mapel' => MataPelajaran::factory(),
        ];
    }
}
