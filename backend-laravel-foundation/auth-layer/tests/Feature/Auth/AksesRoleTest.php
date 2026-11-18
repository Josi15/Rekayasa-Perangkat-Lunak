<?php

namespace Tests\Feature\Auth;

use App\Models\Pengguna;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\DariFrontend;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class AksesRoleTest extends DatabaseTestCase
{
    use DariFrontend, MembuatDuniaAkses;

    /** @return array<string, array{0: string, 1: string}> */
    public static function endpointTerlindungi(): array
    {
        return [
            'me' => ['GET', '/api/v1/auth/me'],
            'logout' => ['POST', '/api/v1/auth/logout'],
            'daftar kelas' => ['GET', '/api/v1/kelas'],
            'detail kelas' => ['GET', '/api/v1/kelas/1'],
            'admin pengguna' => ['GET', '/api/v1/admin/pengguna'],
        ];
    }

    #[DataProvider('endpointTerlindungi')]
    public function test_tanpa_autentikasi_mendapat_401_json(string $metode, string $url): void
    {
        $this->json($metode, $url)
            ->assertUnauthorized()
            ->assertJsonPath('code', 'unauthenticated')
            ->assertJsonStructure(['message', 'code', 'request_id']);
    }

    public function test_bearer_token_palsu_tetap_401_bukan_error_server(): void
    {
        $this->withToken('1|tokenpalsu')->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_siswa_dan_guru_ditolak_403_di_area_admin(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->siswa1, $d->guruA] as $pengguna) {
            $this->actingAs($pengguna, 'web')->dariFrontend()->getJson('/api/v1/admin/pengguna')
                ->assertForbidden()
                ->assertJsonPath('code', 'forbidden');
        }
    }

    public function test_admin_dapat_mengakses_area_admin_dengan_pagination(): void
    {
        $d = $this->buatDunia();

        $this->actingAs($d->admin, 'web')->dariFrontend()->getJson('/api/v1/admin/pengguna?per_page=2')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id_pengguna', 'peran']], 'links', 'meta'])
            ->assertJsonCount(2, 'data')
            ->assertJsonMissingPath('data.0.password');
    }

    public function test_filter_peran_dan_validasinya(): void
    {
        $d = $this->buatDunia();
        $admin = $this->actingAs($d->admin, 'web')->dariFrontend();

        $respons = $admin->getJson('/api/v1/admin/pengguna?peran=guru&per_page=100')->assertOk();
        $this->assertNotEmpty($respons->json('data'));
        $this->assertSame(['guru'], array_values(array_unique(array_column($respons->json('data'), 'peran'))));

        $admin->getJson('/api/v1/admin/pengguna?peran=kepsek')->assertStatus(422);
        $admin->getJson('/api/v1/admin/pengguna?per_page=100000')->assertStatus(422);
    }

    public function test_peran_yang_dikirim_client_tidak_dipercaya(): void
    {
        $siswa = Pengguna::factory()->create();

        // Header, query, dan body yang mengaku "admin" tidak mengubah hasil: peran dibaca dari database.
        $this->actingAs($siswa, 'web')->dariFrontend()
            ->withHeaders(['X-Peran' => 'admin', 'X-Role' => 'admin'])
            ->getJson('/api/v1/admin/pengguna?peran=admin&role=admin')
            ->assertForbidden()
            ->assertJsonPath('code', 'forbidden');

        $this->actingAs($siswa, 'web')->dariFrontend()
            ->withHeader('X-Peran', 'admin')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.peran', 'siswa');
    }

    public function test_daftar_kelas_dibatasi_sesuai_peran(): void
    {
        $d = $this->buatDunia();

        $ids = fn ($respons) => array_column($respons->json('data'), 'id_kelas');

        $siswa = $this->actingAs($d->siswa1, 'web')->dariFrontend()->getJson('/api/v1/kelas')->assertOk();
        $this->assertSame([$d->kelasA->id_kelas], $ids($siswa));

        $guru = $this->actingAs($d->guruB, 'web')->dariFrontend()->getJson('/api/v1/kelas')->assertOk();
        $this->assertSame([$d->kelasB->id_kelas], $ids($guru));

        $guruTanpaKelas = $this->actingAs($d->guruC, 'web')->dariFrontend()->getJson('/api/v1/kelas')->assertOk();
        $this->assertSame([], $ids($guruTanpaKelas));

        $admin = $this->actingAs($d->admin, 'web')->dariFrontend()->getJson('/api/v1/kelas')->assertOk();
        $this->assertEqualsCanonicalizing([$d->kelasA->id_kelas, $d->kelasB->id_kelas], $ids($admin));
    }

    public function test_detail_kelas_milik_orang_lain_403_milik_sendiri_200_tidak_ada_404(): void
    {
        $d = $this->buatDunia();
        $siswa = $this->actingAs($d->siswa1, 'web')->dariFrontend();

        $siswa->getJson('/api/v1/kelas/'.$d->kelasA->id_kelas)->assertOk()->assertJsonPath('data.id_kelas', $d->kelasA->id_kelas);
        $siswa->getJson('/api/v1/kelas/'.$d->kelasB->id_kelas)->assertForbidden()->assertJsonPath('code', 'forbidden');
        $siswa->getJson('/api/v1/kelas/999999')->assertNotFound()->assertJsonPath('code', 'not_found');
    }

    public function test_pagination_kelas_memvalidasi_per_page(): void
    {
        $d = $this->buatDunia();

        $this->actingAs($d->admin, 'web')->dariFrontend()->getJson('/api/v1/kelas?per_page=1000')
            ->assertStatus(422)->assertJsonPath('code', 'validation_error');
    }

    public function test_middleware_role_gagal_tertutup_untuk_peran_tak_dikenal(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->withoutExceptionHandling();
        \Illuminate\Support\Facades\Route::middleware(['api', 'auth:sanctum', 'role:kepsek'])
            ->get('/api/v1/uji-peran-salah', fn () => 'x');

        $this->actingAs(Pengguna::factory()->admin()->create(), 'web')->getJson('/api/v1/uji-peran-salah');
    }
}
