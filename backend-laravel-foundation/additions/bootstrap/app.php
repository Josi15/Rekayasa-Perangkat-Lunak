<?php

use App\Exceptions\ApiExceptionRenderer;
use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\EnsureAkunAktif;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA: sesi + CSRF untuk request dari domain frontend terdaftar
        // (SANCTUM_STATEFUL_DOMAINS). Dipanggil lebih dulu agar middleware di bawah berada di depannya.
        $middleware->statefulApi();

        // Di belakang reverse proxy / load balancer (produksi), IP klien & skema HTTPS hanya benar bila proxy dipercaya.
        // TRUSTED_PROXIES: daftar IP/CIDR dipisah koma, atau "*" HANYA bila server tidak dapat dijangkau langsung dari internet.
        // Kosong (bawaan) = tidak ada proxy yang dipercaya. Tanpa ini, rate limiter per-IP melihat satu IP proxy untuk semua klien.
        $proxies = trim((string) env('TRUSTED_PROXIES', ''));
        if ($proxies !== '') {
            $middleware->trustProxies(at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
        }

        // Urutan penting: request id dulu agar ikut tercatat di semua error/log.
        // AssignRequestId dipasang global (bukan grup api) agar 404 route tak dikenal pun membawa request_id.
        $middleware->prepend(AssignRequestId::class);
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        // Rate limiter "api" didefinisikan di App\Providers\ApiServiceProvider.
        $middleware->throttleApi();

        // ->middleware('role:admin,guru')
        $middleware->alias([
            'role' => EnsureRole::class,
            'akun.aktif' => EnsureAkunAktif::class,
        ]);

        // Cek akun aktif & peran HARUS sebelum SubstituteBindings: kalau tidak, ID yang tidak ada memberi 404
        // (membocorkan keberadaan data) sebelum akun nonaktif/peran salah sempat ditolak 401/403.
        $middleware->prependToPriorityList(before: SubstituteBindings::class, prepend: EnsureRole::class);
        $middleware->prependToPriorityList(before: EnsureRole::class, prepend: EnsureAkunAktif::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        ApiExceptionRenderer::register($exceptions);
    })
    ->create();
