<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Master\UbahProfilRequest;
use App\Http\Resources\PenggunaResource;
use App\Services\PenggunaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Profil akun milik pengguna yang sedang login (selalu dirinya sendiri; tidak ada id di URL). */
class ProfilController extends ApiController
{
    public function __construct(private readonly PenggunaService $layanan) {}

    /** GET /profil */
    public function show(Request $request): JsonResponse
    {
        return PenggunaResource::make($request->user())->response();
    }

    /** PATCH /profil — hanya email & password. */
    public function update(UbahProfilRequest $request): JsonResponse
    {
        $sesi = $request->hasSession() ? $request->session()->getId() : null;

        $pengguna = $this->layanan->ubahProfil($request->user(), $request->validated(), $sesi);

        return PenggunaResource::make($pengguna)->response();
    }
}
