<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Kuis\BuatKuisRequest;
use App\Http\Requests\Api\Kuis\DaftarKuisMapelRequest;
use App\Http\Requests\Api\Kuis\DaftarKuisRequest;
use App\Http\Requests\Api\Kuis\UbahKuisRequest;
use App\Http\Resources\KuisResource;
use App\Models\Kuis;
use App\Models\MataPelajaran;
use App\Policies\KuisPolicy;
use App\Services\KuisService;
use App\Support\FilterDaftar;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class KuisController extends ApiController
{
    public function __construct(private readonly KuisService $layanan) {}

    /** GET /kuis */
    public function index(DaftarKuisRequest $request): AnonymousResourceCollection
    {
        $query = KuisPolicy::scope(Kuis::query(), $request->user());

        if ($request->filled('id_mapel')) {
            $query->where('id_mapel', $request->integer('id_mapel'));
        }

        return $this->daftar($query, $request);
    }

    /** GET /mapel/{mapel}/kuis */
    public function indexMapel(DaftarKuisMapelRequest $request, MataPelajaran $mapel): AnonymousResourceCollection
    {
        return $this->daftar(Kuis::query()->where('id_mapel', $mapel->getKey()), $request);
    }

    /** POST /mapel/{mapel}/kuis */
    public function store(BuatKuisRequest $request, MataPelajaran $mapel): JsonResponse
    {
        $kuis = $this->layanan->buat($mapel, $request->safe()->only(['judul', 'tautan_google_form']));

        return KuisResource::make($kuis->load('mataPelajaran')->loadCount('nilai'))->response()->setStatusCode(201);
    }

    /** GET /kuis/{kuis} */
    public function show(Request $request, Kuis $kuis): JsonResponse
    {
        Gate::authorize('view', $kuis);

        return KuisResource::make($kuis->load('mataPelajaran')->loadCount('nilai'))->response();
    }

    /** PATCH /kuis/{kuis} */
    public function update(UbahKuisRequest $request, Kuis $kuis): JsonResponse
    {
        $kuis = $this->layanan->ubah($kuis, $request->validated());

        return KuisResource::make($kuis->load('mataPelajaran')->loadCount('nilai'))->response();
    }

    /** DELETE /kuis/{kuis} — hanya bila belum ada nilai (409 quiz_has_grades). */
    public function destroy(Kuis $kuis): Response
    {
        Gate::authorize('delete', $kuis);

        $this->layanan->hapus($kuis);

        return $this->noContent();
    }

    /** @param Builder<Kuis> $query */
    private function daftar(Builder $query, DaftarKuisRequest $request): AnonymousResourceCollection
    {
        FilterDaftar::cari($query, $request->cari(), ['judul']);
        $query->with('mataPelajaran')->withCount('nilai');
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_kuis');

        return KuisResource::collection($query->paginate($request->perPage()));
    }
}
