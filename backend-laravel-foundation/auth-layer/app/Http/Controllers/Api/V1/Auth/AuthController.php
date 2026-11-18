<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Resources\PenggunaResource;
use App\Services\AuthService;
use App\Services\LoginThrottle;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

/**
 * Autentikasi SPA berbasis cookie sesi (Laravel Sanctum, mode stateful).
 * Alur klien: GET /sanctum/csrf-cookie -> POST /api/v1/auth/login (header X-XSRF-TOKEN).
 */
class AuthController extends ApiController
{
    /**
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request, AuthService $auth, LoginThrottle $throttle): JsonResponse
    {
        // Tanpa sesi (Origin/Referer bukan frontend terdaftar) cookie tidak akan pernah terbit.
        if (! $request->hasSession()) {
            return ApiResponse::error(
                'Login hanya dapat dilakukan dari aplikasi frontend yang terdaftar.',
                403,
                'frontend_not_allowed'
            );
        }

        $key = $throttle->key($request->login(), (string) $request->ip());

        if ($throttle->terkunci($key)) {
            return ApiResponse::error(
                'Terlalu banyak percobaan login. Coba lagi nanti.',
                429,
                'too_many_requests',
                null,
                ['Retry-After' => (string) $throttle->sisaDetik($key)]
            );
        }

        $pengguna = $auth->verifikasi($request->login(), $request->kataSandi());

        if ($pengguna === null) {
            $throttle->gagal($key);

            // Pesan sama untuk akun tidak ada maupun password salah (tanpa enumerasi akun).
            return ApiResponse::error(
                'Kredensial tidak valid.',
                422,
                'invalid_credentials',
                ['login' => ['Kredensial tidak valid.']]
            );
        }

        $throttle->bersihkan($key);

        Auth::guard('web')->login($pengguna);
        $request->session()->regenerate(); // cegah session fixation

        return PenggunaResource::make($pengguna)->response();
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return PenggunaResource::make($request->user())->response();
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->noContent();
    }
}
