<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Peran;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Jadwal\BuatJadwalRequest;
use App\Http\Requests\Api\Jadwal\DaftarJadwalPenggunaRequest;
use App\Http\Requests\Api\Jadwal\DaftarJadwalRequest;
use App\Http\Requests\Api\Jadwal\UbahJadwalRequest;
use App\Http\Resources\JadwalResource;
use App\Models\Jadwal;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use App\Policies\JadwalPolicy;
use App\Services\JadwalService;
use App\Support\FilterDaftar;
use App\Support\PeriodeTanggal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JadwalController extends ApiController
{
    public function __construct(private readonly JadwalService $layanan) {}

    /** GET /jadwal — jadwal yang boleh dilihat pemanggil (siswa: kelasnya; guru: yang diajar/diampu; admin: semua). */
    public function index(DaftarJadwalRequest $request): AnonymousResourceCollection
    {
        return $this->daftar(JadwalPolicy::scope(Jadwal::query(), $request->user()), $request);
    }

    /** GET /siswa/{siswa}/jadwal */
    public function jadwalSiswa(DaftarJadwalPenggunaRequest $request, Pengguna $siswa): AnonymousResourceCollection
    {
        if ($siswa->peran !== Peran::Siswa) {
            throw new NotFoundHttpException('Pengguna bukan siswa.');
        }

        $query = JadwalPolicy::scope(Jadwal::query(), $request->user())
            ->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $siswa->getKey())->select('id_kelas'));

        return $this->daftar($query, $request);
    }

    /** GET /guru/{guru}/jadwal */
    public function jadwalGuru(DaftarJadwalPenggunaRequest $request, Pengguna $guru): AnonymousResourceCollection
    {
        if ($guru->peran !== Peran::Guru) {
            throw new NotFoundHttpException('Pengguna bukan guru.');
        }

        $query = JadwalPolicy::scope(Jadwal::query(), $request->user())->where('id_guru', $guru->getKey());

        return $this->daftar($query, $request);
    }

    /** GET /jadwal/{jadwal} */
    public function show(Jadwal $jadwal): JsonResponse
    {
        Gate::authorize('view', $jadwal);

        return $this->tampil($jadwal);
    }

    /** POST /jadwal */
    public function store(BuatJadwalRequest $request): JsonResponse
    {
        return $this->tampil($this->layanan->buat($request->validated()), 201);
    }

    /** PATCH /jadwal/{jadwal} */
    public function update(UbahJadwalRequest $request, Jadwal $jadwal): JsonResponse
    {
        return $this->tampil($this->layanan->ubah($jadwal, $request->validated()));
    }

    /** DELETE /jadwal/{jadwal} — hanya jadwal mendatang tanpa presensi. */
    public function destroy(Request $request, Jadwal $jadwal): Response
    {
        Gate::authorize('delete', $jadwal);

        $this->layanan->hapus($jadwal);

        return $this->noContent();
    }

    /** @param Builder<Jadwal> $query */
    private function daftar(Builder $query, DaftarJadwalRequest $request): AnonymousResourceCollection
    {
        if ($request->filled('tanggal')) {
            [$awal, $akhir] = PeriodeTanggal::hari($request->string('tanggal')->toString());
            $query->where('waktu_mulai', '>=', $awal)->where('waktu_mulai', '<', $akhir);
        } else {
            [$awal, $akhir] = PeriodeTanggal::batas($request->input('dari'), $request->input('sampai'));
            $awal && $query->where('waktu_mulai', '>=', $awal);
            $akhir && $query->where('waktu_mulai', '<', $akhir);
        }

        foreach (['id_kelas', 'id_guru', 'id_mapel'] as $kolom) {
            if ($request->filled($kolom)) {
                $query->where($kolom, $request->integer($kolom));
            }
        }

        $query->with(['mataPelajaran', 'kelas', 'guru']);
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_jadwal');

        return JadwalResource::collection($query->paginate($request->perPage()));
    }

    private function tampil(Jadwal $jadwal, int $status = 200): JsonResponse
    {
        $jadwal->load(['mataPelajaran', 'kelas', 'guru'])->loadCount('presensi');

        return JadwalResource::make($jadwal)->response()->setStatusCode($status);
    }
}
