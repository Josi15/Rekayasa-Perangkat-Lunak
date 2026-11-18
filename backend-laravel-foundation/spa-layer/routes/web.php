<?php

use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — LMS Simba (frontend React disajikan Laravel, satu origin)
|--------------------------------------------------------------------------
| Semua GET non-API diarahkan ke index.html agar React Router bekerja saat refresh/tautan langsung.
| Dikecualikan (tetap ditangani Laravel/404 asli, bukan HTML):
|   - api/*, sanctum/*, storage/*, up (health bawaan), assets/* (aset Vite yang hilang -> 404, bukan HTML)
|   - path berawalan titik (.well-known, .env, dst.)
|   - path yang berakhir dengan ekstensi berkas (mis. /foo.js, /x.pdf): berkas statis yang ada dilayani web server
|     sebelum sampai ke sini; yang tidak ada -> 404.
| Berkas privat (storage/app/private) tidak berada di public/ dan hanya keluar lewat endpoint API ber-otorisasi.
| Sesi/cookie/CSRF web tidak dipakai untuk menyajikan HTML ini (cookie sesi dibuat lewat /sanctum/csrf-cookie & login).
*/
Route::get('/{any?}', SpaController::class)
    ->where('any', '(?!api(?:/|$)|sanctum(?:/|$)|storage(?:/|$)|assets(?:/|$)|up$|\.)(?!.*\.[A-Za-z0-9]+$).*')
    ->withoutMiddleware([
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ])
    ->name('spa');
