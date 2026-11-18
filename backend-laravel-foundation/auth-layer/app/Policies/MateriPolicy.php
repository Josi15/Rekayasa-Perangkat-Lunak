<?php

namespace App\Policies;

use App\Models\Materi;
use App\Models\MataPelajaran;
use App\Models\Pengguna;

/**
 * Materi milik sebuah mata pelajaran. Dikelola HANYA oleh guru pengampu mapel tersebut;
 * dilihat oleh admin, guru pengampu, dan siswa yang mengikuti mapel.
 */
class MateriPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true; // daftar dibatasi per mapel di query
    }

    public function view(Pengguna $user, Materi $materi): bool
    {
        return $this->admin($user)
            || $this->guruMengampuMapel($user, $materi->id_mapel)
            || $this->siswaMengikutiMapel($user, $materi->id_mapel);
    }

    /** Pemakaian: Gate::authorize('create', [Materi::class, $mapel]). */
    public function create(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->guruMengampuMapel($user, $mapel->id_mapel);
    }

    public function update(Pengguna $user, Materi $materi): bool
    {
        return $this->guruMengampuMapel($user, $materi->id_mapel);
    }

    public function delete(Pengguna $user, Materi $materi): bool
    {
        return $this->guruMengampuMapel($user, $materi->id_mapel);
    }
}
