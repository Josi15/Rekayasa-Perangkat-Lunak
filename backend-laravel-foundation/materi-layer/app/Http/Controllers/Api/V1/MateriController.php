<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Materi\BuatMateriRequest;
use App\Http\Requests\Api\Materi\DaftarMateriRequest;
use App\Http\Requests\Api\Materi\GantiFileMateriRequest;
use App\Http\Requests\Api\Materi\UbahMateriRequest;
use App\Http\Resources\MateriResource;
use App\Models\MataPelajaran;
use App\Models\Materi;
use App\Services\MateriService;
use App\Services\PenyimpananMateri;
use App\Support\FilterDaftar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MateriController extends ApiController
{
    public function __construct(
        private readonly MateriService $layanan,
        private readonly PenyimpananMateri $penyimpanan,
    ) {}

    /** GET /mapel/{mapel}/materi */
    public function index(DaftarMateriRequest $request, MataPelajaran $mapel): AnonymousResourceCollection
    {
        $query = $mapel->materi()->getQuery();

        FilterDaftar::cari($query, $request->cari(), ['judul']);
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_materi');

        return MateriResource::collection($query->paginate($request->perPage()));
    }

    /** POST /mapel/{mapel}/materi */
    public function store(BuatMateriRequest $request, MataPelajaran $mapel): JsonResponse
    {
        $materi = $this->layanan->buat($mapel, $request->validated('judul'), $request->file('file'));

        return MateriResource::make($materi->load('mataPelajaran'))->response()->setStatusCode(201);
    }

    /** GET /materi/{materi} */
    public function show(Materi $materi): JsonResponse
    {
        Gate::authorize('view', $materi);

        return MateriResource::make($materi->load('mataPelajaran'))->response();
    }

    /** PATCH /materi/{materi} */
    public function update(UbahMateriRequest $request, Materi $materi): JsonResponse
    {
        $materi = $this->layanan->ubahJudul($materi, $request->validated('judul'));

        return MateriResource::make($materi->load('mataPelajaran'))->response();
    }

    /** POST /materi/{materi}/file — mengganti file materi. */
    public function gantiFile(GantiFileMateriRequest $request, Materi $materi): JsonResponse
    {
        $materi = $this->layanan->gantiFile($materi, $request->file('file'));

        return MateriResource::make($materi->load('mataPelajaran'))->response();
    }

    /** DELETE /materi/{materi} — menghapus baris dan file. */
    public function destroy(Materi $materi): Response
    {
        Gate::authorize('delete', $materi);

        $this->layanan->hapus($materi);

        return $this->noContent();
    }

    /** GET /materi/{materi}/file — unduh; izin sama dengan melihat materi. */
    public function unduh(Materi $materi): StreamedResponse
    {
        Gate::authorize('view', $materi);

        return $this->penyimpanan->unduh($materi);
    }
}
