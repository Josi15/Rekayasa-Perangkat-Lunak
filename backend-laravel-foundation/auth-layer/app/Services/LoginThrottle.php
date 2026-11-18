<?php

namespace App\Services;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Pembatas login gagal per kombinasi (login, IP). Hanya kegagalan yang dihitung;
 * login berhasil mereset hitungan. Kunci di-hash agar identitas login tidak tersimpan di cache.
 */
class LoginThrottle
{
    public function key(string $login, string $ip): string
    {
        return 'login:'.hash('sha256', Str::lower($login).'|'.$ip);
    }

    public function terkunci(string $key): bool
    {
        return RateLimiter::tooManyAttempts($key, (int) config('simba.login.max_attempts', 5));
    }

    public function sisaDetik(string $key): int
    {
        return RateLimiter::availableIn($key);
    }

    public function gagal(string $key): void
    {
        RateLimiter::hit($key, (int) config('simba.login.decay_seconds', 300));
    }

    public function bersihkan(string $key): void
    {
        RateLimiter::clear($key);
    }
}
