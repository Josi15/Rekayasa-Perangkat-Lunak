<?php

namespace Tests\Feature\Master;

use App\Models\Pengguna;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class ProfilApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const URL = '/api/v1/profil';

    private function akun(array $atribut = []): Pengguna
    {
        return Pengguna::factory()->create($atribut + ['password' => self::PASSWORD_UJI, 'email' => 'saya@contoh.test']);
    }

    public function test_tanpa_login_401(): void
    {
        $this->getJson(self::URL)->assertUnauthorized();
        $this->patchJson(self::URL, ['email' => 'a@b.test'])->assertUnauthorized();
    }

    public function test_setiap_peran_melihat_profil_sendiri_tanpa_data_rahasia(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->siswa1, $d->guruA, $d->admin] as $pengguna) {
            $this->sebagai($pengguna)->getJson(self::URL)->assertOk()
                ->assertJsonPath('data.id_pengguna', $pengguna->id_pengguna)
                ->assertJsonPath('data.peran', $pengguna->peran->value)
                ->assertJsonMissingPath('data.password')->assertJsonMissingPath('data.remember_token');
        }
    }

    public function test_akun_nonaktif_401(): void
    {
        $mati = Pengguna::factory()->nonaktif()->create();

        $this->sebagai($mati)->getJson(self::URL)->assertUnauthorized();
    }

    public function test_ubah_email_butuh_password_saat_ini(): void
    {
        $akun = $this->akun();

        $this->sebagai($akun)->patchJson(self::URL, ['email' => 'baru@contoh.test'])
            ->assertUnprocessable()->assertJsonValidationErrors('password_saat_ini', 'errors');
        $this->sebagai($akun)->patchJson(self::URL, ['email' => 'baru@contoh.test', 'password_saat_ini' => 'salah-total'])
            ->assertUnprocessable()->assertJsonValidationErrors('password_saat_ini', 'errors');

        $this->sebagai($akun)->patchJson(self::URL, ['email' => 'Baru@Contoh.Test', 'password_saat_ini' => self::PASSWORD_UJI])
            ->assertOk()->assertJsonPath('data.email', 'baru@contoh.test');
    }

    public function test_email_tidak_boleh_dipakai_akun_lain(): void
    {
        $d = $this->buatDunia();
        $d->guruA->forceFill(['email' => 'guru.a@contoh.test'])->save();
        $akun = $this->akun();

        $this->sebagai($akun)->patchJson(self::URL, ['email' => 'GURU.A@contoh.test', 'password_saat_ini' => self::PASSWORD_UJI])
            ->assertUnprocessable()->assertJsonValidationErrors('email', 'errors');
    }

    public function test_ganti_password_butuh_konfirmasi_dan_aturan_kekuatan(): void
    {
        $akun = $this->akun();

        $this->sebagai($akun)->patchJson(self::URL, ['password' => 'PasswordBaru2026Aman', 'password_saat_ini' => self::PASSWORD_UJI])
            ->assertUnprocessable()->assertJsonValidationErrors('password', 'errors'); // tanpa konfirmasi
        $this->sebagai($akun)->patchJson(self::URL, ['password' => 'lemah', 'password_confirmation' => 'lemah', 'password_saat_ini' => self::PASSWORD_UJI])
            ->assertUnprocessable()->assertJsonValidationErrors('password', 'errors');

        $this->sebagai($akun)->patchJson(self::URL, [
            'password' => 'PasswordBaru2026Aman', 'password_confirmation' => 'PasswordBaru2026Aman', 'password_saat_ini' => self::PASSWORD_UJI,
        ])->assertOk()->assertJsonMissingPath('data.password');

        $this->assertTrue(Hash::check('PasswordBaru2026Aman', $akun->fresh()->password));
    }

    public function test_identitas_dan_peran_tidak_bisa_diubah_sendiri(): void
    {
        $d = $this->buatDunia();
        $awal = $d->siswa1->only(['nisn', 'username', 'peran']);

        foreach (['peran' => 'admin', 'nisn' => '1111111111', 'nip' => '123456789012345678', 'username' => 'penyusup'] as $kolom => $nilai) {
            $this->sebagai($d->siswa1)->patchJson(self::URL, [$kolom => $nilai])
                ->assertUnprocessable()->assertJsonValidationErrors($kolom, 'errors');
        }

        $this->assertEquals($awal, $d->siswa1->fresh()->only(['nisn', 'username', 'peran']));
    }

    public function test_tidak_bisa_mengubah_akun_orang_lain_lewat_body(): void
    {
        $d = $this->buatDunia();
        $akun = $this->akun();

        // id_pengguna di body diabaikan: yang berubah tetap akun pemanggil
        $this->sebagai($akun)->patchJson(self::URL, [
            'id_pengguna' => $d->admin->id_pengguna, 'email' => 'saya.baru@contoh.test', 'password_saat_ini' => self::PASSWORD_UJI,
        ])->assertOk()->assertJsonPath('data.id_pengguna', $akun->id_pengguna);

        $this->assertSame('saya.baru@contoh.test', $akun->fresh()->email);
        $this->assertNotSame('saya.baru@contoh.test', $d->admin->fresh()->email);
    }
}
