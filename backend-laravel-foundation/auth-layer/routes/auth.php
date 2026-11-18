<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use Illuminate\Support\Facades\Route;

/*
| Dimuat dari routes/api.php dengan prefix /api/v1/auth dan nama "api.v1.auth.".
| Endpoint publik dibatasi limiter "auth" (per IP); reset password memiliki limiter tambahan.
*/

Route::middleware('throttle:auth')->group(function (): void {
    Route::post('login', [AuthController::class, 'login'])->name('login');

    Route::middleware('throttle:password-reset')->group(function (): void {
        Route::post('forgot-password', [PasswordResetController::class, 'forgot'])->name('password.forgot');
        Route::post('reset-password/validate', [PasswordResetController::class, 'validateToken'])->name('password.validate');
        Route::post('reset-password', [PasswordResetController::class, 'reset'])->name('password.reset');
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('me', [AuthController::class, 'me'])->middleware('akun.aktif')->name('me');
    // logout sengaja TANPA akun.aktif: akun nonaktif tetap bisa mengakhiri sesinya.
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});
