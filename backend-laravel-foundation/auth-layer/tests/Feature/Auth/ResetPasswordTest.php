<?php

namespace Tests\Feature\Auth;

use App\Models\Pengguna;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\DatabaseTestCase;

class ResetPasswordTest extends DatabaseTestCase
{
    private const BARU = 'PasswordBaru2026Aman';

    private function guru(): Pengguna
    {
        return Pengguna::factory()->guru()->withPassword('PasswordLama123')->create();
    }

    /** @return array<string, string> */
    private function payloadReset(Pengguna $pengguna, string $token, string $password = self::BARU): array
    {
        return [
            'email' => $pengguna->email, 'token' => $token,
            'password' => $password, 'password_confirmation' => $password,
        ];
    }

    public function test_forgot_password_respons_identik_untuk_akun_ada_dan_tidak_ada(): void
    {
        Notification::fake();
        $guru = $this->guru();

        $ada = $this->postJson('/api/v1/auth/forgot-password', ['email' => $guru->email]);
        $tidakAda = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'tidak.ada@contoh.test']);

        $ada->assertOk()->assertJsonStructure(['data' => ['message']]);
        $this->assertSame($ada->getContent(), $tidakAda->getContent());
        Notification::assertSentToTimes($guru, ResetPasswordNotification::class, 1);
        Notification::assertCount(1);
    }

    public function test_forgot_password_tidak_membedakan_permintaan_berulang(): void
    {
        Notification::fake();
        $guru = $this->guru();

        $pertama = $this->postJson('/api/v1/auth/forgot-password', ['email' => $guru->email]);
        $kedua = $this->postJson('/api/v1/auth/forgot-password', ['email' => $guru->email]); // dibatasi broker (60 dtk)

        $this->assertSame($pertama->getContent(), $kedua->getContent());
        $kedua->assertOk();
        Notification::assertSentToTimes($guru, ResetPasswordNotification::class, 1);
    }

    public function test_forgot_password_email_tidak_peka_huruf_besar(): void
    {
        Notification::fake();
        $guru = $this->guru();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => '  '.strtoupper($guru->email).' '])->assertOk();

        Notification::assertSentTo($guru, ResetPasswordNotification::class);
    }

    public function test_forgot_password_memvalidasi_format_email(): void
    {
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'bukan-email'])
            ->assertStatus(422)->assertJsonPath('code', 'validation_error');
        $this->postJson('/api/v1/auth/forgot-password', [])->assertStatus(422);
    }

    public function test_tautan_email_mengarah_ke_frontend_dan_token_tersimpan_sebagai_hash(): void
    {
        Notification::fake();
        $guru = $this->guru();

        $respons = $this->postJson('/api/v1/auth/forgot-password', ['email' => $guru->email])->assertOk();

        $url = null;
        $token = null;
        Notification::assertSentTo($guru, ResetPasswordNotification::class, function ($notifikasi) use ($guru, &$url, &$token) {
            $url = $notifikasi->toMail($guru)->actionUrl;
            $token = $notifikasi->token;

            return true;
        });

        $this->assertStringStartsWith('http://localhost:5173/reset-password?token=', $url);
        $this->assertStringContainsString('email='.urlencode($guru->email), $url);

        // Token tidak muncul di respons API, dan di database hanya berupa hash.
        $this->assertStringNotContainsString($token, $respons->getContent());
        $tersimpan = DB::table('password_reset_tokens')->where('email', $guru->email)->value('token');
        $this->assertNotSame($token, $tersimpan);
        $this->assertTrue(Hash::check($token, $tersimpan));
    }

    public function test_reset_password_berhasil_dan_token_sekali_pakai(): void
    {
        Event::fake([PasswordReset::class]);
        $guru = $this->guru();
        $tokenIngatan = $guru->remember_token;
        $token = Password::broker()->createToken($guru);

        $this->postJson('/api/v1/auth/reset-password', $this->payloadReset($guru, $token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['message']]);

        $segar = $guru->fresh();
        $this->assertTrue(Hash::check(self::BARU, $segar->password));
        $this->assertStringNotContainsString(self::BARU, $segar->getRawOriginal('password'));
        $this->assertNotSame($tokenIngatan, $segar->remember_token);
        $this->assertTrue(Auth::validate(['username' => $guru->username, 'password' => self::BARU]));
        $this->assertFalse(Auth::validate(['username' => $guru->username, 'password' => 'PasswordLama123']));
        Event::assertDispatched(PasswordReset::class);

        // Token yang sama tidak bisa dipakai lagi.
        $this->postJson('/api/v1/auth/reset-password', $this->payloadReset($guru, $token, 'LainLagi2026Aman'))
            ->assertStatus(422)->assertJsonPath('code', 'invalid_reset_token');
    }

    public function test_token_salah_dan_email_tidak_dikenal_memberi_respons_identik(): void
    {
        $guru = $this->guru();
        Password::broker()->createToken($guru);

        $tokenSalah = $this->postJson('/api/v1/auth/reset-password', $this->payloadReset($guru, 'token-ngawur'));
        $emailAsing = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'asing@contoh.test', 'token' => 'token-ngawur',
            'password' => self::BARU, 'password_confirmation' => self::BARU,
        ]);

        $tokenSalah->assertStatus(422)->assertJsonPath('code', 'invalid_reset_token');
        $this->assertSame($tokenSalah->json('message'), $emailAsing->json('message'));
        $this->assertSame($tokenSalah->json('errors'), $emailAsing->json('errors'));
        $this->assertFalse(Hash::check(self::BARU, $guru->fresh()->password));
    }

    public function test_token_kedaluwarsa_ditolak(): void
    {
        $guru = $this->guru();
        $token = Password::broker()->createToken($guru);

        $this->travel((int) config('auth.passwords.users.expire') + 1)->minutes();

        $this->postJson('/api/v1/auth/reset-password/validate', ['email' => $guru->email, 'token' => $token])
            ->assertStatus(422)->assertJsonPath('code', 'invalid_reset_token');
        $this->postJson('/api/v1/auth/reset-password', $this->payloadReset($guru, $token))
            ->assertStatus(422)->assertJsonPath('code', 'invalid_reset_token');
        $this->assertFalse(Hash::check(self::BARU, $guru->fresh()->password));
    }

    public function test_password_lemah_atau_konfirmasi_beda_ditolak_tanpa_menghabiskan_token(): void
    {
        $guru = $this->guru();
        $token = Password::broker()->createToken($guru);

        $this->postJson('/api/v1/auth/reset-password', $this->payloadReset($guru, $token, 'abc'))
            ->assertStatus(422)->assertJsonPath('code', 'validation_error')->assertJsonValidationErrors(['password'], 'errors');

        $this->postJson('/api/v1/auth/reset-password', array_merge($this->payloadReset($guru, $token), ['password_confirmation' => 'BedaSemua2026Aman']))
            ->assertStatus(422)->assertJsonValidationErrors(['password'], 'errors');

        // Token masih berlaku setelah validasi gagal.
        $this->postJson('/api/v1/auth/reset-password/validate', ['email' => $guru->email, 'token' => $token])
            ->assertOk()->assertJsonPath('data.valid', true);
    }

    public function test_validate_token(): void
    {
        $guru = $this->guru();
        $token = Password::broker()->createToken($guru);

        $this->postJson('/api/v1/auth/reset-password/validate', ['email' => $guru->email, 'token' => $token])
            ->assertOk()->assertJsonPath('data.valid', true);

        $this->postJson('/api/v1/auth/reset-password/validate', ['email' => $guru->email, 'token' => 'salah'])
            ->assertStatus(422)->assertJsonPath('code', 'invalid_reset_token');

        $this->postJson('/api/v1/auth/reset-password/validate', ['email' => 'asing@contoh.test', 'token' => $token])
            ->assertStatus(422)->assertJsonPath('code', 'invalid_reset_token');
    }

    public function test_reset_password_mencabut_semua_sesi_di_database(): void
    {
        config(['session.driver' => 'database']);
        $guru = $this->guru();
        $lain = $this->guru();
        $baris = fn (int $id) => ['id' => 'sesi-'.$id, 'user_id' => $id, 'payload' => 'x', 'last_activity' => time()];
        DB::table('sessions')->insert([$baris($guru->id_pengguna), $baris($lain->id_pengguna)]);

        $token = Password::broker()->createToken($guru);
        $this->postJson('/api/v1/auth/reset-password', $this->payloadReset($guru, $token))->assertOk();

        $this->assertDatabaseMissing('sessions', ['user_id' => $guru->id_pengguna]);
        $this->assertDatabaseHas('sessions', ['user_id' => $lain->id_pengguna]); // akun lain tidak terpengaruh
    }

    public function test_endpoint_forgot_password_dibatasi_rate_limit(): void
    {
        Notification::fake();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/forgot-password', ['email' => "orang{$i}@contoh.test"])->assertOk();
        }

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'orang6@contoh.test'])
            ->assertStatus(429)->assertJsonPath('code', 'too_many_requests');
    }
}
