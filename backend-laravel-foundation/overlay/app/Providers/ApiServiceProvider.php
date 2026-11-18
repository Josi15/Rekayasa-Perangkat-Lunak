<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class ApiServiceProvider extends ServiceProvider
{
    /**
     * Sesi PostgreSQL dipaksa UTC (kecuali DB_TIMEZONE/konfigurasi eksplisit). Laravel menulis waktu sebagai
     * string tanpa offset; bila zona sesi server bukan UTC (mis. PostgreSQL di Windows mengikuti zona OS),
     * kolom timestamptz bergeser berjam-jam dan logika tenggat/jendela check-in menjadi salah.
     */
    public function register(): void
    {
        if (config('database.connections.pgsql.timezone') === null) {
            config(['database.connections.pgsql.timezone' => env('DB_TIMEZONE', 'UTC')]);
        }
    }

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request): Limit {
            $perMinute = max(1, (int) config('api.rate_limit', 60));

            return Limit::perMinute($perMinute)
                ->by($request->user()?->getAuthIdentifier() ?: $request->ip());
        });
    }
}
