<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use Illuminate\Database\Eloquent\Builder;

class MataPelajaranPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true;
    }

    public function view(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->admin($user)
            || $this->guruMengampuMapel($user, $mapel->id_mapel)
            || $this->siswaMengikutiMapel($user, $mapel->id_mapel);
    }

    public function create(Pengguna $user): bool
    {
        return $this->admin($user);
    }

    public function update(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->admin($user);
    }

    /** Rekap/daftar nilai satu mapel: guru pengampu dan admin (siswa hanya lewat nilai miliknya). */
    public function lihatNilai(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->admin($user) || $this->guruMengampuMapel($user, $mapel->id_mapel);
    }

    public function gantiGuru(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->admin($user);
    }

    public function arsipkan(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->admin($user);
    }

    public function pulihkan(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->admin($user);
    }

    /**
     * Membatasi query daftar mapel sesuai peran. Konsisten dengan view().
     *
     * @param  Builder<MataPelajaran>  $query
     * @return Builder<MataPelajaran>
     */
    public static function scope(Builder $query, Pengguna $user): Builder
    {
        $id = $user->getKey();

        return match ($user->peran) {
            Peran::Admin => $query,
            Peran::Guru => $query->where('id_guru', $id),
            Peran::Siswa => $query->whereIn('id_mapel', Jadwal::query()
                ->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $id)->select('id_kelas'))
                ->select('id_mapel')),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public function delete(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->admin($user);
    }
}
