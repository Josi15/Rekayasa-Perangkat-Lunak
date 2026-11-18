<?php

namespace Database\Factories;

use App\Models\Kuis;
use App\Models\MataPelajaran;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Kuis>
 */
class KuisFactory extends Factory
{
    protected $model = Kuis::class;

    public function definition(): array
    {
        return [
            'judul' => 'Kuis: '.fake()->sentence(3),
            'tautan_google_form' => 'https://docs.google.com/forms/d/e/'.Str::random(40).'/viewform',
            'id_mapel' => MataPelajaran::factory(),
        ];
    }
}
