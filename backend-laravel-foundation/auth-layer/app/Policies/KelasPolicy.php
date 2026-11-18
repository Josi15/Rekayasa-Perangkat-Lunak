<?php

namespace App\Policies;

use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use Illuminate\Database\Eloquent\Builder;

class KelasPolicy extends BasePolicy
{
    /** Semua pengguna login boleh meminta daftar; isinya dibatasi oleh scope(). */
    public function viewAny(Pengguna $user): bool
    {
        return true;
    }

    public function view(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user)
            || $this->guruTerkaitKelas($user, $kelas->id_kelas)
            || $this->siswaDiKelas($user, $kelas->id_kelas);
    }

    public function create(Pengguna $user): bool
    {
        return $this->admin($user);
    }

    public function update(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user);
    }

    public function delete(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user);
    }

    public function gantiWali(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user);
    }

    public function arsipkan(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user);
    }

    public function pulihkan(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user);
    }

    /** Melihat anggota: admin dan guru terkait kelas (wali/pengajar). Siswa tidak melihat daftar teman sekelas. */
    public function viewAnggota(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user) || $this->guruTerkaitKelas($user, $kelas->id_kelas);
    }

    /** Menambah/mengeluarkan anggota: admin atau wali kelas yang bersangkutan. */
    public function kelolaAnggota(Pengguna $user, Kelas $kelas): bool
    {
        return $this->admin($user) || ($this->guru($user) && (int) $kelas->id_wali === (int) $user->getKey());
    }

    /**
     * Membatasi query daftar kelas sesuai peran. Konsisten dengan view().
     *
     * @param  Builder<Kelas>  $query
     * @return Builder<Kelas>
     */
    public static function scope(Builder $query, Pengguna $user): Builder
    {
        $id = $user->getKey();

        return match (true) {
            $user->peran === \App\Enums\Peran::Admin => $query,
            $user->peran === \App\Enums\Peran::Guru => $query->where(
                fn (Builder $w) => $w->where('id_wali', $id)
                    ->orWhereIn('id_kelas', Jadwal::query()->where('id_guru', $id)->select('id_kelas'))
            ),
            $user->peran === \App\Enums\Peran::Siswa => $query->whereIn(
                'id_kelas', SiswaKelas::query()->where('id_siswa', $id)->select('id_kelas')
            ),
            default => $query->whereRaw('1 = 0'),
        };
    }
}
