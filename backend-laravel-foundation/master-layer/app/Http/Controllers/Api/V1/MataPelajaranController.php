<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Master\BuatMapelRequest;
use App\Http\Requests\Api\Master\DaftarMapelRequest;
use App\Http\Requests\Api\Master\GantiGuruRequest;
use App\Http\Requests\Api\Master\UbahMapelRequest;
use App\Http\Resources\MataPelajaranResource;
use App\Models\MataPelajaran;
use App\Policies\MataPelajaranPolicy;
use App\Services\MataPelajaranService;
use App\Support\FilterDaftar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class MataPelajaranController extends ApiController
{
    public function __construct(private readonly MataPelajaranService $layanan) {}

    /** GET /mapel — admin: semua; guru: yang diampu; siswa: mapel pada jadwal kelasnya. */
    public function index(DaftarMapelRequest $request): AnonymousResourceCollection
    {
        $query = MataPelajaranPolicy::scope(MataPelajaran::query(), $request->user())->with('guru');

        FilterDaftar::cari($query, $request->cari(), ['nama_mapel']);
        FilterDaftar::status($query, $request->status(), 'diarsipkan_pada');

        if ($request->filled('id_guru')) {
            $query->where('id_guru', $request->integer('id_guru'));
        }

        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_mapel');

        return MataPelajaranResource::collection($query->paginate($request->perPage()));
    }

    /** POST /mapel (admin) */
    public function store(BuatMapelRequest $request): JsonResponse
    {
        return $this->tampil($this->layanan->buat($request->validated()), 201);
    }

    /** GET /mapel/{mapel} */
    public function show(MataPelajaran $mapel): JsonResponse
    {
        Gate::authorize('view', $mapel);

        return $this->tampil($mapel);
    }

    /** PATCH /mapel/{mapel} (admin) — nama saja. */
    public function update(UbahMapelRequest $request, MataPelajaran $mapel): JsonResponse
    {
        return $this->tampil($this->layanan->ubah($mapel, $request->validated()));
    }

    /** PUT /mapel/{mapel}/guru (admin) — jadwal mendatang ikut dialihkan ke guru baru. */
    public function gantiGuru(GantiGuruRequest $request, MataPelajaran $mapel): JsonResponse
    {
        return $this->tampil($this->layanan->gantiGuru($mapel, $request->integer('id_guru')));
    }

    /** POST /mapel/{mapel}/arsipkan (admin) */
    public function arsipkan(MataPelajaran $mapel): JsonResponse
    {
        Gate::authorize('arsipkan', $mapel);

        return $this->tampil($this->layanan->arsipkan($mapel));
    }

    /** POST /mapel/{mapel}/pulihkan (admin) */
    public function pulihkan(MataPelajaran $mapel): JsonResponse
    {
        Gate::authorize('pulihkan', $mapel);

        return $this->tampil($this->layanan->pulihkan($mapel));
    }

    private function tampil(MataPelajaran $mapel, int $status = 200): JsonResponse
    {
        return MataPelajaranResource::make($mapel->load('guru'))->response()->setStatusCode($status);
    }
}
