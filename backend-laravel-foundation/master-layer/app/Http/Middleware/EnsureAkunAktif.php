<?php

namespace App\Http\Middleware;

use App\Models\Pengguna;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Memutus sesi akun yang dinonaktifkan di tengah sesi (sebagai lapisan kedua; lapisan pertama:
 * PenggunaService menghapus sesi saat menonaktifkan). Pasang setelah auth:sanctum.
 */
class EnsureAkunAktif
{
    public function handle(Request $request, Closure $next): Response
    {
        $pengguna = $request->user();

        if ($pengguna instanceof Pengguna && ! $pengguna->aktif()) {
            if ($request->hasSession()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
            }

            throw new AuthenticationException('Akun dinonaktifkan.');
        }

        return $next($request);
    }
}
