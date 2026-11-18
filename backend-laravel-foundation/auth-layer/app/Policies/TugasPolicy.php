<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use App\Models\Tugas;
use Illuminate\Database\Eloquent\Builder;

/**
 * Tugas milik sebuah mata pelajaran. Dikelola HANYA oleh guru pengampu mapel tersebut;
 * dilihat oleh admin, guru pengampu, dan siswa yang mengikuti mapel.
 */
class TugasPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true; // daftar dibatasi per mapel di query
    }

    public function view(Pengguna $user, Tugas $tugas): bool
    {
        return $this->admin($user)
            || $this->guruMengampuMapel($user, $tugas->id_mapel)
            || $this->siswaMengikutiMapel($user, $tugas->id_mapel);
    }

    /** Pemakaian: Gate::authorize('create', [Tugas::class, $mapel]). */
    public function create(Pengguna $user, MataPelajaran $mapel): bool
    {
        return $this->guruMengampuMapel($user, $mapel->id_mapel);
    }

    public function update(Pengguna $user, Tugas $tugas): bool
    {
        return $this->guruMengampuMapel($user, $tugas->id_mapel);
    }

    /** Menutup tugas: guru pengampu. */
    public function tutup(Pengguna $user, Tugas $tugas): bool
    {
        return $this->guruMengampuMapel($user, $tugas->id_mapel);
    }

    /** Melihat daftar pengumpulan satu tugas: guru pengampu dan admin. Siswa tidak (hanya miliknya). */
    public function lihatPengumpulan(Pengguna $user, Tugas $tugas): bool
    {
        return $this->admin($user) || $this->guruMengampuMapel($user, $tugas->id_mapel);
    }

    /**
     * Membatasi query daftar tugas sesuai peran. Konsisten dengan view().
     *
     * @param  Builder<Tugas>  $query
     * @return Builder<Tugas>
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

    public function delete(Pengguna $user, Tugas $tugas): bool
    {
        return $this->guruMengampuMapel($user, $tugas->id_mapel);
    }
}
