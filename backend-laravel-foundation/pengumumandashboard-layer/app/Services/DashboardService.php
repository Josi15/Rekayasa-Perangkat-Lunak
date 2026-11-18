<?php

namespace App\Services;

use App\Enums\Peran;
use App\Enums\StatusKehadiran;
use App\Enums\StatusPengumpulan;
use App\Enums\StatusValidasiLokasi;
use App\Http\Resources\JadwalResource;
use App\Http\Resources\NilaiResource;
use App\Http\Resources\PengumumanResource;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\Pengumuman;
use App\Models\PengumpulanTugas;
use App\Models\Presensi;
use App\Models\SiswaKelas;
use App\Models\Tugas;
use App\Policies\JadwalPolicy;
use App\Policies\PengumumanPolicy;
use App\Policies\TugasPolicy;
use App\Support\PeriodeTanggal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Statistik dashboard. SEMUA angka dihitung dari database pada saat permintaan (tanpa cache, tanpa tabel ringkasan)
 * dan memakai scope policy yang sama dengan endpoint daftar, sehingga tidak melebihi hak akses pemanggil.
 * Sumber & definisi tiap angka: docs/API-DASHBOARD.md. Tidak ada rumus nilai akhir/rata-rata nilai.
 */
class DashboardService
{
    private const BATAS_DAFTAR = 5;

    /** @return array<string, mixed> */
    public function untuk(Pengguna $user, Request $request): array
    {
        $data = match ($user->peran) {
            Peran::Siswa => $this->siswa($user, $request),
            Peran::Guru => $this->guru($user, $request),
            Peran::Admin => $this->admin($request),
            default => [],
        };

        return ['peran' => $user->peran->value, 'dihitung_pada' => now()->toIso8601String()] + $data;
    }

    // ------------------------------------------------------------------ siswa

