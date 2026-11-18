<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\StatusKehadiran;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Presensi\CatatPresensiRequest;
use App\Http\Requests\Api\Presensi\CheckinRequest;
use App\Http\Requests\Api\Presensi\DaftarPresensiRequest;
use App\Http\Requests\Api\Presensi\DaftarRosterRequest;
use App\Http\Requests\Api\Presensi\KoreksiPresensiRequest;
use App\Http\Requests\Api\Presensi\RekapPresensiRequest;
use App\Http\Resources\PresensiResource;
use App\Http\Resources\RekapPresensiResource;
use App\Http\Resources\RosterPresensiResource;
use App\Models\Jadwal;
use App\Models\Pengguna;
use App\Models\Presensi;
use App\Models\SiswaKelas;
use App\Policies\PresensiPolicy;
use App\Services\PresensiService;
use App\Services\RekapPresensiService;
use App\Support\FilterDaftar;
use App\Support\PeriodeTanggal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class PresensiController extends ApiController
{
    public function __construct(
        private readonly PresensiService $layanan,
        private readonly RekapPresensiService $rekap,
    ) {}

    /** POST /jadwal/{jadwal}/checkin — siswa; hanya koordinat (opsional) yang dikirim. */
    public function checkin(CheckinRequest $request, Jadwal $jadwal): JsonResponse
    {
        $p = $this->layanan->checkin($jadwal, $request->user(), $request->lat(), $request->lng());

        return PresensiResource::make($p->load('jadwal'))->response()->setStatusCode(201);
    }

    /** GET /presensi/saya — riwayat presensi milik sendiri (siswa). */
    public function saya(DaftarPresensiRequest $request): AnonymousResourceCollection
    {
        return $this->daftar(Presensi::query()->where('id_siswa', $request->user()->getKey()), $request);
    }

    /** GET /presensi */
    public function index(DaftarPresensiRequest $request): AnonymousResourceCollection
    {
        return $this->daftar(PresensiPolicy::scope(Presensi::query(), $request->user()), $request);
    }

    /** GET /presensi/{presensi} */
    public function show(Presensi $presensi): JsonResponse
    {
        Gate::authorize('view', $presensi);

        return PresensiResource::make($presensi->load(['siswa', 'jadwal']))->response();
    }

    /** PATCH /presensi/{presensi} — koreksi status_kehadiran (guru pada jadwal / admin). */
    public function update(KoreksiPresensiRequest $request, Presensi $presensi): JsonResponse
    {
        $p = $this->layanan->koreksi($presensi, StatusKehadiran::from($request->validated('status_kehadiran')));

        return PresensiResource::make($p->load(['siswa', 'jadwal']))->response();
    }

    /** GET /jadwal/{jadwal}/presensi — roster kelas + presensi sesi ini (termasuk yang belum tercatat). */
    public function roster(DaftarRosterRequest $request, Jadwal $jadwal): AnonymousResourceCollection
    {
        $query = Pengguna::query()
            ->whereIn('id_pengguna', SiswaKelas::query()->where('id_kelas', $jadwal->id_kelas)->select('id_siswa'))
            ->with(['presensi' => fn ($q) => $q->where('id_jadwal', $jadwal->id_jadwal)]);

        $status = $request->input('status_kehadiran');
        $presensiSesi = fn ($q) => $q->where('id_jadwal', $jadwal->id_jadwal);

        if ($status === 'belum_tercatat') {
            $query->whereDoesntHave('presensi', $presensiSesi);
        } elseif ($status !== null) {
            $query->whereHas('presensi', fn ($q) => $presensiSesi($q)->where('status_kehadiran', $status));
        }

        FilterDaftar::cari($query, $request->cari(), ['username', 'nisn']);
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_pengguna');

        return RosterPresensiResource::collection($query->paginate($request->perPage()));
    }

    /** POST /jadwal/{jadwal}/presensi — pencatatan manual (izin/sakit/alpa/dll.) oleh guru pada jadwal / admin. */
    public function catat(CatatPresensiRequest $request, Jadwal $jadwal): JsonResponse
    {
        $p = $this->layanan->catatManual($jadwal, (int) $request->validated('id_siswa'), StatusKehadiran::from($request->validated('status_kehadiran')));

        return PresensiResource::make($p->load(['siswa', 'jadwal']))->response()->setStatusCode(201);
    }

    /** GET /rekap/presensi — hitungan kehadiran per siswa untuk periode (siswa: dirinya; guru: jadwalnya; admin: semua). */
    public function rekap(RekapPresensiRequest $request): AnonymousResourceCollection
    {
        $query = $this->rekap->query($request->user(), $request->filter());

        return RekapPresensiResource::collection($query->paginate($request->perPage()));
    }

    /** @param Builder<Presensi> $query */
    private function daftar(Builder $query, DaftarPresensiRequest $request): AnonymousResourceCollection
    {
        foreach (['id_siswa', 'id_jadwal'] as $kolom) {
            if ($request->filled($kolom)) {
                $query->where($kolom, $request->integer($kolom));
            }
        }
        foreach (['status_kehadiran', 'status_validasi_lokasi'] as $kolom) {
            if ($request->filled($kolom)) {
                $query->where($kolom, $request->string($kolom)->toString());
            }
        }

        [$awal, $akhir] = PeriodeTanggal::batas($request->input('dari'), $request->input('sampai'));
        $filterJadwal = Jadwal::query()->select('id_jadwal');
        $pakai = false;

        foreach (['id_kelas', 'id_mapel'] as $kolom) {
            if ($request->filled($kolom)) {
                $filterJadwal->where($kolom, $request->integer($kolom));
                $pakai = true;
            }
        }
        if ($awal) {
            $filterJadwal->where('waktu_mulai', '>=', $awal);
            $pakai = true;
        }
        if ($akhir) {
            $filterJadwal->where('waktu_mulai', '<', $akhir);
            $pakai = true;
        }
        if ($pakai) {
            $query->whereIn('id_jadwal', $filterJadwal);
        }

        $query->with(['siswa', 'jadwal']);
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_presensi');

        return PresensiResource::collection($query->paginate($request->perPage()));
    }
}
