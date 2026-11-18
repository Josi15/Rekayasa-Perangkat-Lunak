<?php

namespace Database\Seeders;

use App\Enums\StatusKehadiran;
use App\Enums\StatusValidasiLokasi;
use App\Models\Jadwal;
use App\Models\Presensi;
use App\Models\SiswaKelas;
use Illuminate\Database\Seeder;

/** Presensi hanya untuk sesi yang sudah lewat dan hanya untuk siswa di kelas jadwal tersebut. */
class PresensiSeeder extends Seeder
{
    public function run(): void
    {
        $sesiLewat = Jadwal::query()->where('waktu_mulai', '<', now())->get();

        Presensi::unguarded(function () use ($sesiLewat): void {
            foreach ($sesiLewat as $jadwal) {
                $siswaIds = SiswaKelas::query()->where('id_kelas', $jadwal->id_kelas)->pluck('id_siswa');

                foreach ($siswaIds as $idSiswa) {
                    $undi = random_int(1, 100);
                    $dasar = ['id_siswa' => $idSiswa, 'id_jadwal' => $jadwal->id_jadwal];

                    if ($undi <= 90) {
                        $terlambat = $undi > 80;
                        $dilokasi = random_int(1, 100) > 10; // 10% check-in di luar lokasi

                        Presensi::query()->create($dasar + [
                            'waktu_checkin' => $jadwal->waktu_mulai->copy()->addMinutes($terlambat ? random_int(15, 30) : random_int(-5, 5)),
                            'status_kehadiran' => $terlambat ? StatusKehadiran::Terlambat : StatusKehadiran::Hadir,
                            'lokasi_lat' => round($dilokasi ? -6.2000000 + random_int(-50, 50) / 100000 : -6.3500000, 7),
                            'lokasi_lng' => round($dilokasi ? 106.8000000 + random_int(-50, 50) / 100000 : 106.9500000, 7),
                            'status_validasi_lokasi' => $dilokasi ? StatusValidasiLokasi::Valid : StatusValidasiLokasi::TidakValid,
                        ]);
                    } else {
                        Presensi::query()->create($dasar + [
                            'waktu_checkin' => null,
                            'status_kehadiran' => $undi <= 95 ? StatusKehadiran::Izin : StatusKehadiran::Sakit,
                            'lokasi_lat' => null,
                            'lokasi_lng' => null,
                            'status_validasi_lokasi' => StatusValidasiLokasi::BelumDivalidasi,
                        ]);
                    }
                }
            }
        });
    }
}
