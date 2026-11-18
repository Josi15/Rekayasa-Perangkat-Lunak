<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use Illuminate\Database\Eloquent\Builder;

class JadwalPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true;
    }

    public function view(Pengguna $user, Jadwal $jadwal): bool
    {
        return $this->admin($user)
            || $this->guruPadaJadwal($user, $jadwal)
            || $this->siswaDiKelas($user, $jadwal->id_kelas);
    }

    /** Roster/rekap presensi satu jadwal: admin atau guru pengajar/pengampu. */
    public function lihatPresensi(Pengguna $user, Jadwal $jadwal): bool
    {
        return $this->admin($user) || $this->guruPadaJadwal($user, $jadwal);
    }

    /** Mencatat presensi manual (izin/sakit/alpa/hadir tanpa check-in): admin atau guru pada jadwal. */
    public function catatPresensi(Pengguna $user, Jadwal $jadwal): bool
    {
        return $this->lihatPresensi($user, $jadwal);
    }

    /** Guru pengajar jadwal (id_guru) atau pengampu mapel jadwal tersebut. */
    public function guruPadaJadwal(Pengguna $user, Jadwal $jadwal): bool
    {
        return $this->guru($user)
            && ((int) $jadwal->id_guru === (int) $user->getKey() || $this->guruMengampuMapel($user, $jadwal->id_mapel));
    }

    /**
     * Membatasi query daftar jadwal sesuai peran. Konsisten dengan view().
     *
     * @param  Builder<Jadwal>  $query
     * @return Builder<Jadwal>
     */
    public static function scope(Builder $query, Pengguna $user): Builder
    {
        $id = $user->getKey();

        return match ($user->peran) {
            Peran::Admin => $query,
            Peran::Guru => $query->where(function (Builder $w) use ($id): void {
                $w->where('id_guru', $id)
                    ->orWhereIn('id_mapel', MataPelajaran::query()->where('id_guru', $id)->select('id_mapel'));
            }),
            Peran::Siswa => $query->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $id)->select('id_kelas')),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public function create(Pengguna $user): bool
    {
        return $this->admin($user);
    }

    public function update(Pengguna $user, Jadwal $jadwal): bool
    {
        return $this->admin($user);
    }

    public function delete(Pengguna $user, Jadwal $jadwal): bool
    {
        return $this->admin($user);
    }
}
