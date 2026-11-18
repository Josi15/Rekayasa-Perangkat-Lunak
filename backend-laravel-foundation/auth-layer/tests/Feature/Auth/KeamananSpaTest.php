<?php

namespace Tests\Feature\Auth;

use App\Models\Pengguna;
use Tests\Concerns\DariFrontend;
use Tests\DatabaseTestCase;

class KeamananSpaTest extends DatabaseTestCase
{
    use DariFrontend;

    public function test_endpoint_csrf_cookie_menerbitkan_cookie_xsrf(): void
    {
        $this->dariFrontend()->get('/sanctum/csrf-cookie')
            ->assertNoContent()
            ->assertCookie('XSRF-TOKEN', null, false);
    }

    public function test_cors_preflight_mengizinkan_origin_frontend_dengan_credentials(): void
    {
        $respons = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type, x-xsrf-token',
        ])->options('/api/v1/auth/login');

        $respons->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
        $this->assertStringContainsStringIgnoringCase('x-xsrf-token', $respons->headers->get('Access-Control-Allow-Headers'));
    }

    public function test_cors_csrf_cookie_dan_origin_asing_tidak_diizinkan(): void
    {
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Access-Control-Request-Method' => 'GET'])
            ->options('/sanctum/csrf-cookie')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

        $asing = $this->withHeaders(['Origin' => 'http://evil.example', 'Access-Control-Request-Method' => 'POST'])
            ->options('/api/v1/auth/login');
        $this->assertNotSame('http://evil.example', $asing->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotSame('*', $asing->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_csrf_ditegakkan_untuk_request_dari_frontend(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword('PasswordKuat123')->create();

        // Di lingkungan "testing" Laravel melewati CSRF; ubah env agar middleware aktif seperti produksi.
        $this->app->detectEnvironment(fn () => 'local');

        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => 'PasswordKuat123'])
            ->assertStatus(419);

        $this->assertGuest('web');
    }

    public function test_konfigurasi_cookie_sesi_aman(): void
    {
        // Deterministik: tidak bergantung pada driver sesi yang dipakai test.
        $this->assertTrue(config('session.http_only'), 'Cookie sesi harus HttpOnly');
        $this->assertContains(strtolower((string) config('session.same_site')), ['lax', 'strict']);
    }

    public function test_cookie_sesi_yang_diterbitkan_saat_login_httponly_dan_samesite_aman(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword('PasswordKuat123')->create();

        $respons = $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => 'PasswordKuat123'])
            ->assertOk();

        $cookie = collect($respons->headers->getCookies())->first(fn ($c) => $c->getName() === config('session.cookie'));

        if ($cookie === null) {
            // Driver "array" (default phpunit.xml) pada sebagian versi Laravel tidak menerbitkan cookie.
            $this->markTestSkipped('Cookie sesi tidak diterbitkan oleh driver sesi test; atribut cookie diverifikasi lewat konfigurasi.');
        }

        $this->assertTrue($cookie->isHttpOnly(), 'Cookie sesi harus HttpOnly');
        $this->assertContains(strtolower((string) $cookie->getSameSite()), ['lax', 'strict']);
    }
}