    /** @return array<string, mixed> */
    private function siswa(Pengguna $user, Request $request): array
    {
        $id = $user->getKey();
        $sekarang = now();

        $tugas = fn (): Builder => TugasPolicy::scope(Tugas::query(), $user)
            ->whereDoesntHave('pengumpulan', fn (Builder $q) => $q->where('id_siswa', $id));

        $nilai = Nilai::query()->where('id_siswa', $id);

        return [
            'jumlah_kelas' => Kelas::query()->aktif()
                ->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $id)->select('id_kelas'))->count(),
            'tugas_belum_dikumpulkan' => [
                'total' => $tugas()->count(),
                'masih_terbuka' => $tugas()->terbuka()->count(),
                'lewat_batas' => $tugas()->tertutup()->count(),
                'tenggat_terdekat' => $tugas()->terbuka()->with('mataPelajaran')->orderBy('batas_waktu')->orderBy('id_tugas')
                    ->limit(self::BATAS_DAFTAR)->get()
                    ->map(fn (Tugas $t) => [
                        'id_tugas' => $t->id_tugas,
                        'judul' => $t->judul,
                        'batas_waktu' => $t->batas_waktu,
                        'mapel' => $t->mataPelajaran->nama_mapel,
                    ])->all(),
            ],
            'jadwal_terdekat' => $this->jadwalMendatang(JadwalPolicy::scope(Jadwal::query(), $user), $sekarang, $request),
            'ringkasan_nilai' => [
                'jumlah_nilai' => (clone $nilai)->count(),
                'dari_tugas' => (clone $nilai)->whereNotNull('id_pengumpulan')->count(),
                'dari_kuis' => (clone $nilai)->whereNotNull('id_kuis')->count(),
                'terendah' => $this->angka((clone $nilai)->min('nilai')),
                'tertinggi' => $this->angka((clone $nilai)->max('nilai')),
                'pengumpulan_menunggu_nilai' => PengumpulanTugas::query()->where('id_siswa', $id)->whereDoesntHave('nilai')->count(),
                'terbaru' => NilaiResource::collection(
                    (clone $nilai)->with(['pengumpulanTugas.tugas', 'kuis'])->orderByDesc('updated_at')->orderByDesc('id_nilai')
                        ->limit(self::BATAS_DAFTAR)->get()
                )->resolve($request),
            ],
            'pengumuman_terbaru' => $this->pengumumanTerbaru($user, $request),
        ];
    }

    // ------------------------------------------------------------------- guru

    /** @return array<string, mixed> */
    private function guru(Pengguna $user, Request $request): array
    {
        $sekarang = now();
        $jadwal = fn (): Builder => JadwalPolicy::scope(Jadwal::query(), $user);
        $kelasAktif = fn (): Builder => Kelas::query()->aktif()->whereIn('id_kelas', $jadwal()->select('id_kelas'));
        $tugasDiampu = fn (): Builder => TugasPolicy::scope(Tugas::query(), $user);
        $pengumpulan = fn (): Builder => PengumpulanTugas::query()->whereIn('id_tugas', $tugasDiampu()->select('id_tugas'));

        $perStatus = $pengumpulan()->select('status', DB::raw('count(*) as jumlah'))->groupBy('status')->pluck('jumlah', 'status');

        return [
            'jumlah_kelas_diajar' => $kelasAktif()->count(),
            'jumlah_siswa' => Pengguna::query()->where('peran', Peran::Siswa->value)->whereNull('nonaktif_pada')
                ->whereIn('id_pengguna', SiswaKelas::query()->whereIn('id_kelas', $kelasAktif()->select('id_kelas'))->select('id_siswa'))->count(),
            'tugas_perlu_dinilai' => $pengumpulan()->whereDoesntHave('nilai')->count(),
            'jadwal_mengajar' => $this->jadwalMendatang($jadwal(), $sekarang, $request),
            'ringkasan_pengumpulan' => [
                'jumlah_tugas' => $tugasDiampu()->count(),
                'tugas_masih_terbuka' => $tugasDiampu()->terbuka()->count(),
                'total_pengumpulan' => (int) $perStatus->sum(),
                'per_status' => $this->hitungStatus($perStatus->all(), StatusPengumpulan::cases()),
                'tugas_terbaru' => $tugasDiampu()->with('mataPelajaran')->orderByDesc('batas_waktu')->orderByDesc('id_tugas')
                    ->limit(self::BATAS_DAFTAR)->get()
                    ->map(fn (Tugas $t) => $this->ringkasTugas($t))->all(),
            ],
            'pengumuman_terbaru' => $this->pengumumanTerbaru($user, $request),
        ];
    }

    /** @return array<string, mixed> */
    private function ringkasTugas(Tugas $t): array
    {
        $diikuti = Jadwal::query()->where('id_mapel', $t->id_mapel)->select('id_kelas');

        $target = Pengguna::query()->where('peran', Peran::Siswa->value)->whereNull('nonaktif_pada')
            ->whereIn('id_pengguna', SiswaKelas::query()
                ->whereIn('id_kelas', Kelas::query()->aktif()->whereIn('id_kelas', $diikuti)->select('id_kelas'))
                ->select('id_siswa'))->count();

        $kumpul = PengumpulanTugas::query()->where('id_tugas', $t->id_tugas);

        return [
            'id_tugas' => $t->id_tugas,
            'judul' => $t->judul,
            'mapel' => $t->mataPelajaran->nama_mapel,
            'batas_waktu' => $t->batas_waktu,
            'jumlah_pengumpulan' => (clone $kumpul)->count(),
            'belum_dinilai' => (clone $kumpul)->whereDoesntHave('nilai')->count(),
            'siswa_target' => $target,
        ];
    }

    // ------------------------------------------------------------------ admin

    /** @return array<string, mixed> */
    private function admin(Request $request): array
    {
        $zona = (string) config('presensi.zona_waktu', 'UTC');
        $sampaiTgl = $request->input('sampai') ?? now($zona)->format('Y-m-d');
        $dariTgl = $request->input('dari') ?? now($zona)->subDays(29)->format('Y-m-d');
        [$awal, $akhir] = PeriodeTanggal::batas($dariTgl, $sampaiTgl);

        $sesi = Jadwal::query()->where('waktu_mulai', '>=', $awal)->where('waktu_mulai', '<', $akhir);
        $presensi = Presensi::query()->whereIn('id_jadwal', (clone $sesi)->select('id_jadwal'));

        $perPeran = Pengguna::query()
            ->select('peran', DB::raw('count(*) as total'), DB::raw('count(*) filter (where nonaktif_pada is null) as aktif'))
            ->groupBy('peran')->get()->keyBy(fn ($r) => $r->peran instanceof Peran ? $r->peran->value : (string) $r->peran);

        $pengguna = [];
        foreach (Peran::cases() as $p) {
            $r = $perPeran->get($p->value);
            $pengguna[$p->value] = ['total' => (int) ($r->total ?? 0), 'aktif' => (int) ($r->aktif ?? 0), 'nonaktif' => (int) (($r->total ?? 0) - ($r->aktif ?? 0))];
        }

        $perKehadiran = (clone $presensi)->select('status_kehadiran', DB::raw('count(*) as jumlah'))->groupBy('status_kehadiran')->pluck('jumlah', 'status_kehadiran');
        $perLokasi = (clone $presensi)->select('status_validasi_lokasi', DB::raw('count(*) as jumlah'))->groupBy('status_validasi_lokasi')->pluck('jumlah', 'status_validasi_lokasi');

        $tujuhHari = now()->subDays(7);

        return [
            'pengguna' => ['total' => array_sum(array_column($pengguna, 'total')), 'per_peran' => $pengguna],
            'kelas' => $this->totalArsip(Kelas::query()),
            'mata_pelajaran' => $this->totalArsip(MataPelajaran::query()),
            'presensi' => [
                'periode' => ['dari' => $dariTgl, 'sampai' => $sampaiTgl, 'zona_waktu' => $zona],
                'jumlah_sesi' => (clone $sesi)->count(),
                'total_presensi' => (int) $perKehadiran->sum(),
                'per_status_kehadiran' => $this->hitungStatus($perKehadiran->all(), StatusKehadiran::cases()),
                'per_status_lokasi' => $this->hitungStatus($perLokasi->all(), StatusValidasiLokasi::cases()),
            ],
            'aktivitas_sistem' => [
                'sumber' => 'created_at pada tabel data; sistem belum menyimpan log login atau audit perubahan.',
                'tujuh_hari_terakhir' => [
                    'pengguna_baru' => Pengguna::query()->where('created_at', '>=', $tujuhHari)->count(),
                    'pengumpulan_tugas' => PengumpulanTugas::query()->where('created_at', '>=', $tujuhHari)->count(),
                    'nilai_dicatat' => Nilai::query()->where('created_at', '>=', $tujuhHari)->count(),
                    'presensi_dicatat' => Presensi::query()->where('created_at', '>=', $tujuhHari)->count(),
                    'pengumuman_dibuat' => Pengumuman::query()->where('created_at', '>=', $tujuhHari)->count(),
                ],
                'aktivitas_terakhir' => [
                    'pengumpulan_tugas' => PengumpulanTugas::query()->max('created_at'),
                    'nilai' => Nilai::query()->max('created_at'),
                    'presensi' => Presensi::query()->max('created_at'),
                    'pengumuman' => Pengumuman::query()->max('created_at'),
                ],
                'tidak_tersedia' => ['log_login', 'audit_perubahan'],
            ],
        ];
    }

    // ---------------------------------------------------------------- pembantu

    /** @param Builder<Jadwal> $query @return list<array<string, mixed>> */
    private function jadwalMendatang(Builder $query, \DateTimeInterface $sekarang, Request $request): array
    {
        return JadwalResource::collection(
            $query->where('waktu_selesai', '>=', $sekarang)->with(['mataPelajaran', 'kelas', 'guru'])
                ->orderBy('waktu_mulai')->orderBy('id_jadwal')->limit(self::BATAS_DAFTAR)->get()
        )->resolve($request);
    }

    /** @return list<array<string, mixed>> */
    private function pengumumanTerbaru(Pengguna $user, Request $request): array
    {
        return PengumumanResource::collection(
            PengumumanPolicy::scope(Pengumuman::query(), $user)->with(['penulis', 'mataPelajaran'])
                ->orderByDesc('created_at')->orderByDesc('id_pengumuman')->limit(self::BATAS_DAFTAR)->get()
        )->resolve($request);
    }

    /** @param Builder<Kelas>|Builder<MataPelajaran> $query @return array{total: int, aktif: int, diarsipkan: int} */
    private function totalArsip(Builder $query): array
    {
        $total = (clone $query)->count();
        $aktif = (clone $query)->whereNull('diarsipkan_pada')->count();

        return ['total' => $total, 'aktif' => $aktif, 'diarsipkan' => $total - $aktif];
    }

    /**
     * Semua nilai enum selalu hadir (0 bila kosong).
     *
     * @param  array<string, mixed>  $hitungan
     * @param  array<int, \BackedEnum>  $enum
     * @return array<string, int>
     */
    private function hitungStatus(array $hitungan, array $enum): array
    {
        $hasil = [];
        foreach ($enum as $e) {
            $hasil[$e->value] = (int) ($hitungan[$e->value] ?? 0);
        }

        return $hasil;
    }

    private function angka(mixed $nilai): ?float
    {
        return $nilai === null ? null : (float) $nilai;
    }
}
