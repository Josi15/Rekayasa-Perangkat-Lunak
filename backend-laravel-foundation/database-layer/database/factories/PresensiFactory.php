<?php

namespace Database\Factories;

use App\Enums\StatusKehadiran;
use App\Enums\StatusValidasiLokasi;
use App\Models\Jadwal;
use App\Models\Pengguna;
use App\Models\Presensi;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Presensi>
 */
class PresensiFactory extends Factory
{
    protected $model = Presensi::class;

    /**
     * Catatan: factory tidak memastikan siswa terdaftar di kelas jadwal;
     * kekonsistenan itu dijaga oleh PresensiSeeder / logika aplikasi.
     */
    public function definition(): array
    {
        return [
            'id_siswa' => Pengguna::factory(),
            'id_jadwal' => Jadwal::factory(),
            'waktu_checkin' => fn (array $attrs) => Jadwal::query()->whereKey($attrs['id_jadwal'])
                ->first()->waktu_mulai->copy()->addMinutes(fake()->numberBetween(-5, 10)),
            'status_kehadiran' => StatusKehadiran::Hadir,
            'lokasi_lat' => fake()->latitude(-6.30, -6.10),
            'lokasi_lng' => fake()->longitude(106.70, 106.95),
            'status_validasi_lokasi' => StatusValidasiLokasi::Valid,
        ];
    }

    /** Izin/sakit/alpa: tanpa check-in dan tanpa lokasi. */
    public function tanpaCheckin(StatusKehadiran $status = StatusKehadiran::Izin): static
    {
        return $this->state(fn () => [
            'waktu_checkin' => null,
            'status_kehadiran' => $status,
            'lokasi_lat' => null,
            'lokasi_lng' => null,
            'status_validasi_lokasi' => StatusValidasiLokasi::BelumDivalidasi,
        ]);
    }
}
