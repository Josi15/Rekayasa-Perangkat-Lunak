<?php

namespace Tests\Feature\Final;

use Tests\TestCase;

class CekProduksiTest extends TestCase
{
    /** Konfigurasi yang memenuhi semua pemeriksaan wajib (nilai dummy, bukan rahasia nyata). */
    private function konfigurasiProduksiValid(): void
    {
        config([
            'app.env' => 'production', 'app.debug' => false, 'app.key' => 'base64:dummy', 'app.url' => 'https://api.contoh.test',
            'session.secure' => true, 'session.http_only' => true, 'session.same_site' => 'lax', 'session.encrypt' => true, 'session.driver' => 'database',
            'cors.allowed_origins' => ['https://app.contoh.test'], 'cors.supports_credentials' => true,
            'sanctum.stateful' => ['app.contoh.test'], 'simba.frontend_url' => 'https://app.contoh.test',
            'database.default' => 'pgsql', 'database.connections.pgsql.username' => 'app_user', 'database.connections.pgsql.password' => 'dummy-pass',
            'mail.default' => 'smtp', 'materi.disk' => 'local', 'tugas.disk' => 'local', 'simba.login.max_attempts' => 5,
        ]);
    }

    public function test_konfigurasi_lokal_gagal_dan_tidak_mencetak_rahasia(): void
    {
        config(['database.connections.pgsql.password' => 'RAHASIA-JANGAN-TAMPIL', 'app.key' => 'base64:KUNCI-RAHASIA']);

        $this->artisan('simba:cek-produksi')
            ->assertExitCode(1)
            ->doesntExpectOutputToContain('RAHASIA-JANGAN-TAMPIL')
            ->doesntExpectOutputToContain('KUNCI-RAHASIA');
    }

    public function test_konfigurasi_produksi_valid_lulus(): void
    {
        $this->konfigurasiProduksiValid();

        $this->artisan('simba:cek-produksi')->assertExitCode(0);
    }

    /** @return array<string, array{0: array<string, mixed>}> */
    public static function pelanggaran(): array
    {
        return [
            'debug menyala' => [['app.debug' => true]],
            'bukan production' => [['app.env' => 'local']],
            'url http' => [['app.url' => 'http://api.contoh.test']],
            'cookie tidak secure' => [['session.secure' => false]],
            'cookie bisa dibaca JS' => [['session.http_only' => false]],
            'samesite none' => [['session.same_site' => 'none']],
            'sesi tidak dienkripsi' => [['session.encrypt' => false]],
            'cors wildcard' => [['cors.allowed_origins' => ['*']]],
            'cors localhost' => [['cors.allowed_origins' => ['https://localhost:5173']]],
            'cors http' => [['cors.allowed_origins' => ['http://app.contoh.test']]],
            'cors tanpa credentials' => [['cors.supports_credentials' => false]],
            'stateful localhost' => [['sanctum.stateful' => ['localhost:5173']]],
            'database bukan pgsql' => [['database.default' => 'sqlite']],
            'password db kosong' => [['database.connections.pgsql.password' => '']],
            'email ke log' => [['mail.default' => 'log']],
            'disk materi publik' => [['materi.disk' => 'public']],
            'disk tugas publik' => [['tugas.disk' => 'public']],
            'login tanpa batas' => [['simba.login.max_attempts' => 0]],
        ];
    }

    /** @param array<string, mixed> $ubah */
    #[\PHPUnit\Framework\Attributes\DataProvider('pelanggaran')]
    public function test_setiap_pelanggaran_menggagalkan(array $ubah): void
    {
        $this->konfigurasiProduksiValid();
        config($ubah);

        $this->artisan('simba:cek-produksi')->assertExitCode(1);
    }
}
