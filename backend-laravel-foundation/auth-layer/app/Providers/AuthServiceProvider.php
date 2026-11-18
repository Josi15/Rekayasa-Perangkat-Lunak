<?php

namespace App\Providers;

use App\Models\Pengguna;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use RuntimeException;

/**
 * Konfigurasi autentikasi LMS Simba: limiter, aturan password, tautan reset ke SPA.
 * Policy ditemukan otomatis oleh Laravel (App\Policies\{Model}Policy).
 */
class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Di luar konsol (agar `composer install`/package:discover saat deploy tidak terblokir):
        // aplikasi menolak melayani request bila konfigurasi sesi produksi lemah.
        if (! $this->app->runningInConsole()) {
            $this->pastikanSesiAmanDiProduksi();
        }

        // Batas kasar per IP untuk endpoint publik (login, reset). Penguncian per akun ada di LoginThrottle.
        RateLimiter::for('auth', fn (Request $request): Limit => Limit::perMinute(30)->by('auth:'.$request->ip()));

        // Reset password: per IP dan per email. Berlaku sama untuk email terdaftar maupun tidak,
        // sehingga respons 429 tidak membocorkan keberadaan akun.
        RateLimiter::for('password-reset', fn (Request $request): array => [
            Limit::perMinute(5)->by('reset-ip:'.$request->ip()),
            Limit::perHour(5)->by('reset-email:'.$request->string('email')->lower()->toString()),
        ]);

        Password::defaults(function (): Password {
            $aturan = Password::min(10)->letters()->mixedCase()->numbers();

            return $this->app->isProduction() ? $aturan->uncompromised() : $aturan;
        });

        // Masa berlaku token reset diatur dari config simba (default 60 menit).
        config(['auth.passwords.users.expire' => (int) config('simba.password_reset.expire_minutes', 60)]);

        // Tautan di email mengarah ke halaman reset pada SPA, bukan ke route backend.
        ResetPassword::createUrlUsing(function (Pengguna $pengguna, string $token): string {
            return rtrim((string) config('simba.frontend_url'), '/').'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $pengguna->getEmailForPasswordReset(),
            ]);
        });
    }

    /**
     * Gagal tertutup: di produksi, cookie sesi wajib Secure + HttpOnly + SameSite lax/strict,
     * payload sesi terenkripsi, dan APP_DEBUG mati. Tidak ada efek di environment lain.
     *
     * @throws RuntimeException
     */
    public function pastikanSesiAmanDiProduksi(): void
    {
        if (! $this->app->isProduction()) {
            return;
        }

        $masalah = [];

        if (config('session.secure') !== true) {
            $masalah[] = 'SESSION_SECURE_COOKIE harus true (HTTPS)';
        }
        if (config('session.http_only') !== true) {
            $masalah[] = 'SESSION_HTTP_ONLY harus true';
        }
        if (! in_array(strtolower((string) config('session.same_site')), ['lax', 'strict'], true)) {
            $masalah[] = 'SESSION_SAME_SITE harus lax atau strict';
        }
        if (config('session.encrypt') !== true) {
            $masalah[] = 'SESSION_ENCRYPT harus true';
        }
        if (config('app.debug')) {
            $masalah[] = 'APP_DEBUG harus false';
        }

        if ($masalah !== []) {
            throw new RuntimeException('Konfigurasi sesi produksi tidak aman: '.implode('; ', $masalah).'.');
        }
    }
}
