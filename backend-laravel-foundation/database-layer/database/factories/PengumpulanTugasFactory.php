<?php

namespace Database\Factories;

use App\Enums\StatusPengumpulan;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Tugas;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PengumpulanTugas>
 */
class PengumpulanTugasFactory extends Factory
{
    protected $model = PengumpulanTugas::class;

    public function definition(): array
    {
        return [
            'id_siswa' => Pengguna::factory(),
            'id_tugas' => Tugas::factory(),
            'jawaban_file' => 'jawaban/'.fake()->uuid().'.pdf',
            'status' => StatusPengumpulan::Dikumpulkan,
            'waktu_kumpul' => now(),
        ];
    }
}
