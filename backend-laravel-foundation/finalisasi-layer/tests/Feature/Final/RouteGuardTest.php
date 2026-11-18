<?php

namespace Tests\Feature\Final;

use App\Models\Pengguna;
use Illuminate\Routing\Route as RuteLaravel;
use Illuminate\Support\Facades\Route;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

/**
 * Penjaga regresi LINTAS SEMUA ROUTE yang terdaftar (dibaca langsung dari router, bukan daftar tulisan tangan):
 * endpoint baru yang lupa dilindungi akan menggagalkan test ini.
 */
class RouteGuardTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const PUBLIK = [
        'api/v1/health', 'api/v1/health/ready', 'api/v1/auth/login', 'api/v1/auth/forgot-password',
        'api/v1/auth/reset-password/validate', 'api/v1/auth/reset-password',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        // Test ini menembak ~90 route berturut-turut dari satu IP; limiter "api" (60/menit) akan memberi 429 bila tidak dilonggarkan.
        // Perilaku limiter itu sendiri diuji terpisah (LoginTest: pembatas login).
        config(['api.rate_limit' => 100000]);
    }

    /** @return list<RuteLaravel> */
    private function ruteApi(): array
    {
        return array_values(array_filter(
            Route::getRoutes()->getRoutes(),
            fn (RuteLaravel $r) => str_starts_with($r->uri(), 'api/')
        ));
    }

    /** @return list<RuteLaravel> */
    private function rutePrivat(): array
    {
        return array_values(array_filter($this->ruteApi(), fn (RuteLaravel $r) => ! in_array($r->uri(), self::PUBLIK, true)));
    }

    private function metode(RuteLaravel $r): string
    {
        return array_values(array_diff($r->methods(), ['HEAD', 'OPTIONS']))[0];
    }

    private function url(RuteLaravel $r): string
    {
        return '/'.preg_replace('/\{[^}]+\}/', '1', $r->uri());
    }

    public function test_jumlah_route_api_tercatat_dan_tidak_kosong(): void
    {
        $this->assertGreaterThanOrEqual(90, count($this->ruteApi()), 'Daftar route API tampak tidak lengkap.');
    }

    public function test_setiap_route_privat_memakai_auth_sanctum_dan_akun_aktif(): void
    {
        foreach ($this->rutePrivat() as $r) {
            $mw = $r->gatherMiddleware();
            $label = $this->metode($r).' '.$r->uri();

            $this->assertContains('auth:sanctum', $mw, "$label tanpa auth:sanctum");

            if (! str_ends_with($r->uri(), '/logout')) { // logout sengaja boleh untuk akun nonaktif
                $this->assertContains('akun.aktif', $mw, "$label tanpa akun.aktif");
            }
        }
    }

    public function test_endpoint_publik_tulis_dibatasi_throttle(): void
    {
        foreach ($this->ruteApi() as $r) {
            if (in_array($r->uri(), self::PUBLIK, true) && $this->metode($r) !== 'GET') {
                $adaThrottle = array_filter($r->gatherMiddleware(), fn ($m) => is_string($m) && str_starts_with($m, 'throttle:'));
                $this->assertNotEmpty($adaThrottle, $r->uri().' tanpa throttle');
            }
        }
    }

    public function test_tanpa_login_semua_route_privat_401_json(): void
    {
        foreach ($this->rutePrivat() as $r) {
            $res = $this->json($this->metode($r), $this->url($r));

            $res->assertUnauthorized();
            $this->assertSame('unauthenticated', $res->json('code'), $this->metode($r).' '.$r->uri());
        }
    }

    public function test_akun_nonaktif_ditolak_di_semua_route_privat_kecuali_logout(): void
    {
        $nonaktif = Pengguna::factory()->nonaktif()->create();

        foreach ($this->rutePrivat() as $r) {
            if (str_ends_with($r->uri(), '/logout')) {
                continue;
            }

            $this->sebagai($nonaktif)->json($this->metode($r), $this->url($r))->assertUnauthorized();
        }
    }

    public function test_area_admin_menolak_siswa_dan_guru_di_semua_route(): void
    {
        $d = $this->buatDunia();

        foreach ($this->rutePrivat() as $r) {
            if (! str_starts_with($r->uri(), 'api/v1/admin/')) {
                continue;
            }

            foreach ([$d->siswa1, $d->guruA] as $pelaku) {
                $this->sebagai($pelaku)->json($this->metode($r), $this->url($r))->assertForbidden();
            }
        }
    }

    public function test_route_api_tidak_ada_dan_metode_salah_memberi_json_bersih(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->getJson('/api/v1/tidak-ada')->assertNotFound()->assertJsonPath('code', 'not_found');
        $this->sebagai($d->admin)->deleteJson('/api/v1/profil')->assertStatus(405)->assertJsonPath('code', 'method_not_allowed');
        $this->getJson('/api/v1/tidak-ada')->assertNotFound()->assertJsonStructure(['message', 'code']);
    }

    public function test_route_tidak_mengekspos_sanctum_token_atau_dokumen_internal(): void
    {
        foreach ($this->ruteApi() as $r) {
            $this->assertStringNotContainsString('token', strtolower($r->uri()), 'Route bertema token: '.$r->uri());
            $this->assertStringNotContainsString('telescope', $r->uri());
            $this->assertStringNotContainsString('debug', $r->uri());
        }
    }
}
