<?php

namespace App\Services;

use App\Enums\Peran;
use App\Models\Pengguna;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Rekap kehadiran per siswa untuk sesi (jadwal) yang SUDAH DIMULAI pada periode tertentu.
 * Dasar: siswa yang SAAT INI terdaftar di kelas jadwal (siswa_kelas tidak menyimpan riwayat tanggal masuk/keluar).
 * belum_tercatat = total_sesi - tercatat; TIDAK otomatis dianggap alpa (aturan sekolah belum ditetapkan).
 * Tidak ada persentase/nilai kehadiran akhir.
 */
class RekapPresensiService
{
    /**
     * @param  array{dari: \DateTimeInterface, sampai: \DateTimeInterface, id_kelas?: int, id_mapel?: int, id_guru?: int, id_siswa?: int, id_jadwal?: int}  $f
     */
    public function query(Pengguna $user, array $f): Builder
    {
        $q = DB::table('jadwal as j')
            ->join('siswa_kelas as sk', 'sk.id_kelas', '=', 'j.id_kelas')
            ->join('pengguna as s', 's.id_pengguna', '=', 'sk.id_siswa')
            ->leftJoin('presensi as p', function ($join): void {
                $join->on('p.id_jadwal', '=', 'j.id_jadwal')->on('p.id_siswa', '=', 'sk.id_siswa');
            })
            ->where('j.waktu_mulai', '>=', $f['dari'])
            ->where('j.waktu_mulai', '<', $f['sampai'])
            ->where('j.waktu_mulai', '<=', now());

        match ($user->peran) {
            Peran::Admin => null,
            Peran::Siswa => $q->where('sk.id_siswa', $user->getKey()),
            Peran::Guru => $q->where(function ($w) use ($user): void {
                $w->where('j.id_guru', $user->getKey())
                    ->orWhereIn('j.id_mapel', DB::table('mata_pelajaran')->where('id_guru', $user->getKey())->select('id_mapel'));
            }),
            default => $q->whereRaw('1 = 0'),
        };

        foreach (['id_kelas' => 'j.id_kelas', 'id_mapel' => 'j.id_mapel', 'id_guru' => 'j.id_guru', 'id_jadwal' => 'j.id_jadwal', 'id_siswa' => 'sk.id_siswa'] as $kunci => $kolom) {
            if (isset($f[$kunci])) {
                $q->where($kolom, $f[$kunci]);
            }
        }

        return $q->groupBy('s.id_pengguna', 's.nisn', 's.username')
            ->orderBy('s.username')->orderBy('s.id_pengguna')
            ->selectRaw(<<<'SQL'
                s.id_pengguna AS id_siswa, s.nisn, s.username,
                COUNT(*) AS total_sesi,
                COUNT(p.id_presensi) AS tercatat,
                COUNT(p.id_presensi) FILTER (WHERE p.status_kehadiran = 'hadir') AS hadir,
                COUNT(p.id_presensi) FILTER (WHERE p.status_kehadiran = 'terlambat') AS terlambat,
                COUNT(p.id_presensi) FILTER (WHERE p.status_kehadiran = 'izin') AS izin,
                COUNT(p.id_presensi) FILTER (WHERE p.status_kehadiran = 'sakit') AS sakit,
                COUNT(p.id_presensi) FILTER (WHERE p.status_kehadiran = 'alpa') AS alpa
                SQL);
    }
}
