<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Master\DaftarAnggotaRequest;
use App\Http\Requests\Api\Master\TambahAnggotaRequest;
use App\Http\Resources\PenggunaRingkasResource;
use App\Models\Kelas;
use App\Models\Pengguna;
use App\Services\KeanggotaanKelasService;
use App\Support\FilterDaftar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/** Keanggotaan siswa pada kelas (siswa_kelas). */
class KelasAnggotaController extends ApiController
{
    public function __construct(private readonly KeanggotaanKelasService $layanan) {}

    /** GET /kelas/{kelas}/anggota */
    public function index(DaftarAnggotaRequest $request, Kelas $kelas): AnonymousResourceCollection
    {
        $query = $kelas->siswa();

        FilterDaftar::cari($query, $request->cari(), ['username', 'nisn']);
        FilterDaftar::status($query, $request->status(), 'nonaktif_pada');
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_pengguna');

        return PenggunaRingkasResource::collection($query->paginate($request->perPage()));
    }

    /** POST /kelas/{kelas}/anggota {id_siswa:[..]} — atomik; 409 already_member bila ada yang sudah anggota. */
    public function store(TambahAnggotaRequest $request, Kelas $kelas): JsonResponse
    {
        $anggota = $this->layanan->tambah($kelas, array_map('intval', $request->validated('id_siswa')));

        return PenggunaRingkasResource::collection($anggota)->response()->setStatusCode(201);
    }

    /** DELETE /kelas/{kelas}/anggota/{siswa} */
    public function destroy(Request $request, Kelas $kelas, Pengguna $siswa): Response
    {
        Gate::authorize('kelolaAnggota', $kelas);

        $this->layanan->keluarkan($kelas, $siswa, $request->user());

        return $this->noContent();
    }
}
