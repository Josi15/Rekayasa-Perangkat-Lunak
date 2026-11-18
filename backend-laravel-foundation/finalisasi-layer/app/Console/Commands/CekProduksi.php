<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * php artisan simba:cek-produksi
 *
 * Memeriksa KONFIGURASI AKTIF terhadap persyaratan minimum produksi. Hanya membaca konfigurasi:
 * tidak menyentuh database, tidak menjalankan migration, tidak mencetak nilai rahasia.
 * GAGAL (exit 1) bila ada pemeriksaan wajib yang tidak terpenuhi; PERINGATAN tidak menggagalkan.
 * Lulus pemeriksaan ini BUKAN bukti sistem aman/siap produksi; ini hanya mencegah salah konfigurasi yang umum.
 */
class CekProduksi extends Command
{
    protected $signature = 'simba:cek-produksi';

    protected $description = 'Periksa konfigurasi aktif terhadap persyaratan minimum produksi (tanpa menyentuh database).';

    /** @var list<array{0: string, 1: string, 2: string}> status, label, detail */
    private array $hasil = [];

    public function handle(): int
    {
        $this->hasil = [];

        $this->wajib('APP_ENV = production', config('app.env') === 'production', 'APP_ENV='.config('app.env'));
        $this->wajib('APP_DEBUG = false', config('app.debug') === false, 'debug membocorkan jejak dan konfigurasi');
        $this->wajib('APP_KEY terisi', (string) config('app.key') !== '', 'jalankan php artisan key:generate --show lalu simpan di environment server');
        $this->wajib('APP_URL memakai https', str_starts_with((string) config('app.url'), 'https://'), 'HTTPS wajib');

        $this->wajib('Cookie sesi Secure', config('session.secure') === true, 'SESSION_SECURE_COOKIE=true');
        $this->wajib('Cookie sesi HttpOnly', config('session.http_only') === true, 'SESSION_HTTP_ONLY=true');
        $this->wajib('Cookie sesi SameSite lax/strict', in_array(strtolower((string) config('session.same_site')), ['lax', 'strict'], true), 'SESSION_SAME_SITE');
        $this->wajib('Payload sesi terenkripsi', config('session.encrypt') === true, 'SESSION_ENCRYPT=true');
        $this->wajib('Driver sesi persisten', in_array(config('session.driver'), ['database', 'redis'], true), 'driver: '.config('session.driver'));

        $origin = (array) config('cors.allowed_origins', []);
        $this->wajib('CORS: origin eksplisit, https, bukan localhost', $origin !== [] && $this->semuaAman($origin), 'CORS_ALLOWED_ORIGINS');
        $this->wajib('CORS: credentials aktif (cookie SPA)', config('cors.supports_credentials') === true, 'CORS_SUPPORTS_CREDENTIALS=true');

        $stateful = (array) config('sanctum.stateful', []);
        $this->wajib('Sanctum stateful: tanpa localhost', $stateful !== [] && ! $this->mengandungLokal($stateful), 'SANCTUM_STATEFUL_DOMAINS');
        $this->wajib('FRONTEND_URL https', str_starts_with((string) config('simba.frontend_url'), 'https://'), 'tautan reset password');

        $db = (array) config('database.connections.'.config('database.default'), []);
        $this->wajib('Database PostgreSQL', config('database.default') === 'pgsql', 'DB_CONNECTION');
        $this->wajib('Kredensial database terisi', ($db['username'] ?? '') !== '' && ($db['password'] ?? '') !== '', 'gunakan akun khusus aplikasi, bukan superuser');

        $this->wajib('Email bukan log/array', ! in_array(config('mail.default'), ['log', 'array'], true), 'tautan reset password tidak boleh ditulis ke log');

        foreach (['materi' => 'MATERI_DISK', 'tugas' => 'TUGAS_DISK'] as $kunci => $env) {
            $disk = (string) config($kunci.'.disk');
            $cfg = (array) config('filesystems.disks.'.$disk, []);
            $publik = $disk === 'public' || ($cfg['visibility'] ?? null) === 'public' || isset($cfg['url']) && str_contains((string) ($cfg['root'] ?? ''), 'public');
            $this->wajib("Disk $kunci privat", ! $publik, "$env=$disk");
        }

        $this->wajib('Batas login gagal aktif', (int) config('simba.login.max_attempts', 0) >= 1 && (int) config('simba.login.max_attempts') <= 10, 'LOGIN_MAX_ATTEMPTS');

        $this->saran('LOG_LEVEL bukan debug', config('logging.default') !== null && ! in_array(env('LOG_LEVEL', 'debug'), ['debug'], true), 'gunakan warning/error di produksi');
        $this->saran('TRUSTED_PROXIES diatur bila di belakang proxy', (string) env('TRUSTED_PROXIES', '') !== '', 'tanpa ini rate limiter melihat IP proxy');
        $this->saran('Lokasi presensi dikonfigurasi', config('presensi.lokasi.lat') !== null && config('presensi.lokasi.lng') !== null, 'PRESENSI_LAT/PRESENSI_LNG');
        $this->saran('SEED_DEFAULT_PASSWORD kosong', (string) config('simba.seed_password') === '', 'jangan menjalankan db:seed di produksi');
        $this->saran('Antrean bukan sync', config('queue.default') !== 'sync', 'email reset lebih baik lewat antrean');

        $gagal = 0;
        foreach ($this->hasil as [$status, $label, $detail]) {
            $penanda = ['OK' => '<info>[OK]    </info>', 'GAGAL' => '<error>[GAGAL] </error>', 'SARAN' => '<comment>[SARAN] </comment>'][$status];
            $this->line($penanda.' '.$label.($status === 'OK' ? '' : ' — '.$detail));
            $gagal += $status === 'GAGAL' ? 1 : 0;
        }

        $this->newLine();
        $this->line($gagal === 0
            ? 'Semua pemeriksaan wajib terpenuhi. Ini bukan jaminan keamanan; lihat docs/DEPLOYMENT.md.'
            : "$gagal pemeriksaan wajib belum terpenuhi.");

        return $gagal === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function wajib(string $label, bool $ok, string $detail): void
    {
        $this->hasil[] = [$ok ? 'OK' : 'GAGAL', $label, $detail];
    }

    private function saran(string $label, bool $ok, string $detail): void
    {
        $this->hasil[] = [$ok ? 'OK' : 'SARAN', $label, $detail];
    }

    /** @param array<int, mixed> $daftar */
    private function semuaAman(array $daftar): bool
    {
        foreach ($daftar as $o) {
            if (! is_string($o) || $o === '*' || ! str_starts_with($o, 'https://') || $this->mengandungLokal([$o])) {
                return false;
            }
        }

        return true;
    }

    /** @param array<int, mixed> $daftar */
    private function mengandungLokal(array $daftar): bool
    {
        foreach ($daftar as $o) {
            if (is_string($o) && preg_match('/(^|[\/:@.])(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i', $o)) {
                return true;
            }
        }

        return false;
    }
}
