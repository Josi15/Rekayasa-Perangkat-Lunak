<?php

namespace Tests\Feature\Final;

use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class KeamananInputTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    // ------------------------------------------------------------- error tidak membocorkan internal

    public function test_error_500_tidak_membocorkan_detail_internal_saat_debug_mati(): void
    {
        config(['app.debug' => false]);
        Route::middleware('api')->get('api/v1/__uji-error', function () {
            throw new \RuntimeException('RAHASIA-INTERNAL SQLSTATE[23505] /var/www/app/Rahasia.php');
        });
        $d = $this->buatDunia();

        $res = $this->sebagai($d->admin)->getJson('/api/v1/__uji-error')->assertStatus(500);

        $this->assertSame('server_error', $res->json('code'));
        $this->assertArrayNotHasKey('debug', $res->json());
        $isi = $res->getContent();
        foreach (['RAHASIA-INTERNAL', 'SQLSTATE', '/var/www', 'RuntimeException', 'Stack trace', 'vendor/'] as $terlarang) {
            $this->assertStringNotContainsString($terlarang, $isi);
        }
    }

    // ------------------------------------------------------------- data sensitif

    public function test_respons_tidak_pernah_memuat_password_atau_token(): void
    {
        $d = $this->buatDunia();
        $urls = ['/api/v1/auth/me', '/api/v1/profil', '/api/v1/admin/pengguna', '/api/v1/admin/pengguna/'.$d->siswa1->id_pengguna,
            '/api/v1/kelas/'.$d->kelasA->id_kelas.'/anggota', '/api/v1/kelas/'.$d->kelasA->id_kelas, '/api/v1/mapel/'.$d->mapelA->id_mapel,
            '/api/v1/jadwal', '/api/v1/pengumuman', '/api/v1/dashboard', '/api/v1/nilai'];

        foreach ($urls as $url) {
            $isi = strtolower($this->sebagai($d->admin)->getJson($url)->getContent());
            foreach (['"password"', 'remember_token', '$2y$', 'password_hash'] as $terlarang) {
                $this->assertStringNotContainsString($terlarang, $isi, "$url memuat $terlarang");
            }
        }
    }

    public function test_siswa_tidak_melihat_nip_guru_pada_jadwal(): void
    {
        $d = $this->buatDunia();

        $json = $this->sebagai($d->siswa1)->getJson('/api/v1/jadwal/'.$d->jadwalA->id_jadwal)->assertOk()->json('data.guru');

        $this->assertArrayNotHasKey('nip', $json);
        $this->assertArrayHasKey('nip', $this->sebagai($d->admin)->getJson('/api/v1/jadwal/'.$d->jadwalA->id_jadwal)->assertOk()->json('data.guru'));
    }

    // ------------------------------------------------------------- mass assignment

    public function test_mass_assignment_pada_pembuatan_pengguna_diabaikan(): void
    {
        $d = $this->buatDunia();

        $res = $this->sebagai($d->admin)->postJson('/api/v1/admin/pengguna', [
            'peran' => 'siswa', 'nisn' => '1234567890', 'password' => self::PASSWORD_UJI,
            'id_pengguna' => 987654, 'nonaktif_pada' => now()->toIso8601String(), 'remember_token' => 'x', 'email_verified_at' => now()->toIso8601String(),
        ]);

        $this->assertContains($res->status(), [201, 422]);
        if ($res->status() === 201) {
            $baru = Pengguna::query()->where('nisn', '1234567890')->firstOrFail();
            $this->assertNotSame(987654, $baru->id_pengguna);
            $this->assertNull($baru->nonaktif_pada);
            $this->assertNull($baru->remember_token);
        }
        $this->assertDatabaseMissing('pengguna', ['id_pengguna' => 987654]);
    }

    public function test_siswa_tidak_dapat_menaikkan_peran_atau_mengaktifkan_diri_lewat_profil(): void
    {
        $d = $this->buatDunia();

        // peran/nisn/nip/username dilarang eksplisit (422)
        foreach (['peran' => 'admin', 'nisn' => '9999999999'] as $kolom => $nilai) {
            $this->sebagai($d->siswa1)->patchJson('/api/v1/profil', [$kolom => $nilai])->assertUnprocessable();
        }
        // kolom lain di luar daftar yang boleh diubah: boleh diabaikan (200) atau ditolak (422), tetapi tidak boleh berefek
        foreach (['id_pengguna' => 1, 'nonaktif_pada' => '2026-01-01T00:00:00Z', 'remember_token' => 'x'] as $kolom => $nilai) {
            $this->assertContains($this->sebagai($d->siswa1)->patchJson('/api/v1/profil', [$kolom => $nilai])->status(), [200, 422]);
        }

        $baru = $d->siswa1->fresh();
        $this->assertSame('siswa', $baru->peran->value);
        $this->assertSame($d->siswa1->id_pengguna, $baru->id_pengguna);
        $this->assertNull($baru->nonaktif_pada);
        $this->assertSame($d->siswa1->remember_token, $baru->remember_token);
    }

    // ------------------------------------------------------------- password

    public function test_password_disimpan_sebagai_hash_bcrypt_dan_dapat_dipakai_login(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson('/api/v1/admin/pengguna', ['peran' => 'siswa', 'nisn' => '5555555555', 'password' => self::PASSWORD_UJI])->assertCreated();

        $baris = DB::table('pengguna')->where('nisn', '5555555555')->first();
        $this->assertNotSame(self::PASSWORD_UJI, $baris->password);
        $this->assertStringStartsWith('$2y$', $baris->password);
        $this->assertTrue(Hash::check(self::PASSWORD_UJI, $baris->password));

        $this->postJson('/api/v1/auth/login', ['login' => '5555555555', 'password' => self::PASSWORD_UJI])->assertOk();
    }

    public function test_password_lemah_ditolak(): void
    {
        $d = $this->buatDunia();

        foreach (['short1A', 'passwordpanjangtanpaangka', 'PASSWORDHURUFBESAR123', '12345678901234'] as $lemah) {
            $this->sebagai($d->admin)->postJson('/api/v1/admin/pengguna', ['peran' => 'siswa', 'nisn' => '4444444444', 'password' => $lemah])
                ->assertUnprocessable()->assertJsonValidationErrors(['password']);
        }
        $this->assertDatabaseMissing('pengguna', ['nisn' => '4444444444']);
    }

    // ------------------------------------------------------------- injeksi SQL & parameter aneh

    /** @return array<string, array{0: string}> */
    public static function urlDaftarBerpencarian(): array
    {
        return ['pengguna' => ['/api/v1/admin/pengguna'], 'kelas' => ['/api/v1/kelas'], 'mapel' => ['/api/v1/mapel'],
            'tugas' => ['/api/v1/tugas'], 'kuis' => ['/api/v1/kuis'], 'pengumuman' => ['/api/v1/pengumuman']];
    }

    #[DataProvider('urlDaftarBerpencarian')]
    public function test_pencarian_diperlakukan_sebagai_teks_bukan_sql(string $url): void
    {
        $d = $this->buatDunia();
        $jumlahPengguna = DB::table('pengguna')->count();

        foreach (["' OR '1'='1", '"; DROP TABLE pengguna; --', '%', '_', '\\', "a' UNION SELECT password FROM pengguna --"] as $payload) {
            $res = $this->sebagai($d->admin)->getJson($url.'?cari='.rawurlencode($payload));

            $res->assertOk();
            $this->assertCount(0, $res->json('data'), "Payload '$payload' pada $url mengembalikan baris.");
        }

        $this->assertSame($jumlahPengguna, DB::table('pengguna')->count());
    }

    public function test_urutan_dan_id_dengan_injeksi_ditolak_tanpa_error_server(): void
    {
        $d = $this->buatDunia();

        foreach (['/api/v1/kelas?urut=nama_kelas;DROP%20TABLE%20kelas', '/api/v1/kelas?urut[]=id_kelas', '/api/v1/kelas?arah=asc;--',
            '/api/v1/kelas?per_page[]=1', '/api/v1/kelas?page=-1', '/api/v1/kelas?page=99999999999999999999'] as $url) {
            $this->assertContains($this->sebagai($d->admin)->getJson($url)->status(), [200, 422], $url);
        }
        $this->sebagai($d->admin)->getJson('/api/v1/kelas?urut=nama_kelas;DROP%20TABLE%20kelas')->assertUnprocessable();

        foreach (['1%20OR%201=1', '1;DROP%20TABLE%20kelas', '99999999999999999999', '-1', '1.5', 'abc'] as $id) {
            $this->sebagai($d->admin)->getJson('/api/v1/kelas/'.$id)->assertNotFound();
        }
        $this->assertDatabaseHas('kelas', ['id_kelas' => $d->kelasA->id_kelas]);
    }
}
