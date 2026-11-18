<?php

namespace App\Http\Middleware;

use App\Enums\Peran;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Pembatas peran: ->middleware('role:admin') atau ->middleware('role:admin,guru').
 * Peran dibaca dari model pengguna yang terautentikasi (database), TIDAK dari input klien.
 * Pasang setelah auth:sanctum. Tanpa pengguna -> 401, peran salah -> 403.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$peran): Response
    {
        $pengguna = $request->user();

        if ($pengguna === null) {
            throw new AuthenticationException;
        }

        $diizinkan = array_map(
            fn (string $nilai): Peran => Peran::tryFrom($nilai)
                ?? throw new InvalidArgumentException("Peran tidak dikenal pada middleware role: {$nilai}"),
            $peran
        );

        if (! in_array($pengguna->peran, $diizinkan, true)) {
            throw new AccessDeniedHttpException('This action is unauthorized.');
        }

        return $next($request);
    }
}
