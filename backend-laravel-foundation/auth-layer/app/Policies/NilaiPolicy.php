<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Models\Kuis;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Tugas;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Nilai dilihat oleh siswa pemiliknya, guru pengampu mapel sumbernya, dan admin.
 * Diberikan/diubah/dihapus HANYA oleh guru pengampu mapel sumbernya.
 */
class NilaiPolicy extends BasePolicy
{
    public function viewAny(Pengguna $user): bool
    {
        return true; // daftar dibatasi per peran di query
    }

    public function view(Pengguna $user, Nilai $nilai): bool
    {
        return $this->admin($user)
            || ($this->siswa($user) && (int) $nilai->id_siswa === (int) $user->getKey())
            || $this->guruPengampuSumber($user, $this->idMapelDariNilai($nilai));
    }

    /**
     * Memberi nilai pada sebuah sumber (PengumpulanTugas atau Kuis).
     * Pakai: Gate::authorize('beri', [Nilai::class, $sumber]).
     */
    public function beri(Pengguna $user, Model $sumber): bool
    {
        return $this->guruPengampuSumber($user, $this->idMapelDariSumber($sumber));
    }

    public function update(Pengguna $user, Nilai $nilai): bool
    {
        return $this->guruPengampuSumber($user, $this->idMapelDariNilai($nilai));
    }

    public function delete(Pengguna $user, Nilai $nilai): bool
    {
        return $this->guruPengampuSumber($user, $this->idMapelDariNilai($nilai));
    }

    /**
     * Membatasi daftar nilai sesuai peran: siswa = miliknya; guru = nilai pada mapel yang diampunya; admin = semua.
     *
     * @param  Builder<Nilai>  $query
     * @return Builder<Nilai>
     */
    public static function scope(Builder $query, Pengguna $user): Builder
    {
        return match ($user->peran) {
            Peran::Admin => $query,
            Peran::Siswa => $query->where('id_siswa', $user->getKey()),
            Peran::Guru => self::dariMapel($query, MataPelajaran::query()->where('id_guru', $user->getKey())->select('id_mapel')),
            default => $query->whereRaw('1 = 0'),
        };
    }

    /**
     * Nilai yang sumbernya (tugas ATAU kuis) berada pada mapel tertentu (id atau subquery id_mapel).
     *
     * @param  Builder<Nilai>  $query
     * @param  Builder<MataPelajaran>|int|string  $mapel
     * @return Builder<Nilai>
     */
    public static function dariMapel(Builder $query, Builder|int|string $mapel): Builder
    {
        $idMapel = $mapel instanceof Builder ? $mapel : MataPelajaran::query()->whereKey($mapel)->select('id_mapel');

        return $query->where(function (Builder $w) use ($idMapel): void {
            $w->whereIn('id_kuis', Kuis::query()->whereIn('id_mapel', $idMapel)->select('id_kuis'))
                ->orWhereIn('id_pengumpulan', PengumpulanTugas::query()
                    ->whereIn('id_tugas', Tugas::query()->whereIn('id_mapel', $idMapel)->select('id_tugas'))
                    ->select('id_pengumpulan'));
        });
    }

    private function guruPengampuSumber(Pengguna $user, ?int $idMapel): bool
    {
        return $idMapel !== null && $this->guruMengampuMapel($user, $idMapel);
    }

    private function idMapelDariSumber(Model $sumber): ?int
    {
        if ($sumber instanceof PengumpulanTugas) {
            $id = Tugas::query()->whereKey($sumber->id_tugas)->value('id_mapel');

            return $id === null ? null : (int) $id;
        }

        if ($sumber instanceof Kuis) {
            return (int) $sumber->id_mapel;
        }

        return null;
    }

    private function idMapelDariNilai(Nilai $nilai): ?int
    {
        if ($nilai->id_pengumpulan !== null) {
            $idTugas = PengumpulanTugas::query()->whereKey($nilai->id_pengumpulan)->value('id_tugas');
            $id = $idTugas === null ? null : Tugas::query()->whereKey($idTugas)->value('id_mapel');

            return $id === null ? null : (int) $id;
        }

        if ($nilai->id_kuis !== null) {
            $id = Kuis::query()->whereKey($nilai->id_kuis)->value('id_mapel');

            return $id === null ? null : (int) $id;
        }

        return null;
    }
}
