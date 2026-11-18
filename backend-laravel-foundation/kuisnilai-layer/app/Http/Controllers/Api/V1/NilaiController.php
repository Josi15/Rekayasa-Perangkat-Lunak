<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Peran;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Nilai\BeriNilaiTugasRequest;
use App\Http\Requests\Api\Nilai\CatatNilaiKuisRequest;
use App\Http\Requests\Api\Nilai\DaftarNilaiMapelRequest;
use App\Http\Requests\Api\Nilai\DaftarNilaiRequest;
use App\Http\Requests\Api\Nilai\DaftarNilaiSiswaRequest;
use App\Http\Requests\Api\Nilai\UbahNilaiRequest;
use App\Http\Resources\NilaiResource;
use App\Models\Kuis;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Policies\NilaiPolicy;
use App\Services\NilaiService;
use App\Support\FilterDaftar;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class NilaiController extends ApiController
{
    public function __construct(private readonly NilaiService $layanan) {}

    /** POST /pengumpulan/{pengumpulan}/nilai */
    public function beriTugas(BeriNilaiTugasRequest $request, PengumpulanTugas $pengumpulan): JsonResponse
    {
        $nilai = $this->layanan->beriNilaiTugas($pengumpulan, $request->validated('nilai'), $request->validated('umpan_balik'));

        return $this->tampil($nilai, 201);
    }

    /** POST /kuis/{kuis}/nilai */
    public function catatKuis(CatatNilaiKuisRequest $request, Kuis $kuis): JsonResponse
    {
        $nilai = $this->layanan->catatNilaiKuis(
            $kuis, (int) $request->validated('id_siswa'), $request->validated('nilai'), $request->validated('umpan_balik')
        );

        return $this->tampil($nilai, 201);
    }

    /** PATCH /nilai/{nilai} — ubah nilai dan/atau umpan balik. */
    public function update(UbahNilaiRequest $request, Nilai $nilai): JsonResponse
    {
        return $this->tampil($this->layanan->ubah($nilai, $request->validated()));
    }

    /** GET /nilai/{nilai} */
    public function show(Nilai $nilai): JsonResponse
    {
        Gate::authorize('view', $nilai);

        return $this->tampil($nilai);
    }

    /** GET /nilai — dibatasi per peran. */
    public function index(DaftarNilaiRequest $request): AnonymousResourceCollection
    {
        return $this->daftar(NilaiPolicy::scope(Nilai::query(), $request->user()), $request);
    }

    /** GET /nilai/saya — khusus siswa. */
    public function saya(DaftarNilaiRequest $request): AnonymousResourceCollection
    {
        return $this->daftar(Nilai::query()->where('id_siswa', $request->user()->getKey()), $request);
    }

    /** GET /mapel/{mapel}/nilai — rekap per mapel (tugas + kuis), tanpa nilai akhir. */
    public function rekapMapel(DaftarNilaiMapelRequest $request, MataPelajaran $mapel): AnonymousResourceCollection
    {
        return $this->daftar(NilaiPolicy::dariMapel(Nilai::query(), $mapel->getKey()), $request);
    }

    /** GET /siswa/{siswa}/nilai — guru hanya melihat nilai pada mapel yang diampunya. */
    public function rekapSiswa(DaftarNilaiSiswaRequest $request, Pengguna $siswa): AnonymousResourceCollection
    {
        if ($siswa->peran !== Peran::Siswa) {
            throw new NotFoundHttpException('Pengguna bukan siswa.');
        }

        $query = NilaiPolicy::scope(Nilai::query(), $request->user())->where('id_siswa', $siswa->getKey());

        return $this->daftar($query, $request);
    }

    /** @param Builder<Nilai> $query */
    private function daftar(Builder $query, DaftarNilaiRequest $request): AnonymousResourceCollection
    {
        if ($request->filled('id_siswa')) {
            $query->where('id_siswa', $request->integer('id_siswa'));
        }
        if ($request->filled('id_kuis')) {
            $query->where('id_kuis', $request->integer('id_kuis'));
        }
        if ($request->filled('id_tugas')) {
            $query->whereIn('id_pengumpulan', PengumpulanTugas::query()->where('id_tugas', $request->integer('id_tugas'))->select('id_pengumpulan'));
        }
        if ($request->filled('id_mapel')) {
            NilaiPolicy::dariMapel($query, $request->integer('id_mapel'));
        }
        match ($request->input('sumber')) {
            'tugas' => $query->whereNotNull('id_pengumpulan'),
            'kuis' => $query->whereNotNull('id_kuis'),
            default => null,
        };

        $query->with(['siswa', 'pengumpulanTugas.tugas', 'kuis']);
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_nilai');

        return NilaiResource::collection($query->paginate($request->perPage()));
    }

    private function tampil(Nilai $nilai, int $status = 200): JsonResponse
    {
        $nilai->load(['siswa', 'pengumpulanTugas.tugas', 'kuis']);

        return NilaiResource::make($nilai)->response()->setStatusCode($status);
    }
}
