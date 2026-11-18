<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Peran;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Tugas\BuatTugasRequest;
use App\Http\Requests\Api\Tugas\DaftarTugasMapelRequest;
use App\Http\Requests\Api\Tugas\DaftarTugasRequest;
use App\Http\Requests\Api\Tugas\GantiLampiranTugasRequest;
use App\Http\Requests\Api\Tugas\UbahTugasRequest;
use App\Http\Resources\TugasResource;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Tugas;
use App\Policies\TugasPolicy;
use App\Services\PenyimpananTugas;
use App\Services\TugasService;
use App\Support\FilterDaftar;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TugasController extends ApiController
{
    public function __construct(
        private readonly TugasService $layanan,
        private readonly PenyimpananTugas $penyimpanan,
    ) {}

    /** GET /tugas — tugas yang tersedia bagi pemanggil (dibatasi peran); status=terbuka untuk yang masih menerima. */
    public function index(DaftarTugasRequest $request): AnonymousResourceCollection
    {
        $query = TugasPolicy::scope(Tugas::query(), $request->user());

        if ($request->filled('id_mapel')) {
            $query->where('id_mapel', $request->integer('id_mapel'));
        }

        return $this->daftar($query, $request);
    }

    /** GET /mapel/{mapel}/tugas */
    public function indexMapel(DaftarTugasMapelRequest $request, MataPelajaran $mapel): AnonymousResourceCollection
    {
        return $this->daftar($mapel->tugas()->getQuery(), $request);
    }

    /** POST /mapel/{mapel}/tugas */
    public function store(BuatTugasRequest $request, MataPelajaran $mapel): JsonResponse
    {
        $tugas = $this->layanan->buat($mapel, $request->safe()->only(['judul', 'instruksi', 'batas_waktu']), $request->file('lampiran'));

        return $this->tampil($tugas, $request->user(), 201);
    }

    /** GET /tugas/{tugas} */
    public function show(Request $request, Tugas $tugas): JsonResponse
    {
        Gate::authorize('view', $tugas);

        return $this->tampil($tugas, $request->user());
    }

    /** PATCH /tugas/{tugas} */
    public function update(UbahTugasRequest $request, Tugas $tugas): JsonResponse
    {
        return $this->tampil($this->layanan->ubah($tugas, $request->validated()), $request->user());
    }

    /** POST /tugas/{tugas}/tutup — menghentikan pengumpulan sekarang (idempotent). */
    public function tutup(Request $request, Tugas $tugas): JsonResponse
    {
        Gate::authorize('tutup', $tugas);

        return $this->tampil($this->layanan->tutup($tugas), $request->user());
    }

    /** DELETE /tugas/{tugas} — hanya bila belum ada pengumpulan (409 task_has_submissions). */
    public function destroy(Tugas $tugas): Response
    {
        Gate::authorize('delete', $tugas);

        $this->layanan->hapus($tugas);

        return $this->noContent();
    }

    /** GET /tugas/{tugas}/lampiran */
    public function lampiran(Tugas $tugas): StreamedResponse
    {
        Gate::authorize('view', $tugas);

        if ($tugas->lampiran === null) {
            throw new NotFoundHttpException('Tugas ini tidak memiliki lampiran.');
        }

        return $this->penyimpanan->unduh($tugas->lampiran, 'lampiran-'.$tugas->judul);
    }

    /** POST /tugas/{tugas}/lampiran (multipart: lampiran) */
    public function gantiLampiran(GantiLampiranTugasRequest $request, Tugas $tugas): JsonResponse
    {
        return $this->tampil($this->layanan->gantiLampiran($tugas, $request->file('lampiran')), $request->user());
    }

    /** DELETE /tugas/{tugas}/lampiran */
    public function hapusLampiran(Request $request, Tugas $tugas): JsonResponse
    {
        Gate::authorize('update', $tugas);

        return $this->tampil($this->layanan->hapusLampiran($tugas), $request->user());
    }

    /** @param Builder<Tugas> $query */
    private function daftar(Builder $query, DaftarTugasRequest $request): AnonymousResourceCollection
    {
        match ($request->status()) {
            'terbuka' => $query->terbuka(),
            'tertutup' => $query->tertutup(),
            default => null,
        };

        FilterDaftar::cari($query, $request->cari(), ['judul', 'instruksi']);
        $this->muat($query, $request->user());
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_tugas');

        return TugasResource::collection($query->paginate($request->perPage()));
    }

    /** Siswa: hanya pengumpulan miliknya; guru/admin: jumlah pengumpulan. @param Builder<Tugas> $query */
    private function muat(Builder $query, Pengguna $pengguna): void
    {
        $query->with('mataPelajaran');

        if ($pengguna->peran === Peran::Siswa) {
            $query->with(['pengumpulan' => fn ($q) => $q->where('id_siswa', $pengguna->getKey())]);
        } else {
            $query->withCount('pengumpulan');
        }
    }

    private function tampil(Tugas $tugas, Pengguna $pengguna, int $status = 200): JsonResponse
    {
        $tugas->load('mataPelajaran');

        if ($pengguna->peran === Peran::Siswa) {
            $tugas->load(['pengumpulan' => fn ($q) => $q->where('id_siswa', $pengguna->getKey())]);
        } else {
            $tugas->loadCount('pengumpulan');
        }

        return TugasResource::make($tugas)->response()->setStatusCode($status);
    }
}
