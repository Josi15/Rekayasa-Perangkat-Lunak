<?php

namespace Tests\Feature\Master;

use App\Models\Kelas;
use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class AnggotaKelasTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private function anggota(Kelas $kelas): string
    {
        return '/api/v1/kelas/'.$kelas->id_kelas.'/anggota';
    }

    /** @return list<int> */
    private function idAnggota(Kelas $kelas): array
    {
        return DB::table('siswa_kelas')->where('id_kelas', $kelas->id_kelas)->orderBy('id_siswa')->pluck('id_siswa')->map(fn ($i) => (int) $i)->all();
    }

    // ---------------------------------------------------------------- tambah

    public function test_admin_menambah_beberapa_siswa_sekaligus(): void
    {
        $d = $this->buatDunia();
        $baru = Pengguna::factory()->count(2)->create();

        $this->sebagai($d->admin)->postJson($this->anggota($d->kelasA), ['id_siswa' => $baru->pluck('id_pengguna')->all()])
            ->assertCreated()->assertJsonCount(2, 'data')
            ->assertJsonMissingPath('data.0.email')->assertJsonMissingPath('data.0.password');

        $this->assertCount(3, $this->idAnggota($d->kelasA));
    }

    public function test_wali_kelas_menambah_siswa_ke_kelasnya_sendiri(): void
    {
        $d = $this->buatDunia();
        $baru = Pengguna::factory()->create();

        $this->sebagai($d->guruA)->postJson($this->anggota($d->kelasA), ['id_siswa' => [$baru->id_pengguna]])->assertCreated();
        $this->assertContains($baru->id_pengguna, $this->idAnggota($d->kelasA));
    }

    public function test_hanya_admin_atau_wali_yang_boleh_mengelola_anggota(): void
    {
        $d = $this->buatDunia();
        $baru = Pengguna::factory()->create();
        $guruPengajar = Pengguna::factory()->guru()->create();
        $this->buatJadwal($d->mapelA, $d->kelasA, $guruPengajar, $this->besok());

        foreach ([$d->guruB /* wali kelas lain */, $guruPengajar /* bukan wali */, $d->siswa1, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->postJson($this->anggota($d->kelasA), ['id_siswa' => [$baru->id_pengguna]])->assertForbidden();
            $this->sebagai($pelaku)->deleteJson($this->anggota($d->kelasA).'/'.$d->siswa1->id_pengguna)->assertForbidden();
        }

        $this->assertSame([$d->siswa1->id_pengguna], $this->idAnggota($d->kelasA));
    }

    public function test_keanggotaan_ganda_ditolak_409_dan_atomik(): void
    {
        $d = $this->buatDunia();
        $baru = Pengguna::factory()->create();

        // siswa1 sudah anggota: seluruh permintaan dibatalkan, siswa baru juga tidak masuk
        $this->sebagai($d->admin)->postJson($this->anggota($d->kelasA), ['id_siswa' => [$baru->id_pengguna, $d->siswa1->id_pengguna]])
            ->assertStatus(409)->assertJsonPath('code', 'already_member');

        $this->assertSame([$d->siswa1->id_pengguna], $this->idAnggota($d->kelasA));
        $this->assertSame(1, DB::table('siswa_kelas')->where(['id_siswa' => $d->siswa1->id_pengguna, 'id_kelas' => $d->kelasA->id_kelas])->count());
    }

    public function test_menambah_ulang_secara_beruntun_tidak_membuat_duplikat(): void
    {
        $d = $this->buatDunia();
        $baru = Pengguna::factory()->create();

        $this->sebagai($d->admin)->postJson($this->anggota($d->kelasA), ['id_siswa' => [$baru->id_pengguna]])->assertCreated();
        $this->sebagai($d->admin)->postJson($this->anggota($d->kelasA), ['id_siswa' => [$baru->id_pengguna]])->assertStatus(409);

        $this->assertSame(1, DB::table('siswa_kelas')->where(['id_siswa' => $baru->id_pengguna, 'id_kelas' => $d->kelasA->id_kelas])->count());
    }

    public function test_siswa_boleh_mengikuti_lebih_dari_satu_kelas(): void
    {
        // Keputusan: hanya PASANGAN siswa-kelas yang unik (sesuai ERD); aturan "satu kelas aktif" belum diminta.
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson($this->anggota($d->kelasB), ['id_siswa' => [$d->siswa1->id_pengguna]])->assertCreated();
    }

    public function test_validasi_dan_foreign_key_id_siswa(): void
    {
        $d = $this->buatDunia();
        $mati = Pengguna::factory()->nonaktif()->create();

        $kasus = [
            'kosong' => [[], 'id_siswa'],
            'bukan array' => [['id_siswa' => 5], 'id_siswa'],
            'array kosong' => [['id_siswa' => []], 'id_siswa'],
            'id tidak ada (FK)' => [['id_siswa' => [999999]], 'id_siswa.0'],
            'bukan angka' => [['id_siswa' => ['abc']], 'id_siswa.0'],
            'guru bukan siswa' => [['id_siswa' => [$d->guruC->id_pengguna]], 'id_siswa.0'],
            'admin bukan siswa' => [['id_siswa' => [$d->admin->id_pengguna]], 'id_siswa.0'],
            'siswa nonaktif' => [['id_siswa' => [$mati->id_pengguna]], 'id_siswa.0'],
            'id ganda di payload' => [['id_siswa' => [$d->siswa2->id_pengguna, $d->siswa2->id_pengguna]], 'id_siswa.0'],
            'lebih dari 100' => [['id_siswa' => range(1, 101)], 'id_siswa'],
        ];

        foreach ($kasus as $nama => [$payload, $kolom]) {
            $this->sebagai($d->admin)->postJson($this->anggota($d->kelasA), $payload)
                ->assertUnprocessable($nama)->assertJsonValidationErrors($kolom, 'errors');
        }
        $this->assertSame([$d->siswa1->id_pengguna], $this->idAnggota($d->kelasA));
    }

    public function test_kelas_arsip_dan_kelas_tidak_ada(): void
    {
        $d = $this->buatDunia();
        $arsip = Kelas::factory()->diarsipkan()->create(['id_wali' => $d->guruC->id_pengguna]);

        $this->sebagai($d->admin)->postJson($this->anggota($arsip), ['id_siswa' => [$d->siswa2->id_pengguna]])
            ->assertStatus(409)->assertJsonPath('code', 'class_archived');
        $this->sebagai($d->admin)->postJson('/api/v1/kelas/999999/anggota', ['id_siswa' => [$d->siswa2->id_pengguna]])->assertNotFound();
    }

    // ---------------------------------------------------------------- lihat anggota

    public function test_melihat_anggota_oleh_admin_wali_dan_guru_pengajar(): void
    {
        $d = $this->buatDunia();
        $pengajar = Pengguna::factory()->guru()->create();
        $this->buatJadwal($d->mapelA, $d->kelasA, $pengajar, $this->besok());

        foreach ([$d->admin, $d->guruA, $pengajar] as $pelaku) {
            $this->sebagai($pelaku)->getJson($this->anggota($d->kelasA))->assertOk()
                ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id_pengguna', $d->siswa1->id_pengguna)
                ->assertJsonPath('data.0.aktif', true)->assertJsonMissingPath('data.0.email');
        }
    }

    public function test_siswa_dan_guru_tak_terkait_tidak_boleh_melihat_anggota(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->siswa1 /* anggota sendiri */, $d->siswa2, $d->guruB, $d->guruC] as $pelaku) {
            $this->sebagai($pelaku)->getJson($this->anggota($d->kelasA))->assertForbidden();
        }
    }

    public function test_anggota_pencarian_pagination_urutan_dan_status(): void
    {
        $d = $this->buatDunia();
        $kelas = Kelas::factory()->create(['id_wali' => $d->guruC->id_pengguna]);
        foreach (['andi', 'budi', 'citra', 'dedi'] as $nama) {
            $kelas->siswa()->attach(Pengguna::factory()->create(['username' => 'anggota.'.$nama]));
        }
        $mati = Pengguna::factory()->nonaktif()->create(['username' => 'anggota.eko']);
        $kelas->siswa()->attach($mati);

        $this->sebagai($d->admin)->getJson($this->anggota($kelas).'?per_page=2&page=2&urut=username')->assertOk()
            ->assertJsonPath('meta.total', 5)->assertJsonCount(2, 'data')->assertJsonPath('data.0.username', 'anggota.citra');

        $this->sebagai($d->admin)->getJson($this->anggota($kelas).'?cari=BUD')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.username', 'anggota.budi');

        $this->sebagai($d->admin)->getJson($this->anggota($kelas).'?status=nonaktif')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.aktif', false);

        $this->sebagai($d->admin)->getJson($this->anggota($kelas).'?urut=password')->assertUnprocessable();
    }

    // ---------------------------------------------------------------- kelas yang diikuti siswa

    public function test_melihat_kelas_yang_diikuti_siswa(): void
    {
        $d = $this->buatDunia();
        $d->kelasB->siswa()->attach($d->siswa1->id_pengguna); // siswa1 ikut A dan B
        $url = '/api/v1/siswa/'.$d->siswa1->id_pengguna.'/kelas';

        $ids = fn (Pengguna $p) => array_column($this->sebagai($p)->getJson($url)->assertOk()->json('data'), 'id_kelas');

        $this->assertEqualsCanonicalizing([$d->kelasA->id_kelas, $d->kelasB->id_kelas], $ids($d->admin));
        $this->assertEqualsCanonicalizing([$d->kelasA->id_kelas, $d->kelasB->id_kelas], $ids($d->siswa1));
        // guru hanya melihat irisan dengan kelas yang diwalikan/diajarnya
        $this->assertSame([$d->kelasA->id_kelas], $ids($d->guruA));
        $this->assertSame([], $ids($d->guruC));
    }

    public function test_siswa_tidak_boleh_melihat_kelas_siswa_lain_dan_target_harus_siswa(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa2)->getJson('/api/v1/siswa/'.$d->siswa1->id_pengguna.'/kelas')->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/siswa/'.$d->guruA->id_pengguna.'/kelas')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/siswa/999999/kelas')->assertNotFound();
        $this->getJson('/api/v1/siswa/'.$d->siswa1->id_pengguna.'/kelas')->assertUnauthorized();
    }

    // ---------------------------------------------------------------- keluarkan

    public function test_admin_mengeluarkan_siswa_tanpa_menghapus_presensi_dan_nilai(): void
    {
        $d = $this->buatDunia();
        $presensi = DB::table('presensi')->where('id_siswa', $d->siswa1->id_pengguna)->count();
        $nilai = DB::table('nilai')->where('id_siswa', $d->siswa1->id_pengguna)->count();
        $this->assertGreaterThan(0, $presensi);

        $this->sebagai($d->admin)->deleteJson($this->anggota($d->kelasA).'/'.$d->siswa1->id_pengguna)->assertNoContent();

        $this->assertSame([], $this->idAnggota($d->kelasA));
        $this->assertSame($presensi, DB::table('presensi')->where('id_siswa', $d->siswa1->id_pengguna)->count());
        $this->assertSame($nilai, DB::table('nilai')->where('id_siswa', $d->siswa1->id_pengguna)->count());
        $this->assertNull($d->siswa1->fresh()->nonaktif_pada); // akun tetap utuh
    }

    public function test_wali_boleh_mengeluarkan_siswa_tanpa_presensi_tetapi_tidak_yang_sudah_berpresensi(): void
    {
        $d = $this->buatDunia();
        $bersih = Pengguna::factory()->create();
        $d->kelasA->siswa()->attach($bersih->id_pengguna);

        $this->sebagai($d->guruA)->deleteJson($this->anggota($d->kelasA).'/'.$bersih->id_pengguna)->assertNoContent();

        // siswa1 sudah punya presensi pada jadwal kelas A -> hanya admin
        $this->sebagai($d->guruA)->deleteJson($this->anggota($d->kelasA).'/'.$d->siswa1->id_pengguna)
            ->assertStatus(409)->assertJsonPath('code', 'student_has_attendance');
        $this->assertContains($d->siswa1->id_pengguna, $this->idAnggota($d->kelasA));
    }

    public function test_keluarkan_bukan_anggota_404_dan_kelas_arsip_409(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->deleteJson($this->anggota($d->kelasA).'/'.$d->siswa2->id_pengguna)->assertNotFound();
        $this->sebagai($d->admin)->deleteJson($this->anggota($d->kelasA).'/999999')->assertNotFound();
        $this->sebagai($d->admin)->deleteJson($this->anggota($d->kelasA).'/abc')->assertNotFound();

        $arsip = Kelas::factory()->diarsipkan()->create(['id_wali' => $d->guruC->id_pengguna]);
        $arsip->siswa()->attach($d->siswa2->id_pengguna);
        $this->sebagai($d->admin)->deleteJson($this->anggota($arsip).'/'.$d->siswa2->id_pengguna)
            ->assertStatus(409)->assertJsonPath('code', 'class_archived');
    }

    public function test_pk_komposit_database_menolak_duplikat_walau_lewat_jalur_lain(): void
    {
        $d = $this->buatDunia();

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);
        DB::table('siswa_kelas')->insert(['id_siswa' => $d->siswa1->id_pengguna, 'id_kelas' => $d->kelasA->id_kelas, 'created_at' => now(), 'updated_at' => now()]);
    }
}
