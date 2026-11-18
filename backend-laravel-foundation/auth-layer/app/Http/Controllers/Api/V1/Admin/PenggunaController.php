<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\DaftarPenggunaRequest;
use App\Http\Requests\Api\Master\BuatPenggunaRequest;
use App\Http\Requests\Api\Master\UbahPenggunaRequest;
use App\Http\Resources\PenggunaResource;
use App\Models\Pengguna;
use App\Services\PenggunaService;
use App\Support\FilterDaftar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Manajemen pengguna (admin). Dilindungi dua lapis: middleware role:admin pada route
 * dan Policy/FormRequest di sini (defense in depth).
 */
class PenggunaController extends ApiController
{
    public function __construct(private readonly PenggunaService $layanan) {}

    /** GET /admin/pengguna?cari=&peran=&status=&urut=&arah=&page=&per_page= */
    public function index(DaftarPenggunaRequest $request): AnonymousResourceCollection
    {
        $query = Pengguna::query();

        FilterDaftar::cari($query, $request->cari(), ['username', 'nisn', 'nip', 'email']);
        FilterDaftar::status($query, $request->status(), 'nonaktif_pada');

        if ($request->filled('peran')) {
            $query->where('peran', $request->string('peran')->toString());
        }

        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_pengguna');

        return PenggunaResource::collection($query->paginate($request->perPage()));
    }

    /** POST /admin/pengguna */
    public function store(BuatPenggunaRequest $request): JsonResponse
    {
        $pengguna = $this->layanan->buat($request->validated());

        return PenggunaResource::make($pengguna)->response()->setStatusCode(201);
    }

    /** GET /admin/pengguna/{pengguna} */
    public function show(Pengguna $pengguna): JsonResponse
    {
        Gate::authorize('view', $pengguna);

        return PenggunaResource::make($pengguna)->response();
    }

    /** PATCH /admin/pengguna/{pengguna} */
    public function update(UbahPenggunaRequest $request, Pengguna $pengguna): JsonResponse
    {
        return PenggunaResource::make($this->layanan->ubah($pengguna, $request->validated()))->response();
    }

    /** POST /admin/pengguna/{pengguna}/nonaktifkan — 409 bila guru masih punya tanggungan aktif. */
    public function nonaktifkan(Pengguna $pengguna): JsonResponse
    {
        Gate::authorize('nonaktifkan', $pengguna);

        return PenggunaResource::make($this->layanan->nonaktifkan($pengguna))->response();
    }

    /** POST /admin/pengguna/{pengguna}/aktifkan */
    public function aktifkan(Pengguna $pengguna): JsonResponse
    {
        Gate::authorize('aktifkan', $pengguna);

        return PenggunaResource::make($this->layanan->aktifkan($pengguna))->response();
    }
}
