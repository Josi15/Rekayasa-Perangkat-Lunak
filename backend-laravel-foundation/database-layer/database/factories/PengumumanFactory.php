<?php

namespace Database\Factories;

use App\Enums\CakupanPengumuman;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Pengumuman;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Default: pengumuman global (tanpa mapel). Gunakan untukMapel() untuk cakupan mapel.
 *
 * @extends Factory<Pengumuman>
 */
class PengumumanFactory extends Factory
{
    protected $model = Pengumuman::class;

    public function definition(): array
    {
        return [
            'judul' => fake()->sentence(4),
            'isi' => fake()->paragraphs(2, true),
            'cakupan' => CakupanPengumuman::Umum,
            'id_penulis' => Pengguna::factory()->admin(),
            'id_mapel' => null,
        ];
    }

    public function untukMapel(?MataPelajaran $mapel = null): static
    {
        return $this->state(function () use ($mapel) {
            $mapel ??= MataPelajaran::factory()->create();

            return [
                'cakupan' => CakupanPengumuman::Mapel,
                'id_mapel' => $mapel->id_mapel,
                'id_penulis' => $mapel->id_guru,
            ];
        });
    }
}
