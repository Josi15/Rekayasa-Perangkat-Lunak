<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CakupanPengumuman;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Pengumuman\BuatPengumumanRequest;
use App\Http\Requests\Api\Pengumuman\DaftarPengumumanMapelRequest;
use App\Http\Requests\Api\Pengumuman\DaftarPengumumanRequest;
use App\Http\Requests\Api\Pengumuman\UbahPengumumanRequest;
use App\Http\Resources\PengumumanResource;
use App\Models\MataPelajaran;
use App\Models\Pengumuman;
use App\Policies\PengumumanPolicy;
use App\Services\PengumumanService;
use App\Support\FilterDaftar;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class PengumumanController extends ApiController
{
    public function __construct(private readonly PengumumanService $layanan) {}

    /** GET /pengumuman — hanya yang boleh dibaca pemanggil. */
    public function index(DaftarPengumumanRequest $request): AnonymousResourceCollection
    {
        $query = PengumumanPolicy::scope(Pengumuman::query(), $request->user());

        if ($request->filled('cakupan')) {
            $query->where('cakupan', $request->string('cakupan')->toString());
        }
        if ($request->filled('id_mapel')) {
            $query->where('id_mapel', $request->integer('id_mapel'));
        }

        return $this->daftar($query, $request);
    }

    /** GET /mapel/{mapel}/pengumuman — pengumuman cakupan mapel untuk satu mapel. */
    public function indexMapel(DaftarPengumumanMapelRequest $request, MataPelajaran $mapel): AnonymousResourceCollection
    {
        $query = Pengumuman::query()
            ->where('cakupan', CakupanPengumuman::Mapel->value)
            ->where('id_mapel', $mapel->getKey());

        return $this->daftar($query, $request);
    }

    /** POST /pengumuman */
    public function store(BuatPengumumanRequest $request): JsonResponse
    {
        $data = $request->safe()->only(['judul', 'isi', 'cakupan', 'id_mapel']);

        // pertahanan kedua setelah authorize() FormRequest: cek ulang dengan mapel yang sudah tervalidasi
        if ($data['cakupan'] === CakupanPengumuman::Mapel->value) {
            Gate::authorize('create', [Pengumuman::class, MataPelajaran::query()->findOrFail((int) $data['id_mapel'])]);
        } else {
            Gate::authorize('create', Pengumuman::class);
        }

        $p = $this->layanan->buat($request->user(), $data);

        return $this->tampil($p, 201);
    }

    /** GET /pengumuman/{pengumuman} */
    public function show(Pengumuman $pengumuman): JsonResponse
    {
        Gate::authorize('view', $pengumuman);

        return $this->tampil($pengumuman);
    }

    /** PATCH /pengumuman/{pengumuman} — judul/isi saja. */
    public function update(UbahPengumumanRequest $request, Pengumuman $pengumuman): JsonResponse
    {
        return $this->tampil($this->layanan->ubah($pengumuman, $request->validated()));
    }

    /** DELETE /pengumuman/{pengumuman} — permanen (tidak ada kolom arsip pada ERD). */
    public function destroy(Request $request, Pengumuman $pengumuman): Response
    {
        Gate::authorize('delete', $pengumuman);

        $this->layanan->hapus($pengumuman);

        return $this->noContent();
    }

    /** @param Builder<Pengumuman> $query */
    private function daftar(Builder $query, DaftarPengumumanRequest $request): AnonymousResourceCollection
    {
        FilterDaftar::cari($query, $request->cari(), ['judul', 'isi']);
        $query->with(['penulis', 'mataPelajaran']);
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_pengumuman');

        return PengumumanResource::collection($query->paginate($request->perPage()));
    }

    private function tampil(Pengumuman $p, int $status = 200): JsonResponse
    {
        return PengumumanResource::make($p->load(['penulis', 'mataPelajaran']))->response()->setStatusCode($status);
    }
}
