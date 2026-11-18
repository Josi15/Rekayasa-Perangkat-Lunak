<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

/**
 * Menyajikan index.html hasil build frontend React untuk semua path non-API (React Router di sisi klien).
 * Jalur /api/*, /sanctum/*, /storage/* dan path berekstensi berkas dikecualikan di routes/web.php.
 */
class SpaController
{
    public function __invoke(): Response
    {
        $path = (string) config('spa.index_path');

        if (! is_file($path) || ! is_readable($path)) {
            return response(
                'Frontend belum dibuild: berkas index.html tidak ditemukan. Jalankan scripts/build-frontend.sh (lihat docs/TAHAP-3.md).',
                503,
                ['Content-Type' => 'text/plain; charset=UTF-8', 'Cache-Control' => 'no-store'],
            );
        }

        // index.html merujuk aset ber-hash; jangan di-cache agar rilis baru langsung terpakai.
        return response((string) file_get_contents($path), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache, must-revalidate',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
        ]);
    }
}
