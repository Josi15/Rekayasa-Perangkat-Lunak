<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Peran;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Master\DaftarKelasRequest;
use App\Http\Resources\KelasResource;
use App\Models\Kelas;
use App\Models\Pengguna;
use App\Models\SiswaKelas;
use App\Policies\KelasPolicy;
use App\Support\FilterDaftar;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SiswaKelasController extends ApiController
{
    /**
     * GET /siswa/{siswa}/kelas — kelas yang diikuti seorang siswa. Admin: semua; siswa: miliknya;
     * guru: hanya irisan dengan kelas yang diwalikan/diajarnya (KelasPolicy::scope).
     */
    public function index(DaftarKelasRequest $request, Pengguna $siswa): AnonymousResourceCollection
    {
        Gate::authorize('viewKelas', $siswa);

        if ($siswa->peran !== Peran::Siswa) {
            throw new NotFoundHttpException('Pengguna bukan siswa.');
        }

        $query = KelasPolicy::scope(Kelas::query(), $request->user())
            ->whereIn('id_kelas', SiswaKelas::query()->where('id_siswa', $siswa->getKey())->select('id_kelas'))
            ->with('wali')->withCount('siswa');

        FilterDaftar::cari($query, $request->cari(), ['nama_kelas']);
        FilterDaftar::status($query, $request->status(), 'diarsipkan_pada');
        FilterDaftar::urut($query, $request->urut(), $request->arah(), 'id_kelas');

        return KelasResource::collection($query->paginate($request->perPage()));
    }
}
