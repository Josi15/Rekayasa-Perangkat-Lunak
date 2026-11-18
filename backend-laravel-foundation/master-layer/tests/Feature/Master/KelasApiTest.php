<?php

namespace Tests\Feature\Master;

use App\Models\Kelas;
use App\Models\Pengguna;
use Illuminate\Database\QueryException;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class KelasApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const URL = '/api/v1/kelas';

    /** @return list<int> */
    private function idKelas(Pengguna $pelaku, string $query = ''): array
    {
        return array_column($this->sebagai($pelaku)->getJson(self::URL.'?per_page=100'.$query)->assertOk()->json('data'), 'id_kelas');
    }

    public function test_tanpa_login_401_untuk_semua_endpoint(): void
    {
        foreach ([['GET', ''], ['POST', ''], ['GET', '/1'], ['PATCH', '/1'], ['PUT', '/1/wali'], ['POST', '/1/arsipkan'], ['POST', '/1/pulihkan']] as [$m, $u]) {
            $this->json($m, self::URL.$u)->assertUnauthorized();
        }
    }

    // ---------------------------------------------------------------- daftar

    public function test_daftar_dibatasi_peran(): void
    {
        $d = $this->buatDunia();

        $this->assertEqualsCanonicalizing([$d->kelasA->id_kelas, $d->kelasB->id_kelas], $this->idKelas($d->admin));
        $this->assertSame([$d->kelasA->id_kelas], $this->idKelas($d->siswa1));
        $this->assertSame([$d->kelasA->id_kelas], $this->idKelas($d->guruA));
        $this->assertSame([], $this->idKelas($d->guruC));
    }

    public function test_daftar_pagination_pencarian_dan_urutan(): void
    {
        $d = $this->buatDunia();
        $wali = Pengguna::factory()->guru()->create();
        foreach (['X-1', 'X-2', 'X-3', 'Y-1'] as $nama) {
            Kelas::factory()->create(['nama_kelas' => $nama, 'id_wali' => $wali->id_pengguna]);
        }

        $r = $this->sebagai($d->admin)->getJson(self::URL.'?cari=x-&per_page=2&page=2&urut=nama_kelas&arah=desc')->assertOk();
        $r->assertJsonPath('meta.total', 3)->assertJsonPath('meta.per_page', 2)->assertJsonCount(1, 'data');
        $this->assertSame('X-1', $r->json('data.0.nama_kelas'));

        $this->sebagai($d->admin)->getJson(self::URL.'?id_wali='.$wali->id_pengguna)->assertOk()->assertJsonPath('meta.total', 4);
    }

    public function test_daftar_parameter_tidak_valid_422(): void
    {
        $d = $this->buatDunia();

        foreach (['per_page=101', 'urut=id_wali', 'status=hapus', 'id_wali=abc'] as $q) {
            $this->sebagai($d->admin)->getJson(self::URL.'?'.$q)->assertUnprocessable();
        }
    }

    public function test_status_arsip_pada_daftar(): void
    {
        $d = $this->buatDunia();
        $arsip = Kelas::factory()->diarsipkan()->create(['id_wali' => $d->guruC->id_pengguna]);

        $this->assertNotContains($arsip->id_kelas, $this->idKelas($d->admin));
        $this->assertSame([$arsip->id_kelas], $this->idKelas($d->admin, '&status=diarsipkan'));
        $this->assertContains($arsip->id_kelas, $this->idKelas($d->admin, '&status=semua'));
    }

    // ---------------------------------------------------------------- detail

    public function test_detail_memuat_wali_dan_jumlah_siswa_tanpa_data_pribadi_wali(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa1)->getJson(self::URL.'/'.$d->kelasA->id_kelas)->assertOk()
            ->assertJsonPath('data.id_wali', $d->guruA->id_pengguna)
            ->assertJsonPath('data.wali.id_pengguna', $d->guruA->id_pengguna)
            ->assertJsonPath('data.jumlah_siswa', 1)
            ->assertJsonPath('data.aktif', true)
            ->assertJsonMissingPath('data.wali.email')->assertJsonMissingPath('data.wali.nip');

        $this->sebagai($d->siswa1)->getJson(self::URL.'/'.$d->kelasB->id_kelas)->assertForbidden();
        $this->sebagai($d->admin)->getJson(self::URL.'/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson(self::URL.'/abc')->assertNotFound();
    }

    // ---------------------------------------------------------------- buat

    public function test_admin_membuat_kelas(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL, ['nama_kelas' => 'XII IPA 1', 'id_wali' => $d->guruC->id_pengguna])
            ->assertCreated()->assertJsonPath('data.nama_kelas', 'XII IPA 1')
            ->assertJsonPath('data.wali.id_pengguna', $d->guruC->id_pengguna)->assertJsonPath('data.jumlah_siswa', 0);

        $this->assertDatabaseHas('kelas', ['nama_kelas' => 'XII IPA 1', 'id_wali' => $d->guruC->id_pengguna]);
    }

    public function test_guru_dan_siswa_tidak_boleh_membuat_kelas(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruA, $d->siswa1] as $pelaku) {
            $this->sebagai($pelaku)->postJson(self::URL, ['nama_kelas' => 'Liar', 'id_wali' => $d->guruC->id_pengguna])->assertForbidden();
        }
        $this->assertDatabaseMissing('kelas', ['nama_kelas' => 'Liar']);
    }

    public function test_validasi_dan_foreign_key_wali_saat_membuat(): void
    {
        $d = $this->buatDunia();
        $guruMati = Pengguna::factory()->guru()->nonaktif()->create();

        $kasus = [
            'nama kosong' => [['id_wali' => $d->guruC->id_pengguna], 'nama_kelas'],
            'nama duplikat' => [['nama_kelas' => $d->kelasA->nama_kelas, 'id_wali' => $d->guruC->id_pengguna], 'nama_kelas'],
            'nama terlalu panjang' => [['nama_kelas' => str_repeat('a', 101), 'id_wali' => $d->guruC->id_pengguna], 'nama_kelas'],
            'wali kosong' => [['nama_kelas' => 'Baru'], 'id_wali'],
            'wali tidak ada (FK)' => [['nama_kelas' => 'Baru', 'id_wali' => 999999], 'id_wali'],
            'wali bukan guru' => [['nama_kelas' => 'Baru', 'id_wali' => $d->siswa1->id_pengguna], 'id_wali'],
            'wali admin' => [['nama_kelas' => 'Baru', 'id_wali' => $d->admin->id_pengguna], 'id_wali'],
            'wali guru nonaktif' => [['nama_kelas' => 'Baru', 'id_wali' => $guruMati->id_pengguna], 'id_wali'],
            'wali bukan angka' => [['nama_kelas' => 'Baru', 'id_wali' => 'abc'], 'id_wali'],
        ];

        foreach ($kasus as $nama => [$payload, $kolom]) {
            $this->sebagai($d->admin)->postJson(self::URL, $payload)
                ->assertUnprocessable($nama)->assertJsonValidationErrors($kolom, 'errors');
        }
    }

    // ---------------------------------------------------------------- ubah

    public function test_admin_mengubah_nama_kelas_dan_validasinya(): void
    {
        $d = $this->buatDunia();
        $url = self::URL.'/'.$d->kelasA->id_kelas;

        $this->sebagai($d->admin)->patchJson($url, ['nama_kelas' => 'Nama Baru'])->assertOk()->assertJsonPath('data.nama_kelas', 'Nama Baru');
        $this->sebagai($d->admin)->patchJson($url, ['nama_kelas' => 'Nama Baru'])->assertOk(); // nama sendiri tidak bentrok
        $this->sebagai($d->admin)->patchJson($url, ['nama_kelas' => $d->kelasB->nama_kelas])->assertUnprocessable();
        $this->sebagai($d->admin)->patchJson($url, ['nama_kelas' => ''])->assertUnprocessable();
        $this->sebagai($d->admin)->patchJson($url, ['nama_kelas' => 'Lain', 'id_wali' => $d->guruC->id_pengguna])
            ->assertUnprocessable()->assertJsonValidationErrors('id_wali', 'errors');
    }

    public function test_wali_kelas_tidak_boleh_mengubah_kelasnya_sendiri(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->patchJson(self::URL.'/'.$d->kelasA->id_kelas, ['nama_kelas' => 'Dibajak'])->assertForbidden();
        $this->assertNotSame('Dibajak', $d->kelasA->fresh()->nama_kelas);
    }

    public function test_kelas_arsip_tidak_bisa_diubah(): void
    {
        $d = $this->buatDunia();
        $arsip = Kelas::factory()->diarsipkan()->create(['id_wali' => $d->guruC->id_pengguna]);

        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$arsip->id_kelas, ['nama_kelas' => 'Baru'])
            ->assertStatus(409)->assertJsonPath('code', 'class_archived');
    }

    // ---------------------------------------------------------------- wali

    public function test_admin_mengganti_wali_kelas(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->putJson(self::URL.'/'.$d->kelasA->id_kelas.'/wali', ['id_wali' => $d->guruC->id_pengguna])
            ->assertOk()->assertJsonPath('data.id_wali', $d->guruC->id_pengguna)->assertJsonPath('data.wali.id_pengguna', $d->guruC->id_pengguna);

        // wali lama kehilangan hak mengelola anggota; wali baru memperolehnya
        $this->sebagai($d->guruA)->postJson(self::URL.'/'.$d->kelasA->id_kelas.'/anggota', ['id_siswa' => [$d->siswa2->id_pengguna]])->assertForbidden();
        $this->sebagai($d->guruC)->postJson(self::URL.'/'.$d->kelasA->id_kelas.'/anggota', ['id_siswa' => [$d->siswa2->id_pengguna]])->assertCreated();
    }

    public function test_ganti_wali_validasi_foreign_key_dan_otorisasi(): void
    {
        $d = $this->buatDunia();
        $url = self::URL.'/'.$d->kelasA->id_kelas.'/wali';

        foreach ([[], ['id_wali' => 999999], ['id_wali' => $d->siswa1->id_pengguna], ['id_wali' => $d->admin->id_pengguna]] as $payload) {
            $this->sebagai($d->admin)->putJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors('id_wali', 'errors');
        }

        $this->sebagai($d->guruA)->putJson($url, ['id_wali' => $d->guruC->id_pengguna])->assertForbidden();
        $this->sebagai($d->siswa1)->putJson($url, ['id_wali' => $d->guruC->id_pengguna])->assertForbidden();
        $this->assertSame($d->guruA->id_pengguna, $d->kelasA->fresh()->id_wali);
    }

    public function test_foreign_key_database_mencegah_hapus_guru_yang_masih_wali(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $d->guruA->delete(); // FK kelas.id_wali = RESTRICT
    }

    // ---------------------------------------------------------------- arsip

    public function test_arsipkan_dan_pulihkan_kelas(): void
    {
        $d = $this->buatDunia();
        $kelas = Kelas::factory()->create(['id_wali' => $d->guruC->id_pengguna]);
        $url = self::URL.'/'.$kelas->id_kelas;

        $this->sebagai($d->admin)->postJson($url.'/arsipkan')->assertOk()->assertJsonPath('data.aktif', false);
        $this->assertNotNull($kelas->fresh()->diarsipkan_pada);
        $this->sebagai($d->admin)->postJson($url.'/arsipkan')->assertOk(); // idempotent
        $this->assertNotContains($kelas->id_kelas, $this->idKelas($d->admin));

        $this->sebagai($d->admin)->postJson($url.'/pulihkan')->assertOk()->assertJsonPath('data.aktif', true);
        $this->assertContains($kelas->id_kelas, $this->idKelas($d->admin));
    }

    public function test_arsip_ditolak_bila_ada_jadwal_mendatang_tetapi_boleh_bila_hanya_lampau(): void
    {
        $d = $this->buatDunia();
        $kelas = Kelas::factory()->create(['id_wali' => $d->guruC->id_pengguna]);
        $url = self::URL.'/'.$kelas->id_kelas.'/arsipkan';

        $this->buatJadwal($d->mapelA, $kelas, $d->guruA, $this->besok());
        $this->sebagai($d->admin)->postJson($url)->assertStatus(409)->assertJsonPath('code', 'class_has_upcoming_schedule');
        $this->assertNull($kelas->fresh()->diarsipkan_pada);

        $kelas2 = Kelas::factory()->create(['id_wali' => $d->guruC->id_pengguna]);
        $this->buatJadwal($d->mapelA, $kelas2, $d->guruA, $this->kemarin());
        $this->sebagai($d->admin)->postJson(self::URL.'/'.$kelas2->id_kelas.'/arsipkan')->assertOk();
    }

    public function test_pulihkan_ditolak_bila_wali_nonaktif(): void
    {
        $d = $this->buatDunia();
        $kelas = Kelas::factory()->diarsipkan()->create(['id_wali' => $d->guruC->id_pengguna]);
        $d->guruC->forceFill(['nonaktif_pada' => now()])->save();

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$kelas->id_kelas.'/pulihkan')
            ->assertStatus(409)->assertJsonPath('code', 'homeroom_teacher_inactive');
    }

    public function test_hanya_admin_boleh_arsip_dan_pulihkan(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruA, $d->siswa1] as $pelaku) {
            foreach (['arsipkan', 'pulihkan'] as $aksi) {
                $this->sebagai($pelaku)->postJson(self::URL.'/'.$d->kelasA->id_kelas.'/'.$aksi)->assertForbidden();
            }
        }
        $this->assertNull($d->kelasA->fresh()->diarsipkan_pada);
    }
}
