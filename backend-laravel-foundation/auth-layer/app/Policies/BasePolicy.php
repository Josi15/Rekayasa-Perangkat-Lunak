<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\SiswaKelas;

/**
 * Dasar semua policy. Seluruh keputusan memakai peran & relasi dari DATABASE (model Pengguna
 * yang terautentikasi), tidak pernah dari input klien. Peran tidak dikenal = ditolak.
 *
 * Kebijakan aplikasi (asumsi, mohon dikonfirmasi):
 *  - Siswa: hanya data miliknya / kelas yang diikutinya / mapel pada kelasnya.
 *  - Guru: kelas (wali atau pengajar pada jadwal) dan mapel yang diampunya; mengelola
 *    materi, tugas, kuis, penilaian hanya untuk mapel yang diampunya.
 *  - Admin: sumber daya administratif (kelas, mapel, jadwal, pengguna, pengumuman umum) dan
 *    melihat seluruh data; TIDAK mengubah materi/tugas/kuis/nilai (itu wewenang guru mapel).
 */
abstract class BasePolicy
{
    protected function admin(Pengguna $user): bool
    {
        return $user->peran === Peran::Admin;
    }

    protected function guru(Pengguna $user): bool
    {
        return $user->peran === Peran::Guru;
    }

    protected function siswa(Pengguna $user): bool
    {
        return $user->peran === Peran::Siswa;
    }

    protected function siswaDiKelas(Pengguna $user, int $idKelas): bool
    {
        return $this->siswa($user)
            && SiswaKelas::query()->where('id_siswa', $user->getKey())->where('id_kelas', $idKelas)->exists();
    }

    /** Siswa "mengikuti" mapel bila kelasnya memiliki jadwal untuk mapel tersebut. */
    protected function siswaMengikutiMapel(Pengguna $user, int $idMapel): bool
    {
        return $this->siswa($user)
            && Jadwal::query()
                ->where('id_mapel', $idMapel)
                ->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $user->getKey())->select('id_kelas'))
                ->exists();
    }

    protected function guruMengampuMapel(Pengguna $user, int $idMapel): bool
    {
        return $this->guru($user)
            && MataPelajaran::query()->whereKey($idMapel)->where('id_guru', $user->getKey())->exists();
    }

    /** Guru terkait kelas bila menjadi wali kelas atau pengajar pada salah satu jadwalnya. */
    protected function guruTerkaitKelas(Pengguna $user, int $idKelas): bool
    {
        return $this->guru($user) && (
            Kelas::query()->whereKey($idKelas)->where('id_wali', $user->getKey())->exists()
            || Jadwal::query()->where('id_kelas', $idKelas)->where('id_guru', $user->getKey())->exists()
        );
    }
}
