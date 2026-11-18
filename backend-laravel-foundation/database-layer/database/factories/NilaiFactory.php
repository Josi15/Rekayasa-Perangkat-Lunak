<?php

namespace Database\Factories;

use App\Models\Kuis;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Default: nilai dari kuis. Gunakan dariPengumpulan() untuk nilai tugas.
 * Tepat satu sumber (id_pengumpulan XOR id_kuis) selalu terpenuhi.
 *
 * @extends Factory<Nilai>
 */
class NilaiFactory extends Factory
{
    protected $model = Nilai::class;

    public function definition(): array
    {
        return [
            'id_siswa' => Pengguna::factory(),
            'id_pengumpulan' => null,
            'id_kuis' => Kuis::factory(),
            'nilai' => fake()->randomFloat(2, 50, 100),
            'umpan_balik' => fake()->optional()->sentence(),
        ];
    }

    public function dariPengumpulan(?PengumpulanTugas $pengumpulan = null): static
    {
        return $this->state(function () use ($pengumpulan) {
            $pengumpulan ??= PengumpulanTugas::factory()->create();

            return [
                'id_siswa' => $pengumpulan->id_siswa, // harus pemilik pengumpulan
                'id_pengumpulan' => $pengumpulan->id_pengumpulan,
                'id_kuis' => null,
            ];
        });
    }
}
