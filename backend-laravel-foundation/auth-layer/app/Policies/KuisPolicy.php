<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\Kuis;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use Illuminate\Database\Eloquent\Builder;

/**
 * Kuis milik sebuah mata pelajaran. Dikelola HANYA oleh guru pengampu mapel tersebut;
 * dilihat oleh admin, guru pengampu, dan siswa yang mengikuti mapel.
 */
class KuisPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true; // daftar dibatasi per mapel di query
    }

    public function view(Pengguna $user, Kuis $kuis): bool
    {
        return $this->admin($user)
            || $this->guruMengampuMapel($user, $kuis->id_mapel)
            || $this->siswaMengikutiMapel($user, $kuis->id_mapel);
    }

    /** Pemakaian: Gate::authorize('create', [Kuis::class, $mapel]). */
    public function create(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->guruMengampuMapel($user, $mapel->id_mapel);
    }

    public function update(Pengguna $user, Kuis $kuis): bool
    {
        return $this->guruMengampuMapel($user, $kuis->id_mapel);
    }

    /**
     * Membatasi query daftar kuis sesuai peran. Konsisten dengan view().
     *
     * @param  Builder<Kuis>  $query
     * @return Builder<Kuis>
     */
    public static function scope(Builder $query, Pengguna $user): Builder
    {
        $id = $user->getKey();

        return match ($user->peran) {
            Peran::Admin => $query,
            Peran::Guru => $query->whereIn('id_mapel', MataPelajaran::query()->where('id_guru', $id)->select('id_mapel')),
            Peran::Siswa => $query->whereIn('id_mapel', Jadwal::query()
                ->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $id)->select('id_kelas'))
                ->select('id_mapel')),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public function delete(Pengguna $user, Kuis $kuis): bool
    {
        return $this->guruMengampuMapel($user, $kuis->id_mapel);
    }
}
