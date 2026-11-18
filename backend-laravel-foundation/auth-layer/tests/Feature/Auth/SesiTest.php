<?php

namespace Tests\Feature\Auth;

use App\Models\Pengguna;
use Tests\Concerns\DariFrontend;
use Tests\DatabaseTestCase;

class SesiTest extends DatabaseTestCase
{
    use DariFrontend;

    public function test_me_tanpa_login_401(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'unauthenticated');
    }

    public function test_me_mengembalikan_pengguna_login_tanpa_data_sensitif(): void
    {
        $siswa = Pengguna::factory()->create();

        $this->actingAs($siswa, 'web')->dariFrontend()->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id_pengguna', $siswa->id_pengguna)
            ->assertJsonPath('data.peran', 'siswa')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');
    }

    public function test_logout_tanpa_login_401(): void
    {
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
    }

    public function test_logout_mengakhiri_sesi(): void
    {
        $guru = Pengguna::factory()->guru()->create();

        $this->actingAs($guru, 'web')->dariFrontend()->postJson('/api/v1/auth/logout')->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_logout_hanya_menerima_post(): void
    {
        $this->actingAs(Pengguna::factory()->create(), 'web')->dariFrontend()
            ->getJson('/api/v1/auth/logout')
            ->assertStatus(405)
            ->assertJsonPath('code', 'method_not_allowed');
    }
}
