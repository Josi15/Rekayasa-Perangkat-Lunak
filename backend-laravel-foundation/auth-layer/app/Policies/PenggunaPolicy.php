<?php

namespace App\Policies;

use App\Models\Pengguna;

class PenggunaPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return $this->admin($user);
    }

    public function view(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user) || $user->is($target);
    }

    public function create(Pengguna $user): bool
    {
        return $this->admin($user);
    }

    /** Mengubah akun (termasuk peran) hanya admin. Profil sendiri: updateProfil(). */
    public function update(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user);
    }

    public function updateProfil(Pengguna $user, Pengguna $target): bool
    {
        return $user->is($target);
    }

    /** Menonaktifkan akun: hanya admin, dan tidak boleh akunnya sendiri. */
    public function nonaktifkan(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user) && ! $user->is($target);
    }

    public function aktifkan(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user);
    }

    /**
     * Jadwal seseorang: admin atau yang bersangkutan; guru boleh melihat jadwal siswa (isi dibatasi ke jadwalnya sendiri).
     * Jadwal guru hanya untuk admin dan guru itu sendiri.
     */
    public function viewJadwal(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user)
            || $user->is($target)
            || ($this->guru($user) && $target->peran === \App\Enums\Peran::Siswa);
    }

    /** Nilai seorang siswa: admin, siswa itu sendiri, atau guru (isi dibatasi ke mapel yang diampunya). */
    public function viewNilai(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user) || $this->guru($user) || $user->is($target);
    }

    /** Daftar kelas milik seorang siswa: admin, siswa itu sendiri, atau guru (isi dibatasi scope kelas). */
    public function viewKelas(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user) || $this->guru($user) || $user->is($target);
    }

    /** Admin tidak dapat menghapus akunnya sendiri. */
    public function delete(Pengguna $user, Pengguna $target): bool
    {
        return $this->admin($user) && ! $user->is($target);
    }
}
