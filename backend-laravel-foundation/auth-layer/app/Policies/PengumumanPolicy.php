<?php

namespace App\Policies;

use App\Enums\CakupanPengumuman;
use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Pengumuman;
use App\Models\SiswaKelas;
use Illuminate\Database\Eloquent\Builder;

class PengumumanPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true;
    }

    public function view(Pengguna $user, Pengumuman $pengumuman): bool
    {
        if ($pengumuman->cakupan === CakupanPengumuman::Umum) {
            return true;
        }

        return $this->admin($user)
            || $this->guruMengampuMapel($user, (int) $pengumuman->id_mapel)
            || $this->siswaMengikutiMapel($user, (int) $pengumuman->id_mapel);
    }

    /**
     * Membatasi daftar pengumuman sesuai peran. Konsisten dengan view():
     * global untuk semua; pengumuman mapel untuk admin (semua), guru pengampu, dan siswa yang mengikuti mapel.
     *
     * @param  Builder<Pengumuman>  $query
     * @return Builder<Pengumuman>
     */
    public static function scope(Builder $query, Pengguna $user): Builder
    {
        $id = $user->getKey();

        return match ($user->peran) {
            Peran::Admin => $query,
            Peran::Guru => $query->where(fn (Builder $w) => $w->where('cakupan', CakupanPengumuman::Umum->value)
                ->orWhereIn('id_mapel', MataPelajaran::query()->where('id_guru', $id)->select('id_mapel'))),
            Peran::Siswa => $query->where(fn (Builder $w) => $w->where('cakupan', CakupanPengumuman::Umum->value)
                ->orWhereIn('id_mapel', Jadwal::query()
                    ->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $id)->select('id_kelas'))
                    ->select('id_mapel'))),
            default => $query->whereRaw('1 = 0'),
        };
    }

    /**
     * Tanpa mapel = pengumuman global (admin saja). Dengan mapel = admin atau guru pengampu.
     * Pakai: authorize('create', Pengumuman::class) atau authorize('create', [Pengumuman::class, $mapel]).
     */
    public function create(Pengguna $user, ?MataPelajaran $mapel = null): bool
    {
        if ($this->admin($user)) {
            return true;
        }

        return $mapel !== null && $this->guruMengampuMapel($user, $mapel->id_mapel);
    }

    public function update(Pengguna $user, Pengumuman $pengumuman): bool
    {
        return $this->kelola($user, $pengumuman);
    }

    public function delete(Pengguna $user, Pengumuman $pengumuman): bool
    {
        return $this->kelola($user, $pengumuman);
    }

    /** Admin, atau guru penulisnya selama masih mengampu mapel terkait. */
    private function kelola(Pengguna $user, Pengumuman $pengumuman): bool
    {
        if ($this->admin($user)) {
            return true;
        }

        return $pengumuman->cakupan === CakupanPengumuman::Mapel
            && (int) $pengumuman->id_penulis === (int) $user->getKey()
            && $this->guruMengampuMapel($user, (int) $pengumuman->id_mapel);
    }
}
