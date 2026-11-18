<?php

namespace Tests\Feature\Master;

use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\Concerns\MasterApi;
use Tests\DatabaseTestCase;

class PenggunaApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const URL = '/api/v1/admin/pengguna';

    /** @return array<string, array{0: string, 1: string}> */
    public static function endpointAdmin(): array
    {
        return [
            'daftar' => ['GET', self::URL],
            'buat' => ['POST', self::URL],
            'detail' => ['GET', self::URL.'/1'],
            'ubah' => ['PATCH', self::URL.'/1'],
            'nonaktifkan' => ['POST', self::URL.'/1/nonaktifkan'],
            'aktifkan' => ['POST', self::URL.'/1/aktifkan'],
        ];
    }

    #[DataProvider('endpointAdmin')]
    public function test_tanpa_login_401(string $metode, string $url): void
    {
        $this->json($metode, $url)->assertUnauthorized();
    }

    #[DataProvider('endpointAdmin')]
    public function test_siswa_dan_guru_403_di_semua_endpoint_admin(string $metode, string $url): void
    {
        $d = $this->buatDunia();

        foreach ([$d->siswa1, $d->guruA] as $pelaku) {
            $this->sebagai($pelaku)->json($metode, $url, ['peran' => 'siswa'])
                ->assertForbidden()->assertJsonPath('code', 'forbidden');
        }
    }

    // ---------------------------------------------------------------- daftar

    public function test_daftar_pagination_dan_struktur(): void
    {
        $d = $this->buatDunia();
        Pengguna::factory()->count(10)->create();

        $r = $this->sebagai($d->admin)->getJson(self::URL.'?per_page=5&page=2')->assertOk()
            ->assertJsonStructure(['data' => [['id_pengguna', 'peran', 'aktif']], 'links', 'meta'])
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 5);

        $this->assertSame(Pengguna::query()->whereNull('nonaktif_pada')->count(), $r->json('meta.total'));
        $r->assertJsonMissingPath('data.0.password')->assertJsonMissingPath('data.0.remember_token');
    }

    public function test_parameter_daftar_tidak_valid_422(): void
    {
        $d = $this->buatDunia();

        foreach (['per_page=0', 'per_page=101', 'page=0', 'peran=superadmin', 'status=hapus', 'urut=password', 'arah=sembarang', 'cari='.str_repeat('a', 101)] as $query) {
            $this->sebagai($d->admin)->getJson(self::URL.'?'.$query)
                ->assertUnprocessable()->assertJsonPath('code', 'validation_error');
        }
    }

    public function test_filter_peran(): void
    {
        $d = $this->buatDunia();

        $r = $this->sebagai($d->admin)->getJson(self::URL.'?peran=guru&per_page=100')->assertOk();

        $this->assertNotEmpty($r->json('data'));
        $this->assertSame(['guru'], array_values(array_unique(array_column($r->json('data'), 'peran'))));
    }

    public function test_pencarian_username_nisn_nip_email_tanpa_beda_huruf(): void
    {
        $d = $this->buatDunia();
        $budi = Pengguna::factory()->create(['username' => 'budi.santoso', 'email' => 'budi@contoh.test']);

        foreach (['BUDI.san', 'budi@contoh', $budi->nisn] as $kata) {
            $ids = array_column($this->sebagai($d->admin)->getJson(self::URL.'?per_page=100&cari='.urlencode($kata))->assertOk()->json('data'), 'id_pengguna');
            $this->assertContains($budi->id_pengguna, $ids, "cari={$kata}");
        }

        $this->sebagai($d->admin)->getJson(self::URL.'?cari=tidak-ada-yang-cocok-xyz')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_karakter_wildcard_di_pencarian_dianggap_teks_biasa(): void
    {
        $d = $this->buatDunia();

        foreach (['%', '\\'] as $kata) {
            $this->sebagai($d->admin)->getJson(self::URL.'?cari='.urlencode($kata))
                ->assertOk()->assertJsonCount(0, 'data');
        }

        // "_" bukan wildcard satu karakter: "b_c" hanya cocok dengan teks "b_c" apa adanya
        $cocok = Pengguna::factory()->create(['username' => 'zz.ab_cd']);
        Pengguna::factory()->create(['username' => 'zz.abXcd']);

        $ids = array_column($this->sebagai($d->admin)->getJson(self::URL.'?cari='.urlencode('ab_c'))->assertOk()->json('data'), 'id_pengguna');
        $this->assertSame([$cocok->id_pengguna], $ids);
    }

    public function test_pengurutan_dengan_whitelist(): void
    {
        $d = $this->buatDunia();

        $id = array_column($this->sebagai($d->admin)->getJson(self::URL.'?urut=id_pengguna&arah=desc&per_page=100')->json('data'), 'id_pengguna');

        $terurut = $id;
        rsort($terurut);
        $this->assertSame($terurut, $id);
    }

    public function test_status_bawaan_hanya_aktif_dan_filter_status(): void
    {
        $d = $this->buatDunia();
        $mati = Pengguna::factory()->nonaktif()->create();

        $ids = fn (string $q) => array_column($this->sebagai($d->admin)->getJson(self::URL.'?per_page=100'.$q)->assertOk()->json('data'), 'id_pengguna');

        $this->assertNotContains($mati->id_pengguna, $ids(''));
        $this->assertSame([$mati->id_pengguna], $ids('&status=nonaktif'));
        $this->assertContains($mati->id_pengguna, $ids('&status=semua'));
        $this->assertContains($d->admin->id_pengguna, $ids('&status=semua'));
    }

    // ---------------------------------------------------------------- detail

    public function test_detail_200_404_dan_id_tidak_numerik(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->getJson(self::URL.'/'.$d->siswa1->id_pengguna)
            ->assertOk()->assertJsonPath('data.id_pengguna', $d->siswa1->id_pengguna)
            ->assertJsonPath('data.aktif', true)->assertJsonMissingPath('data.password');

        foreach (['999999', 'abc', '99999999999999999999'] as $id) {
            $this->sebagai($d->admin)->getJson(self::URL.'/'.$id)->assertNotFound()->assertJsonPath('code', 'not_found');
        }
    }

    // ---------------------------------------------------------------- buat

    /** @return array<string, mixed> */
    private function payloadSiswa(array $ubah = []): array
    {
        return array_merge([
            'peran' => 'siswa', 'nisn' => '0123456789', 'username' => 'siswa.baru',
            'email' => 'Siswa.Baru@Contoh.Test', 'password' => self::PASSWORD_UJI,
        ], $ubah);
    }

    public function test_admin_membuat_siswa_guru_dan_admin(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL, $this->payloadSiswa())
            ->assertCreated()->assertJsonPath('data.peran', 'siswa')
            ->assertJsonPath('data.email', 'siswa.baru@contoh.test') // dinormalisasi huruf kecil
            ->assertJsonPath('data.aktif', true)->assertJsonMissingPath('data.password');

        $this->sebagai($d->admin)->postJson(self::URL, ['peran' => 'guru', 'nip' => '123456789012345678', 'password' => self::PASSWORD_UJI])
            ->assertCreated()->assertJsonPath('data.peran', 'guru');

        $this->sebagai($d->admin)->postJson(self::URL, ['peran' => 'admin', 'username' => 'admin.kedua', 'password' => self::PASSWORD_UJI])
            ->assertCreated()->assertJsonPath('data.peran', 'admin');
    }

    public function test_password_tersimpan_sebagai_hash(): void
    {
        $d = $this->buatDunia();
        $id = $this->sebagai($d->admin)->postJson(self::URL, $this->payloadSiswa())->assertCreated()->json('data.id_pengguna');

        $hash = DB::table('pengguna')->where('id_pengguna', $id)->value('password');

        $this->assertNotSame(self::PASSWORD_UJI, $hash);
        $this->assertTrue(Hash::check(self::PASSWORD_UJI, $hash));
    }

    /** @return array<string, array{0: array<string, mixed>, 1: string}> */
    public static function payloadTidakValid(): array
    {
        return [
            'peran kosong' => [['peran' => null], 'peran'],
            'peran tidak dikenal' => [['peran' => 'superadmin'], 'peran'],
            'siswa tanpa nisn' => [['nisn' => null], 'nisn'],
            'nisn bukan 10 digit' => [['nisn' => '12345'], 'nisn'],
            'nisn berisi huruf' => [['nisn' => '12345abcde'], 'nisn'],
            'siswa dengan nip' => [['nip' => '123456789012345678'], 'nip'],
            'username terlalu pendek' => [['username' => 'ab'], 'username'],
            'username diawali angka' => [['username' => '1budi'], 'username'],
            'email tidak valid' => [['email' => 'bukan-email'], 'email'],
            'password kosong' => [['password' => null], 'password'],
            'password lemah' => [['password' => 'pendek'], 'password'],
            'password tanpa angka' => [['password' => 'HurufSajaPanjang'], 'password'],
        ];
    }

    /** @param array<string, mixed> $ubah */
    #[DataProvider('payloadTidakValid')]
    public function test_validasi_pembuatan(array $ubah, string $kolom): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL, $this->payloadSiswa($ubah))
            ->assertUnprocessable()->assertJsonPath('code', 'validation_error')->assertJsonValidationErrors($kolom, 'errors');
    }

    public function test_guru_wajib_nip_dan_admin_wajib_username(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL, ['peran' => 'guru', 'password' => self::PASSWORD_UJI])
            ->assertUnprocessable()->assertJsonValidationErrors('nip', 'errors');
        $this->sebagai($d->admin)->postJson(self::URL, ['peran' => 'guru', 'nip' => '123456789012345678', 'nisn' => '0123456789', 'password' => self::PASSWORD_UJI])
            ->assertUnprocessable()->assertJsonValidationErrors('nisn', 'errors');
        $this->sebagai($d->admin)->postJson(self::URL, ['peran' => 'admin', 'password' => self::PASSWORD_UJI])
            ->assertUnprocessable()->assertJsonValidationErrors('username', 'errors');
    }

    public function test_identitas_dan_email_unik_termasuk_lintas_kolom(): void
    {
        $d = $this->buatDunia();

        // NISN ganda
        $this->sebagai($d->admin)->postJson(self::URL, $this->payloadSiswa(['nisn' => $d->siswa1->nisn, 'email' => null]))
            ->assertUnprocessable()->assertJsonValidationErrors('nisn', 'errors');

        // username sama dengan NISN akun lain -> login ambigu, ditolak
        $this->sebagai($d->admin)->postJson(self::URL, $this->payloadSiswa(['username' => $d->siswa1->nisn, 'nisn' => '9999999999', 'email' => null]))
            ->assertUnprocessable()->assertJsonValidationErrors('username', 'errors');

        // email sama tanpa membedakan huruf besar/kecil
        $d->guruA->forceFill(['email' => 'guru.a@contoh.test'])->save();
        $this->sebagai($d->admin)->postJson(self::URL, $this->payloadSiswa(['email' => 'GURU.A@contoh.test']))
            ->assertUnprocessable()->assertJsonValidationErrors('email', 'errors');
    }

    public function test_peran_di_body_tidak_bisa_dipakai_untuk_eskalasi_oleh_non_admin(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa1)->postJson(self::URL, $this->payloadSiswa(['peran' => 'admin', 'username' => 'penyusup']))->assertForbidden();
        $this->assertDatabaseMissing('pengguna', ['username' => 'penyusup']);
    }

    // ---------------------------------------------------------------- ubah

    public function test_admin_mengubah_identitas_email_dan_password(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->siswa1->id_pengguna, [
            'username' => 'nama.baru', 'email' => 'Baru@Contoh.Test', 'password' => 'PasswordBaru2026Aman',
        ])->assertOk()->assertJsonPath('data.username', 'nama.baru')->assertJsonPath('data.email', 'baru@contoh.test');

        $this->assertTrue(Hash::check('PasswordBaru2026Aman', $d->siswa1->fresh()->password));
    }

    public function test_peran_tidak_bisa_diubah_dan_identitas_peran_lain_dilarang(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->siswa1->id_pengguna, ['peran' => 'admin'])
            ->assertUnprocessable()->assertJsonValidationErrors('peran', 'errors');
        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->siswa1->id_pengguna, ['nip' => '123456789012345678'])
            ->assertUnprocessable()->assertJsonValidationErrors('nip', 'errors');
        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->guruA->id_pengguna, ['nisn' => '0123456789'])
            ->assertUnprocessable()->assertJsonValidationErrors('nisn', 'errors');

        $this->assertSame('siswa', $d->siswa1->fresh()->peran->value);
    }

    public function test_ubah_menolak_bentrok_identitas_dan_mengizinkan_nilai_milik_sendiri(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->siswa1->id_pengguna, ['nisn' => $d->siswa2->nisn])
            ->assertUnprocessable()->assertJsonValidationErrors('nisn', 'errors');

        // mengirim ulang NISN miliknya sendiri tidak dianggap bentrok
        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->siswa1->id_pengguna, ['nisn' => $d->siswa1->nisn])->assertOk();

        // NISN siswa tidak boleh dikosongkan
        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->siswa1->id_pengguna, ['nisn' => null])
            ->assertUnprocessable()->assertJsonValidationErrors('nisn', 'errors');
    }

    public function test_ubah_404_untuk_pengguna_tidak_ada(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->patchJson(self::URL.'/999999', ['email' => 'x@contoh.test'])->assertNotFound();
    }

    public function test_ganti_password_mencabut_sesi_database_pengguna_itu(): void
    {
        if (! Schema::hasTable('sessions')) {
            $this->markTestSkipped('Tabel sessions belum ada.');
        }

        $d = $this->buatDunia();
        config(['session.driver' => 'database']);

        foreach (['sesi-siswa-1', 'sesi-siswa-2', 'sesi-lain'] as $i => $sid) {
            DB::table('sessions')->insert([
                'id' => $sid, 'user_id' => $i < 2 ? $d->siswa1->id_pengguna : $d->siswa2->id_pengguna,
                'payload' => '', 'last_activity' => time(),
            ]);
        }

        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$d->siswa1->id_pengguna, ['password' => 'PasswordBaru2026Aman'])->assertOk();

        $this->assertSame(0, DB::table('sessions')->where('user_id', $d->siswa1->id_pengguna)->count());
        $this->assertSame(1, DB::table('sessions')->where('id', 'sesi-lain')->count());
    }

    // ---------------------------------------------------------------- nonaktifkan

    public function test_nonaktifkan_lalu_login_ditolak_dan_sesi_lama_401(): void
    {
        $d = $this->buatDunia();
        $siswa = Pengguna::factory()->create(['username' => 'siswa.mati', 'password' => self::PASSWORD_UJI]);

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$siswa->id_pengguna.'/nonaktifkan')
            ->assertOk()->assertJsonPath('data.aktif', false);
        $this->assertNotNull($siswa->fresh()->nonaktif_pada);

        // login gagal dengan pesan generik (status akun tidak dibocorkan)
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/'])
            ->postJson('/api/v1/auth/login', ['login' => 'siswa.mati', 'password' => self::PASSWORD_UJI])
            ->assertUnprocessable()->assertJsonPath('code', 'invalid_credentials');

        // sesi yang masih hidup tidak dapat dipakai lagi
        $this->sebagai($siswa->fresh())->getJson('/api/v1/kelas')->assertUnauthorized();
        $this->sebagai($siswa->fresh())->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_nonaktifkan_idempotent_dan_aktifkan_memulihkan(): void
    {
        $d = $this->buatDunia();
        $siswa = Pengguna::factory()->create();
        $url = self::URL.'/'.$siswa->id_pengguna;

        $this->sebagai($d->admin)->postJson($url.'/nonaktifkan')->assertOk();
        $awal = $siswa->fresh()->nonaktif_pada;
        $this->sebagai($d->admin)->postJson($url.'/nonaktifkan')->assertOk();
        $this->assertEquals($awal, $siswa->fresh()->nonaktif_pada);

        $this->sebagai($d->admin)->postJson($url.'/aktifkan')->assertOk()->assertJsonPath('data.aktif', true);
        $this->assertNull($siswa->fresh()->nonaktif_pada);
    }

    public function test_admin_tidak_bisa_menonaktifkan_dirinya_sendiri(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$d->admin->id_pengguna.'/nonaktifkan')->assertForbidden();
        $this->assertNull($d->admin->fresh()->nonaktif_pada);
    }

    public function test_guru_wali_kelas_aktif_tidak_bisa_dinonaktifkan(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$d->guruB->id_pengguna.'/nonaktifkan')
            ->assertStatus(409)->assertJsonPath('code', 'teacher_is_active_homeroom');
        $this->assertNull($d->guruB->fresh()->nonaktif_pada);
    }

    public function test_guru_pengampu_mapel_aktif_tidak_bisa_dinonaktifkan(): void
    {
        $d = $this->buatDunia();
        $d->kelasB->update(['id_wali' => $d->guruC->id_pengguna]); // bebaskan guruB dari wali

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$d->guruB->id_pengguna.'/nonaktifkan')
            ->assertStatus(409)->assertJsonPath('code', 'teacher_has_active_subjects');
    }

    public function test_guru_dengan_jadwal_mendatang_tidak_bisa_dinonaktifkan_tapi_jadwal_lampau_boleh(): void
    {
        $d = $this->buatDunia();
        $guru = Pengguna::factory()->guru()->create();

        $this->buatJadwal($d->mapelA, $d->kelasA, $guru, $this->kemarin(11));
        $this->sebagai($d->admin)->postJson(self::URL.'/'.$guru->id_pengguna.'/nonaktifkan')->assertOk();

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$guru->id_pengguna.'/aktifkan')->assertOk();
        $this->buatJadwal($d->mapelA, $d->kelasA, $guru, $this->besok(13));
        $this->sebagai($d->admin)->postJson(self::URL.'/'.$guru->id_pengguna.'/nonaktifkan')
            ->assertStatus(409)->assertJsonPath('code', 'teacher_has_upcoming_schedule');
    }

    public function test_guru_bebas_tanggungan_dapat_dinonaktifkan(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$d->guruC->id_pengguna.'/nonaktifkan')
            ->assertOk()->assertJsonPath('data.aktif', false);
    }
}
