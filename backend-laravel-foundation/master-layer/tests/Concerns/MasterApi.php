<?php

namespace Tests\Concerns;

use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use Carbon\CarbonInterface;

/** Pembantu uji Backend 4: autentikasi dari SPA terdaftar dan pembuatan jadwal eksplisit. */
trait MasterApi
{
    protected const PASSWORD_UJI = 'PasswordUji2026Aman';

    /** Bertindak sebagai pengguna (guard web) dengan Origin/Referer SPA terdaftar. */
    protected function sebagai(Pengguna $pengguna): static
    {
        // Guard (mis. Sanctum RequestGuard) menyimpan user antar request dalam satu tes; reset agar pelaku baru dipakai.
        \Illuminate\Support\Facades\Auth::forgetGuards();

        return $this->actingAs($pengguna, 'web')->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ]);
    }

    protected function buatJadwal(MataPelajaran $mapel, Kelas $kelas, Pengguna $guru, CarbonInterface $mulai): Jadwal
    {
        return Jadwal::factory()->create([
            'id_mapel' => $mapel->id_mapel,
            'id_kelas' => $kelas->id_kelas,
            'id_guru' => $guru->id_pengguna,
            'waktu_mulai' => $mulai,
            'waktu_selesai' => $mulai->copy()->addHour(),
        ]);
    }

    protected function besok(int $hari = 3): CarbonInterface
    {
        return now()->addDays($hari)->startOfHour();
    }

    protected function kemarin(int $hari = 3): CarbonInterface
    {
        return now()->subDays($hari)->startOfHour();
    }
}
