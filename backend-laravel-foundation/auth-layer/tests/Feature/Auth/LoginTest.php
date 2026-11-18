<?php

namespace Tests\Feature\Auth;

use App\Models\Pengguna;
use Tests\Concerns\DariFrontend;
use Tests\DatabaseTestCase;

class LoginTest extends DatabaseTestCase
{
    use DariFrontend;

    private const PASSWORD = 'PasswordKuat123';

    public function test_guru_login_dengan_username(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();

        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => self::PASSWORD])
            ->assertOk()
            ->assertJsonPath('data.id_pengguna', $guru->id_pengguna)
            ->assertJsonPath('data.peran', 'guru')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');

        $this->assertAuthenticatedAs($guru, 'web');
    }

    public function test_siswa_login_dengan_nisn(): void
    {
        $siswa = Pengguna::factory()->withPassword(self::PASSWORD)->create();

        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $siswa->nisn, 'password' => self::PASSWORD])
            ->assertOk()
            ->assertJsonPath('data.peran', 'siswa');

        $this->assertAuthenticatedAs($siswa, 'web');
    }

    public function test_guru_login_dengan_nip(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();

        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->nip, 'password' => self::PASSWORD])
            ->assertOk()
            ->assertJsonPath('data.id_pengguna', $guru->id_pengguna);
    }

    public function test_password_salah_ditolak_dengan_422_invalid_credentials(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();

        $respons = $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => 'salah-total'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'invalid_credentials')
            ->assertJsonStructure(['message', 'code', 'errors' => ['login'], 'request_id']);

        $this->assertGuest('web');
        $this->assertStringNotContainsString('salah-total', $respons->getContent());
    }

    public function test_akun_tidak_ada_dan_password_salah_memberi_respons_identik(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();

        $salah = $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => 'salah-total']);
        $tidakAda = $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => 'tidak-ada-akun', 'password' => 'salah-total']);

        $this->assertSame($salah->status(), $tidakAda->status());
        $this->assertSame($salah->json('message'), $tidakAda->json('message'));
        $this->assertSame($salah->json('errors'), $tidakAda->json('errors'));
        $this->assertSame($salah->json('code'), $tidakAda->json('code'));
    }

    public function test_validasi_request(): void
    {
        $this->dariFrontend()->postJson('/api/v1/auth/login', [])
            ->assertStatus(422)
            ->assertJsonPath('code', 'validation_error')
            ->assertJsonValidationErrors(['login', 'password'], 'errors');
    }

    public function test_peran_yang_dikirim_client_diabaikan(): void
    {
        $siswa = Pengguna::factory()->withPassword(self::PASSWORD)->create();

        $this->dariFrontend()->postJson('/api/v1/auth/login', [
            'login' => $siswa->nisn, 'password' => self::PASSWORD, 'peran' => 'admin',
        ])->assertOk()->assertJsonPath('data.peran', 'siswa');
    }

    public function test_login_yang_cocok_dengan_lebih_dari_satu_akun_ditolak(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create(['username' => '1234567890']);
        $siswa = Pengguna::factory()->withPassword(self::PASSWORD)->create(['nisn' => '1234567890']);

        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => '1234567890', 'password' => self::PASSWORD])
            ->assertStatus(422)
            ->assertJsonPath('code', 'invalid_credentials');

        $this->assertGuest('web');
    }

    public function test_login_dari_origin_tidak_terdaftar_ditolak_karena_tidak_ada_sesi(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();

        $this->withHeader('Origin', 'http://evil.example')
            ->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => self::PASSWORD])
            ->assertStatus(403)
            ->assertJsonPath('code', 'frontend_not_allowed');

        $this->assertGuest('web');
    }

    public function test_rate_limiting_mengunci_setelah_lima_kegagalan(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();
        $salah = ['login' => $guru->username, 'password' => 'salah-total'];

        for ($i = 0; $i < 5; $i++) {
            $this->dariFrontend()->postJson('/api/v1/auth/login', $salah)->assertStatus(422);
        }

        $this->dariFrontend()->postJson('/api/v1/auth/login', $salah)
            ->assertStatus(429)
            ->assertJsonPath('code', 'too_many_requests')
            ->assertHeader('Retry-After');

        // Selama terkunci, password yang benar pun tidak diterima.
        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => self::PASSWORD])
            ->assertStatus(429);
        $this->assertGuest('web');
    }

    public function test_login_berhasil_mereset_hitungan_gagal(): void
    {
        $guru = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();
        $salah = ['login' => $guru->username, 'password' => 'salah-total'];

        for ($i = 0; $i < 4; $i++) {
            $this->dariFrontend()->postJson('/api/v1/auth/login', $salah)->assertStatus(422);
        }
        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $guru->username, 'password' => self::PASSWORD])->assertOk();

        for ($i = 0; $i < 4; $i++) {
            $this->dariFrontend()->postJson('/api/v1/auth/login', $salah)->assertStatus(422);
        }
    }

    public function test_pembatas_per_akun_tidak_mengunci_akun_lain(): void
    {
        $a = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();
        $b = Pengguna::factory()->guru()->withPassword(self::PASSWORD)->create();

        for ($i = 0; $i < 5; $i++) {
            $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $a->username, 'password' => 'salah-total']);
        }

        $this->dariFrontend()->postJson('/api/v1/auth/login', ['login' => $b->username, 'password' => self::PASSWORD])->assertOk();
    }
}
