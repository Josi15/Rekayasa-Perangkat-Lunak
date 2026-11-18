<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Memberi setiap request sebuah ID (X-Request-Id). ID dari klien dipakai bila
 * formatnya aman, jika tidak dibuatkan UUID baru. ID dimasukkan ke Context sehingga
 * otomatis ikut tercatat di log dan muncul pada respons error.
 */
class AssignRequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $incoming = (string) $request->header('X-Request-Id', '');

        $requestId = preg_match('/^[A-Za-z0-9._-]{8,64}$/', $incoming) === 1
            ? $incoming
            : (string) Str::uuid();

        Context::add('request_id', $requestId);

        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
