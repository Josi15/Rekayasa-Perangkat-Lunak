<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Tugas\DaftarPengumpulanRequest;
use App\Http\Requests\Api\Tugas\DaftarPengumpulanSayaRequest;
use App\Http\Requests\Api\Tugas\KumpulTugasRequest;
use App\Http\Resources\PengumpulanResource;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Tugas;
use App\Services\PengumpulanService;
use App\Services\PenyimpananTugas;
use App\Support\FilterDaftar;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PengumpulanController extends ApiController
{
    public function __construct(
        private readonly PengumpulanService $layanan,
        private readonly PenyimpananTugas $penyimpanan,
    ) {}

    /** POST /tugas/{tugas}/pengumpulan (siswa; multipart: file) */
    public function store(KumpulTugasRequest $request, Tugas $tugas): JsonResponse
    {
        $p = $this->layanan->kumpul($tugas, $request->user(), $request->file('file'));

        return PengumpulanResource::make($p->load('tugas'))->response()->setStatusCode(201);
    }

    /** POST /tugas/{tugas}/pengumpulan/revisi (siswa; multipart: file) */
    public function revisi(KumpulTugasRequest $request, Tugas $tugas): JsonResponse
    {
        $p = $this->layanan->revisi($tugas, $request->user(), $request->file('file'));

        return PengumpulanResource::make($p->load('tugas'))->response();
    }

    /** GET /tugas/{tugas}/pengumpulan/saya — status pengumpulan milik sendiri pada satu tugas. */
    public function saya(Request $request, Tugas $tugas): JsonResponse
    {
        Gate::authorize('view', $tugas);

        $p = PengumpulanTugas::query()->with('tugas')
            ->where('id_tugas', $tugas->id_tugas)->where('id_siswa', $request->user()->getKey())->first();

        if ($p === null) {
            throw new NotFoundHttpException('Anda belum mengumpulkan tugas ini.');
        }

        return PengumpulanResource::make($p)->response();
    }

    /** GET /pengumpulan/saya — seluruh pengumpulan milik siswa yang login. */
    public function daftarSaya(DaftarPengumpulanSayaRequest $request): AnonymousResourceCollection
    {
        $query = PengumpulanTugas::query()->with('tugas')->where('id_siswa', $request->user()->getKey());

        return $this->daftar($query, $request);
    }

    /** GET /tugas/{tugas}/pengumpulan — daftar pengumpulan satu tugas (guru pengampu, admin). */
    public function index(DaftarPengumpulanRequest $request, Tugas $tugas): AnonymousResourceCollection
    {
        $query = $tugas->pengumpulan()->getQuery()->with('siswa');

        if (($cari = $request->cari()) !== null) {
            $siswa = Pengguna::query()->select('id_pengguna');
            FilterDaftar::cari($siswa, $cari, ['username', 'nisn']);
            $query->whereIn('id_siswa', $siswa);
        }

        return $this->daftar($query, $request);
    }

    /** GET /pengumpulan/{pengumpulan} — admin, pemilik, guru pengampu; siswa lain 403. */
    public function show(PengumpulanTugas $pengumpulan): JsonResponse
    {
        Gate::authorize('view', $pengumpulan);

        return PengumpulanResource::make($pengumpulan->load(['siswa', 'tugas']))->response();
    }

    /** GET /pengumpulan/{pengumpulan}/file */
    public function unduh(PengumpulanTugas $pengumpulan): StreamedResponse
    {
        Gate::authorize('view', $pengumpulan);

        $pengumpulan->load('tugas');

        return $this->penyimpanan->unduh($pengumpulan->jawaban_file, 'jawaban-'.$pengumpulan->tugas->judul.'-'.$pengumpulan->id_pengumpulan);
    }

    /** @param Builder<PengumpulanTugas> $query */
    private function daftar(Builder $query, DaftarPengumpulanRequest $request): AnonymousResourceCollection
    {
        if ($request->status() !== 'semua') {
            $query->where('status', $request->status());
        }

        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_pengumpulan');

        return PengumpulanResource::collection($query->paginate($request->perPage()));
    }
}
