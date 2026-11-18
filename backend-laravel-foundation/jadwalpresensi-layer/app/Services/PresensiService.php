<?php

namespace App\Services;

use App\Enums\StatusKehadiran;
use App\Enums\StatusValidasiLokasi;
use App\Exceptions\KonfigurasiLokasiException;
use App\Exceptions\KonflikBisnisException;
use App\Models\Jadwal;
use App\Models\Pengguna;
use App\Models\Presensi;
use App\Models\SiswaKelas;
use App\Support\JarakGeografis;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Presensi:
 *  - Check-in oleh siswa untuk dirinya sendiri. waktu_checkin = jam SERVER; status_kehadiran dan
 *    status_validasi_lokasi dihitung server (input klien untuk ketiganya ditolak di FormRequest).
 *  - Jendela: dibuka config checkin.buka_sebelum_menit sebelum mulai, ditutup saat waktu_selesai.
 *  - hadir bila check-in <= mulai + toleransi, selain itu terlambat (toleransi = config; ASUMSI, bukan aturan sekolah).
 *  - Satu catatan per (siswa, jadwal): ulang = 409 attendance_exists (UNIQUE di database sebagai jaring pengaman).
 *  - Lokasi: jarak haversine di server vs titik referensi & radius config. GPS dapat dipalsukan; lihat config/presensi.php.
 */
class PresensiService
{
    public function checkin(Jadwal $jadwal, Pengguna $siswa, ?float $lat, ?float $lng): Presensi
    {
        try {
            return DB::transaction(function () use ($jadwal, $siswa, $lat, $lng): Presensi {
                $j = Jadwal::query()->lockForUpdate()->findOrFail($jadwal->getKey());

                $anggota = SiswaKelas::query()->where('id_siswa', $siswa->getKey())->where('id_kelas', $j->id_kelas)->exists();
                if (! $anggota) {
                    throw new AuthorizationException('Anda tidak terdaftar pada kelas jadwal ini.');
                }

                $sekarang = now();
                $buka = $j->waktu_mulai->copy()->subMinutes((int) config('presensi.checkin.buka_sebelum_menit'));

                if ($sekarang->lessThan($buka)) {
                    throw new KonflikBisnisException('Check-in belum dibuka untuk jadwal ini.', 'checkin_not_open');
                }
                if ($sekarang->greaterThan($j->waktu_selesai)) {
                    throw new KonflikBisnisException('Check-in sudah ditutup; jadwal ini telah selesai.', 'checkin_closed');
                }

                if (Presensi::query()->where('id_siswa', $siswa->getKey())->where('id_jadwal', $j->id_jadwal)->exists()) {
                    throw $this->sudahAda();
                }

                [$validasi, $jarak] = $this->validasiLokasi($lat, $lng, $siswa, $j);

                $terlambat = $sekarang->greaterThan($j->waktu_mulai->copy()->addMinutes((int) config('presensi.checkin.toleransi_terlambat_menit')));

                $p = new Presensi([
                    'id_siswa' => $siswa->getKey(),
                    'id_jadwal' => $j->id_jadwal,
                    'waktu_checkin' => $sekarang,
                    'status_kehadiran' => $terlambat ? StatusKehadiran::Terlambat : StatusKehadiran::Hadir,
                    'lokasi_lat' => $lat !== null ? round($lat, 7) : null,
                    'lokasi_lng' => $lng !== null ? round($lng, 7) : null,
                ]);
                $p->status_validasi_lokasi = $validasi; // tidak mass-assignable; hanya diisi server
                $p->save();

                $p->refresh();
                if ($jarak !== null) {
                    $p->setAttribute('jarak_meter', round($jarak, 1)); // hanya untuk respons; tidak disimpan
                    $p->setAttribute('radius_meter', (int) config('presensi.lokasi.radius_meter'));
                }

                return $p;
            });
        } catch (UniqueConstraintViolationException) {
            throw $this->sudahAda();
        }
    }

