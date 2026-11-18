<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Master\BuatKelasRequest;
use App\Http\Requests\Api\Master\DaftarKelasRequest;
use App\Http\Requests\Api\Master\GantiWaliRequest;
use App\Http\Requests\Api\Master\UbahKelasRequest;
use App\Http\Resources\KelasResource;
use App\Models\Kelas;
use App\Policies\KelasPolicy;
use App\Services\KelasService;
use App\Support\FilterDaftar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class KelasController extends ApiController
{
    public function __construct(private readonly KelasService $layanan) {}

    /**
     * GET /kelas — hanya kelas yang boleh dilihat peran pemanggil:
     * siswa = kelas yang diikuti, guru = wali/pengajar, admin = semua.
     */
    public function index(DaftarKelasRequest $request): AnonymousResourceCollection
    {
        $query = KelasPolicy::scope(Kelas::query(), $request->user())->with('wali')->withCount('siswa');

        FilterDaftar::cari($query, $request->cari(), ['nama_kelas']);
        FilterDaftar::status($query, $request->status(), 'diarsipkan_pada');

        if ($request->filled('id_wali')) {
            $query->where('id_wali', $request->integer('id_wali'));
        }

        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_kelas');

        return KelasResource::collection($query->paginate($request->perPage()));
    }

    /** POST /kelas (admin) */
    public function store(BuatKelasRequest $request): JsonResponse
    {
        return $this->tampil($this->layanan->buat($request->validated()), 201);
    }

    /** GET /kelas/{kelas} */
    public function show(Kelas $kelas): JsonResponse
    {
        Gate::authorize('view', $kelas);

        return $this->tampil($kelas);
    }

    /** PATCH /kelas/{kelas} (admin) — nama saja. */
    public function update(UbahKelasRequest $request, Kelas $kelas): JsonResponse
    {
        return $this->tampil($this->layanan->ubah($kelas, $request->validated()));
    }

    /** PUT /kelas/{kelas}/wali (admin) */
    public function gantiWali(GantiWaliRequest $request, Kelas $kelas): JsonResponse
    {
        return $this->tampil($this->layanan->gantiWali($kelas, $request->integer('id_wali')));
    }

    /** POST /kelas/{kelas}/arsipkan (admin) — 409 bila masih ada jadwal mendatang. */
    public function arsipkan(Kelas $kelas): JsonResponse
    {
        Gate::authorize('arsipkan', $kelas);

        return $this->tampil($this->layanan->arsipkan($kelas));
    }

    /** POST /kelas/{kelas}/pulihkan (admin) */
    public function pulihkan(Kelas $kelas): JsonResponse
    {
        Gate::authorize('pulihkan', $kelas);

        return $this->tampil($this->layanan->pulihkan($kelas));
    }

    private function tampil(Kelas $kelas, int $status = 200): JsonResponse
    {
        $kelas->load('wali')->loadCount('siswa');

        return KelasResource::make($kelas)->response()->setStatusCode($status);
    }
}
