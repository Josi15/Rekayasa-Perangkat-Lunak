<?php

namespace App\Services;

use App\Enums\Peran;
use App\Exceptions\KonflikBisnisException;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\Pengguna;
use App\Models\Presensi;
use App\Models\SiswaKelas;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Keanggotaan siswa pada kelas (tabel siswa_kelas, PK komposit id_siswa+id_kelas).
 * Validasi input (siswa aktif, bukan anggota) ada di Form Request; PK komposit adalah jaring
 * pengaman terakhir terhadap race condition.
 */
class KeanggotaanKelasService
{
    /**
     * Menambahkan satu atau banyak siswa secara atomik (semua berhasil atau tidak sama sekali).
     *
     * @param  list<int>  $idSiswa
     * @return Collection<int, Pengguna>
     */
    public function tambah(Kelas $kelas, array $idSiswa): Collection
    {
        return DB::transaction(function () use ($kelas, $idSiswa): Collection {
            $kelas = Kelas::query()->lockForUpdate()->findOrFail($kelas->getKey());

            if (! $kelas->aktif()) {
                throw new KonflikBisnisException('Kelas sudah diarsipkan; anggota tidak dapat diubah.', 'class_archived');
            }

            $sekarang = now();

            try {
                SiswaKelas::query()->insert(array_map(
                    fn (int $id): array => [
                        'id_siswa' => $id, 'id_kelas' => $kelas->id_kelas,
                        'created_at' => $sekarang, 'updated_at' => $sekarang,
                    ],
                    array_values(array_unique($idSiswa))
                ));
            } catch (UniqueConstraintViolationException) {
                throw new KonflikBisnisException('Salah satu siswa sudah menjadi anggota kelas ini.', 'already_member');
            }

            return Pengguna::query()->whereIn('id_pengguna', $idSiswa)->orderBy('id_pengguna')->get();
        });
    }

    /**
     * Mengeluarkan siswa dari kelas. Aturan:
     *  - kelas diarsipkan: ditolak (409);
     *  - bukan anggota: 404;
     *  - siswa yang SUDAH memiliki presensi pada jadwal kelas ini hanya boleh dikeluarkan admin
     *    (wali kelas ditolak 409), supaya riwayat kehadiran tidak kehilangan konteks.
     *  Data presensi/nilai tidak pernah ikut terhapus.
     */
    public function keluarkan(Kelas $kelas, Pengguna $siswa, Pengguna $pelaku): void
    {
        DB::transaction(function () use ($kelas, $siswa, $pelaku): void {
            $kelas = Kelas::query()->lockForUpdate()->findOrFail($kelas->getKey());

            if (! $kelas->aktif()) {
                throw new KonflikBisnisException('Kelas sudah diarsipkan; anggota tidak dapat diubah.', 'class_archived');
            }

            $anggota = SiswaKelas::query()->where('id_siswa', $siswa->getKey())->where('id_kelas', $kelas->id_kelas);

            if (! $anggota->exists()) {
                throw new NotFoundHttpException('Siswa bukan anggota kelas ini.');
            }

            if ($pelaku->peran !== Peran::Admin && $this->punyaPresensi($kelas, $siswa)) {
                throw new KonflikBisnisException('Siswa sudah memiliki presensi pada kelas ini; hanya admin yang dapat mengeluarkannya.', 'student_has_attendance');
            }

            $anggota->delete();
        });
    }

    private function punyaPresensi(Kelas $kelas, Pengguna $siswa): bool
    {
        return Presensi::query()
            ->where('id_siswa', $siswa->getKey())
            ->whereIn('id_jadwal', Jadwal::query()->where('id_kelas', $kelas->id_kelas)->select('id_jadwal'))
            ->exists();
    }
}
