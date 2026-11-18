<?php

namespace App\Policies;

use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Tugas;

class PengumpulanTugasPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true; // daftar dibatasi per peran di query
    }

    public function view(Pengguna $user, PengumpulanTugas $pengumpulan): bool
    {
        return $this->admin($user)
            || $this->milikSendiri($user, $pengumpulan)
            || $this->guruPengampuTugas($user, $pengumpulan);
    }

    /** Siswa mengumpulkan untuk dirinya sendiri pada tugas mapel yang diikutinya. */
    public function create(Pengguna $user, Tugas $tugas): bool
    {
        return $this->siswaMengikutiMapel($user, $tugas->id_mapel);
    }

    /** Pengumpulan ulang oleh pemiliknya (aturan tenggat ditangani di Service nanti). */
    public function update(Pengguna $user, PengumpulanTugas $pengumpulan): bool
    {
        return $this->milikSendiri($user, $pengumpulan);
    }

    public function delete(Pengguna $user, PengumpulanTugas $pengumpulan): bool
    {
        return $this->admin($user);
    }

    private function milikSendiri(Pengguna $user, PengumpulanTugas $pengumpulan): bool
    {
        return $this->siswa($user) && (int) $pengumpulan->id_siswa === (int) $user->getKey();
    }

    private function guruPengampuTugas(Pengguna $user, PengumpulanTugas $pengumpulan): bool
    {
        $idMapel = Tugas::query()->whereKey($pengumpulan->id_tugas)->value('id_mapel');

        return $idMapel !== null && $this->guruMengampuMapel($user, (int) $idMapel);
    }
}
