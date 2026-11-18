<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Presensi;
use Illuminate\Database\Eloquent\Builder;

class PresensiPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true; // daftar dibatasi per peran di query
    }

    public function view(Pengguna $user, Presensi $presensi): bool
    {
        if ($this->admin($user)) {
            return true;
        }

        if ($this->siswa($user)) {
            return (int) $presensi->id_siswa === (int) $user->getKey();
        }

        return $this->guruPadaJadwal($user, $presensi);
    }

    /** Check-in: siswa untuk dirinya sendiri pada jadwal kelasnya. Pakai: authorize('create', [Presensi::class, $jadwal]). */
    public function create(Pengguna $user, Jadwal $jadwal): bool
    {
        return $this->siswaDiKelas($user, $jadwal->id_kelas);
    }

    /** Koreksi status kehadiran: guru pengajar/pengampu pada jadwal tersebut, atau admin. */
    public function update(Pengguna $user, Presensi $presensi): bool
    {
        return $this->admin($user) || $this->guruPadaJadwal($user, $presensi);
    }

    /**
     * Membatasi daftar presensi: siswa = miliknya; guru = jadwal yang diajar/diampunya; admin = semua.
     *
     * @param  Builder<Presensi>  $query
     * @return Builder<Presensi>
     */
    public static function scope(Builder $query, Pengguna $user): Builder
    {
        $id = $user->getKey();

        return match ($user->peran) {
            Peran::Admin => $query,
            Peran::Siswa => $query->where('id_siswa', $id),
            Peran::Guru => $query->whereIn('id_jadwal', Jadwal::query()->where(function (Builder $w) use ($id): void {
                $w->where('id_guru', $id)
                    ->orWhereIn('id_mapel', MataPelajaran::query()->where('id_guru', $id)->select('id_mapel'));
            })->select('id_jadwal')),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public function delete(Pengguna $user, Presensi $presensi): bool
    {
        return $this->admin($user);
    }

    private function guruPadaJadwal(Pengguna $user, Presensi $presensi): bool
    {
        if (! $this->guru($user)) {
            return false;
        }

        $jadwal = Jadwal::query()->find($presensi->id_jadwal);

        return $jadwal !== null
            && ((int) $jadwal->id_guru === (int) $user->getKey()
                || $this->guruMengampuMapel($user, $jadwal->id_mapel));
    }
}
