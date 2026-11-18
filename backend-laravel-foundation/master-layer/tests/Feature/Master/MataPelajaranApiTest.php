<?php

namespace Tests\Feature\Master;

use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class MataPelajaranApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const URL = '/api/v1/mapel';

    /** @return list<int> */
    private function idMapel(Pengguna $pelaku, string $query = ''): array
    {
        return array_column($this->sebagai($pelaku)->getJson(self::URL.'?per_page=100'.$query)->assertOk()->json('data'), 'id_mapel');
    }

    public function test_tanpa_login_401_untuk_semua_endpoint(): void
    {
        foreach ([['GET', ''], ['POST', ''], ['GET', '/1'], ['PATCH', '/1'], ['PUT', '/1/guru'], ['POST', '/1/arsipkan'], ['POST', '/1/pulihkan']] as [$m, $u]) {
            $this->json($m, self::URL.$u)->assertUnauthorized();
        }
    }

    // ---------------------------------------------------------------- daftar

    public function test_daftar_dibatasi_peran(): void
    {
        $d = $this->buatDunia();

        $this->assertEqualsCanonicalizing([$d->mapelA->id_mapel, $d->mapelB->id_mapel], $this->idMapel($d->admin));
        $this->assertSame([$d->mapelA->id_mapel], $this->idMapel($d->guruA));
        $this->assertSame([$d->mapelA->id_mapel], $this->idMapel($d->siswa1)); // via jadwal kelasnya
        $this->assertSame([], $this->idMapel($d->guruC));
    }

    public function test_daftar_pagination_pencarian_filter_guru_dan_urutan(): void
    {
        $d = $this->buatDunia();
        foreach (['Fisika', 'Fisika Lanjut', 'Kimia', 'Biologi'] as $nama) {
            MataPelajaran::factory()->create(['nama_mapel' => $nama, 'id_guru' => $d->guruC->id_pengguna]);
        }

        $r = $this->sebagai($d->admin)->getJson(self::URL.'?cari=FISIKA&per_page=1&page=2&urut=nama_mapel')->assertOk();
        $r->assertJsonPath('meta.total', 2)->assertJsonCount(1, 'data')->assertJsonPath('data.0.nama_mapel', 'Fisika Lanjut');

        $this->sebagai($d->admin)->getJson(self::URL.'?id_guru='.$d->guruC->id_pengguna)->assertOk()->assertJsonPath('meta.total', 4);

        foreach (['per_page=0', 'urut=id_guru', 'status=hapus', 'id_guru=abc'] as $q) {
            $this->sebagai($d->admin)->getJson(self::URL.'?'.$q)->assertUnprocessable();
        }
    }

    public function test_status_arsip_pada_daftar(): void
    {
        $d = $this->buatDunia();
        $arsip = MataPelajaran::factory()->diarsipkan()->create(['id_guru' => $d->guruC->id_pengguna]);

        $this->assertNotContains($arsip->id_mapel, $this->idMapel($d->admin));
        $this->assertSame([$arsip->id_mapel], $this->idMapel($d->admin, '&status=diarsipkan'));
        $this->assertContains($arsip->id_mapel, $this->idMapel($d->admin, '&status=semua'));
    }

    // ---------------------------------------------------------------- detail

    public function test_detail_sesuai_hak_akses(): void
    {
        $d = $this->buatDunia();
        $url = self::URL.'/'.$d->mapelA->id_mapel;

        foreach ([$d->admin, $d->guruA, $d->siswa1] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertOk()
                ->assertJsonPath('data.id_guru', $d->guruA->id_pengguna)
                ->assertJsonPath('data.guru.id_pengguna', $d->guruA->id_pengguna)
                ->assertJsonMissingPath('data.guru.email')->assertJsonMissingPath('data.guru.nip');
        }

        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson(self::URL.'/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson(self::URL.'/abc')->assertNotFound();
    }

    // ---------------------------------------------------------------- buat

    public function test_admin_membuat_mapel_dan_guru_lain_boleh_nama_sama(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson(self::URL, ['nama_mapel' => 'Matematika', 'id_guru' => $d->guruC->id_pengguna])
            ->assertCreated()->assertJsonPath('data.guru.id_pengguna', $d->guruC->id_pengguna)->assertJsonPath('data.aktif', true);

        // unik per (nama_mapel, id_guru): guru berbeda boleh mengampu nama yang sama
        $this->sebagai($d->admin)->postJson(self::URL, ['nama_mapel' => 'Matematika', 'id_guru' => $d->guruB->id_pengguna])->assertCreated();
    }

    public function test_guru_dan_siswa_tidak_boleh_membuat_mapel(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruA, $d->siswa1] as $pelaku) {
            $this->sebagai($pelaku)->postJson(self::URL, ['nama_mapel' => 'Liar', 'id_guru' => $pelaku->id_pengguna])->assertForbidden();
        }
        $this->assertDatabaseMissing('mata_pelajaran', ['nama_mapel' => 'Liar']);
    }

    public function test_validasi_dan_foreign_key_guru_saat_membuat(): void
    {
        $d = $this->buatDunia();
        $guruMati = Pengguna::factory()->guru()->nonaktif()->create();

        $kasus = [
            'nama kosong' => [['id_guru' => $d->guruC->id_pengguna], 'nama_mapel'],
            'nama terlalu panjang' => [['nama_mapel' => str_repeat('a', 101), 'id_guru' => $d->guruC->id_pengguna], 'nama_mapel'],
            'pasangan nama-guru duplikat' => [['nama_mapel' => $d->mapelA->nama_mapel, 'id_guru' => $d->guruA->id_pengguna], 'nama_mapel'],
            'guru kosong' => [['nama_mapel' => 'Baru'], 'id_guru'],
            'guru tidak ada (FK)' => [['nama_mapel' => 'Baru', 'id_guru' => 999999], 'id_guru'],
            'guru bukan guru' => [['nama_mapel' => 'Baru', 'id_guru' => $d->siswa1->id_pengguna], 'id_guru'],
            'guru nonaktif' => [['nama_mapel' => 'Baru', 'id_guru' => $guruMati->id_pengguna], 'id_guru'],
        ];

        foreach ($kasus as $nama => [$payload, $kolom]) {
            $this->sebagai($d->admin)->postJson(self::URL, $payload)
                ->assertUnprocessable($nama)->assertJsonValidationErrors($kolom, 'errors');
        }
    }

    // ---------------------------------------------------------------- ubah

    public function test_admin_mengubah_nama_mapel_dan_validasinya(): void
    {
        $d = $this->buatDunia();
        $url = self::URL.'/'.$d->mapelA->id_mapel;
        MataPelajaran::factory()->create(['nama_mapel' => 'Sudah Ada', 'id_guru' => $d->guruA->id_pengguna]);

        $this->sebagai($d->admin)->patchJson($url, ['nama_mapel' => 'Nama Baru'])->assertOk()->assertJsonPath('data.nama_mapel', 'Nama Baru');
        $this->sebagai($d->admin)->patchJson($url, ['nama_mapel' => 'Nama Baru'])->assertOk(); // nama sendiri tidak bentrok
        $this->sebagai($d->admin)->patchJson($url, ['nama_mapel' => 'Sudah Ada'])->assertUnprocessable();
        $this->sebagai($d->admin)->patchJson($url, ['nama_mapel' => ''])->assertUnprocessable();
        $this->sebagai($d->admin)->patchJson($url, ['nama_mapel' => 'X', 'id_guru' => $d->guruC->id_pengguna])
            ->assertUnprocessable()->assertJsonValidationErrors('id_guru', 'errors');
    }

    public function test_guru_pengampu_tidak_boleh_mengubah_mapelnya_sendiri(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->patchJson(self::URL.'/'.$d->mapelA->id_mapel, ['nama_mapel' => 'Dibajak'])->assertForbidden();
        $this->assertNotSame('Dibajak', $d->mapelA->fresh()->nama_mapel);
    }

    public function test_mapel_arsip_tidak_bisa_diubah(): void
    {
        $d = $this->buatDunia();
        $arsip = MataPelajaran::factory()->diarsipkan()->create(['id_guru' => $d->guruC->id_pengguna]);

        $this->sebagai($d->admin)->patchJson(self::URL.'/'.$arsip->id_mapel, ['nama_mapel' => 'Baru'])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
    }

    // ---------------------------------------------------------------- guru pengampu

    public function test_ganti_guru_mengalihkan_jadwal_mendatang_tetapi_bukan_riwayat(): void
    {
        $d = $this->buatDunia();
        $mapel = MataPelajaran::factory()->create(['id_guru' => $d->guruA->id_pengguna]);
        $lampau = $this->buatJadwal($mapel, $d->kelasA, $d->guruA, $this->kemarin(21));
        $depan = $this->buatJadwal($mapel, $d->kelasA, $d->guruA, $this->besok(21));

        $this->sebagai($d->admin)->putJson(self::URL.'/'.$mapel->id_mapel.'/guru', ['id_guru' => $d->guruC->id_pengguna])
            ->assertOk()->assertJsonPath('data.id_guru', $d->guruC->id_pengguna)->assertJsonPath('data.guru.id_pengguna', $d->guruC->id_pengguna);

        $this->assertSame($d->guruC->id_pengguna, $depan->fresh()->id_guru);
        $this->assertSame($d->guruA->id_pengguna, $lampau->fresh()->id_guru);
    }

    public function test_ganti_guru_bentrok_jadwal_409_dan_dibatalkan_seluruhnya(): void
    {
        $d = $this->buatDunia();
        $mapel = MataPelajaran::factory()->create(['id_guru' => $d->guruA->id_pengguna]);
        $waktu = $this->besok(30);
        $milikMapel = $this->buatJadwal($mapel, $d->kelasA, $d->guruA, $waktu);
        // guruC sudah mengajar pada waktu yang sama di kelas lain (unique id_guru+waktu_mulai)
        $this->buatJadwal($d->mapelB, $d->kelasB, $d->guruC, $waktu);

        $this->sebagai($d->admin)->putJson(self::URL.'/'.$mapel->id_mapel.'/guru', ['id_guru' => $d->guruC->id_pengguna])
            ->assertStatus(409)->assertJsonPath('code', 'schedule_conflict');

        $this->assertSame($d->guruA->id_pengguna, $mapel->fresh()->id_guru);       // rollback
        $this->assertSame($d->guruA->id_pengguna, $milikMapel->fresh()->id_guru);
    }

    public function test_ganti_guru_validasi_foreign_key_dan_otorisasi(): void
    {
        $d = $this->buatDunia();
        $url = self::URL.'/'.$d->mapelA->id_mapel.'/guru';
        $guruMati = Pengguna::factory()->guru()->nonaktif()->create();
        MataPelajaran::factory()->create(['nama_mapel' => $d->mapelA->nama_mapel, 'id_guru' => $d->guruC->id_pengguna]);

        $kasus = [[], ['id_guru' => 999999], ['id_guru' => 'abc'], ['id_guru' => $d->siswa1->id_pengguna],
            ['id_guru' => $d->admin->id_pengguna], ['id_guru' => $guruMati->id_pengguna],
            ['id_guru' => $d->guruC->id_pengguna] /* sudah mengampu nama yang sama */];

        foreach ($kasus as $payload) {
            $this->sebagai($d->admin)->putJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors('id_guru', 'errors');
        }

        foreach ([$d->guruA, $d->guruB, $d->siswa1] as $pelaku) {
            $this->sebagai($pelaku)->putJson($url, ['id_guru' => $d->guruB->id_pengguna])->assertForbidden();
        }
        $this->assertSame($d->guruA->id_pengguna, $d->mapelA->fresh()->id_guru);
    }

    // ---------------------------------------------------------------- arsip

    public function test_arsipkan_dan_pulihkan_mapel(): void
    {
        $d = $this->buatDunia();
        $mapel = MataPelajaran::factory()->create(['id_guru' => $d->guruC->id_pengguna]);
        $url = self::URL.'/'.$mapel->id_mapel;

        $this->sebagai($d->admin)->postJson($url.'/arsipkan')->assertOk()->assertJsonPath('data.aktif', false);
        $this->sebagai($d->admin)->postJson($url.'/arsipkan')->assertOk(); // idempotent
        $this->assertNotContains($mapel->id_mapel, $this->idMapel($d->admin));

        $this->sebagai($d->admin)->postJson($url.'/pulihkan')->assertOk()->assertJsonPath('data.aktif', true);
        $this->assertContains($mapel->id_mapel, $this->idMapel($d->admin));
    }

    public function test_arsip_ditolak_bila_ada_jadwal_mendatang(): void
    {
        $d = $this->buatDunia();
        $mapel = MataPelajaran::factory()->create(['id_guru' => $d->guruC->id_pengguna]);
        $this->buatJadwal($mapel, $d->kelasA, $d->guruC, $this->besok(40));

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$mapel->id_mapel.'/arsipkan')
            ->assertStatus(409)->assertJsonPath('code', 'subject_has_upcoming_schedule');
        $this->assertNull($mapel->fresh()->diarsipkan_pada);

        Jadwal::query()->where('id_mapel', $mapel->id_mapel)->delete();
        $this->buatJadwal($mapel, $d->kelasA, $d->guruC, $this->kemarin(40));
        $this->sebagai($d->admin)->postJson(self::URL.'/'.$mapel->id_mapel.'/arsipkan')->assertOk();
    }

    public function test_pulihkan_ditolak_bila_guru_nonaktif(): void
    {
        $d = $this->buatDunia();
        $mapel = MataPelajaran::factory()->diarsipkan()->create(['id_guru' => $d->guruC->id_pengguna]);
        $d->guruC->forceFill(['nonaktif_pada' => now()])->save();

        $this->sebagai($d->admin)->postJson(self::URL.'/'.$mapel->id_mapel.'/pulihkan')
            ->assertStatus(409)->assertJsonPath('code', 'teacher_inactive');
    }

    public function test_hanya_admin_boleh_arsip_dan_pulihkan(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruA, $d->siswa1] as $pelaku) {
            foreach (['arsipkan', 'pulihkan'] as $aksi) {
                $this->sebagai($pelaku)->postJson(self::URL.'/'.$d->mapelA->id_mapel.'/'.$aksi)->assertForbidden();
            }
        }
        $this->assertNull($d->mapelA->fresh()->diarsipkan_pada);
    }
}