    /** Pencatatan manual oleh guru/admin (izin, sakit, alpa, atau kehadiran tanpa check-in). */
    public function catatManual(Jadwal $jadwal, int $idSiswa, StatusKehadiran $status): Presensi
    {
        try {
            return DB::transaction(function () use ($jadwal, $idSiswa, $status): Presensi {
                $j = Jadwal::query()->lockForUpdate()->findOrFail($jadwal->getKey());

                if (! SiswaKelas::query()->where('id_siswa', $idSiswa)->where('id_kelas', $j->id_kelas)->exists()) {
                    throw ValidationException::withMessages(['id_siswa' => 'Siswa tidak terdaftar pada kelas jadwal ini.']);
                }

                $this->pastikanStatusSesuaiWaktu($j, $status);

                if (Presensi::query()->where('id_siswa', $idSiswa)->where('id_jadwal', $j->id_jadwal)->exists()) {
                    throw $this->sudahAda();
                }

                $p = new Presensi(['id_siswa' => $idSiswa, 'id_jadwal' => $j->id_jadwal, 'status_kehadiran' => $status]);
                $p->status_validasi_lokasi = StatusValidasiLokasi::BelumDivalidasi;
                $p->save();

                return $p->refresh();
            });
        } catch (UniqueConstraintViolationException) {
            throw $this->sudahAda();
        }
    }

    /** Koreksi status_kehadiran. Data check-in & lokasi tidak diubah (jejak asli tetap ada). */
    public function koreksi(Presensi $presensi, StatusKehadiran $status): Presensi
    {
        return DB::transaction(function () use ($presensi, $status): Presensi {
            $p = Presensi::query()->lockForUpdate()->findOrFail($presensi->getKey());
            $this->pastikanStatusSesuaiWaktu(Jadwal::query()->findOrFail($p->id_jadwal), $status);

            $p->status_kehadiran = $status;
            $p->save();

            return $p->refresh();
        });
    }

    /** hadir/terlambat/alpa menyatakan sesi sudah berjalan; izin/sakit boleh diajukan sebelumnya. */
    private function pastikanStatusSesuaiWaktu(Jadwal $j, StatusKehadiran $status): void
    {
        $belumMulai = $j->waktu_mulai->greaterThan(now());

        if ($belumMulai && in_array($status, [StatusKehadiran::Hadir, StatusKehadiran::Terlambat, StatusKehadiran::Alpa], true)) {
            throw new KonflikBisnisException('Jadwal belum dimulai; hanya izin atau sakit yang dapat dicatat sekarang.', 'schedule_not_started');
        }
    }

    /** @return array{0: StatusValidasiLokasi, 1: ?float} [status, jarak meter] */
    private function validasiLokasi(?float $lat, ?float $lng, Pengguna $siswa, Jadwal $j): array
    {
        if ($lat === null || $lng === null) {
            if (config('presensi.lokasi.wajib')) {
                throw ValidationException::withMessages([
                    'lokasi_lat' => 'Lokasi wajib disertakan. Izinkan akses lokasi pada perangkat Anda.',
                ]);
            }

            return [StatusValidasiLokasi::BelumDivalidasi, null];
        }

        $refLat = config('presensi.lokasi.lat');
        $refLng = config('presensi.lokasi.lng');
        if ($refLat === null || $refLng === null) {
            throw new KonfigurasiLokasiException;
        }

        $jarak = JarakGeografis::meter($lat, $lng, (float) $refLat, (float) $refLng);
        $radius = (int) config('presensi.lokasi.radius_meter');

        if ($jarak <= $radius) {
            return [StatusValidasiLokasi::Valid, $jarak];
        }

        // Koordinat tidak dicatat di log (data lokasi pribadi); hanya jarak.
        Log::notice('presensi.luar_radius', ['id_siswa' => $siswa->getKey(), 'id_jadwal' => $j->id_jadwal, 'jarak_meter' => round($jarak)]);

        if (config('presensi.lokasi.luar_radius') === 'tandai') {
            return [StatusValidasiLokasi::TidakValid, $jarak];
        }

        throw new KonflikBisnisException(
            sprintf('Anda berada sekitar %d m dari titik presensi (maksimum %d m).', round($jarak), $radius),
            'outside_radius'
        );
    }

    private function sudahAda(): KonflikBisnisException
    {
        return new KonflikBisnisException('Presensi untuk jadwal ini sudah tercatat.', 'attendance_exists');
    }
}
