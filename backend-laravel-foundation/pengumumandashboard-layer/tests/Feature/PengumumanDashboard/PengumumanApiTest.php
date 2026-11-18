<?php

namespace Tests\Feature\PengumumanDashboard;

use App\Models\MataPelajaran;
use App\Models\Pengumuman;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class PengumumanApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    /** @return list<int> */
    private function ids($respons): array
    {
        return collect($respons->json('data'))->pluck('id_pengumuman')->sort()->values()->all();
    }

    // ------------------------------------------------------------- autentikasi

    public function test_tanpa_login_401(): void
    {
        foreach ([['GET', '/api/v1/pengumuman'], ['POST', '/api/v1/pengumuman'], ['GET', '/api/v1/pengumuman/1'],
            ['PATCH', '/api/v1/pengumuman/1'], ['DELETE', '/api/v1/pengumuman/1'], ['GET', '/api/v1/mapel/1/pengumuman'], ['GET', '/api/v1/dashboard']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    // ------------------------------------------------------------- membaca & akses

    public function test_daftar_hanya_berisi_pengumuman_yang_boleh_dibaca(): void
    {
        $d = $this->buatDunia();
        $g = $d->pengumumanGlobal->id_pengumuman;
        $a = $d->pengumumanA->id_pengumuman;
        $b = $d->pengumumanB->id_pengumuman;

        $this->assertSame([$g, $a], $this->ids($this->sebagai($d->siswa1)->getJson('/api/v1/pengumuman')->assertOk()));
        $this->assertSame([$g, $b], $this->ids($this->sebagai($d->siswa2)->getJson('/api/v1/pengumuman')->assertOk()));
        $this->assertSame([$g, $a], $this->ids($this->sebagai($d->guruA)->getJson('/api/v1/pengumuman')->assertOk()));
        $this->assertSame([$g], $this->ids($this->sebagai($d->guruC)->getJson('/api/v1/pengumuman')->assertOk()));
        $this->assertSame([$g, $a, $b], $this->ids($this->sebagai($d->admin)->getJson('/api/v1/pengumuman')->assertOk()));
    }

    public function test_filter_cakupan_mapel_dan_pencarian(): void
    {
        $d = $this->buatDunia();
        $d->pengumumanA->forceFill(['judul' => 'Ujian Tengah Semester'])->save();

        $this->assertSame([$d->pengumumanGlobal->id_pengumuman], $this->ids($this->sebagai($d->admin)->getJson('/api/v1/pengumuman?cakupan=global')->assertOk()));
        $this->assertCount(2, $this->sebagai($d->admin)->getJson('/api/v1/pengumuman?cakupan=mapel')->assertOk()->json('data'));
        $this->assertSame([$d->pengumumanB->id_pengumuman], $this->ids($this->sebagai($d->admin)->getJson('/api/v1/pengumuman?id_mapel='.$d->mapelB->id_mapel)->assertOk()));
        $this->assertSame([$d->pengumumanA->id_pengumuman], $this->ids($this->sebagai($d->admin)->getJson('/api/v1/pengumuman?cari=tengah%20semester')->assertOk()));
        // filter tidak dapat dipakai untuk melihat di luar hak akses
        $this->assertSame([], $this->ids($this->sebagai($d->siswa1)->getJson('/api/v1/pengumuman?id_mapel='.$d->mapelB->id_mapel)->assertOk()));
    }

    public function test_pagination_dan_urutan_terbaru_dulu(): void
    {
        $d = $this->buatDunia();
        Pengumuman::factory()->count(4)->create(['id_penulis' => $d->admin->id_pengguna]);

        $r = $this->sebagai($d->admin)->getJson('/api/v1/pengumuman?per_page=2&page=2')->assertOk();
        $this->assertCount(2, $r->json('data'));
        $this->assertSame(7, $r->json('meta.total'));

        // urutan bawaan: created_at menurun (id hanya pemutus seri)
        Pengumuman::query()->whereKey($d->pengumumanA->id_pengumuman)->update(['created_at' => now()->addHour()]);
        $semua = $this->sebagai($d->admin)->getJson('/api/v1/pengumuman?per_page=100')->assertOk()->json('data');
        $this->assertSame($d->pengumumanA->id_pengumuman, $semua[0]['id_pengumuman']);
        $waktu = array_map(fn ($r) => strtotime($r['created_at']), $semua);
        $urut = $waktu;
        rsort($urut);
        $this->assertSame($urut, $waktu);
    }

    public function test_parameter_daftar_tidak_valid_422(): void
    {
        $d = $this->buatDunia();

        foreach (['cakupan=lain', 'id_mapel=abc', 'urut=isi;drop', 'arah=naik', 'per_page=0'] as $q) {
            $this->sebagai($d->admin)->getJson('/api/v1/pengumuman?'.$q)->assertUnprocessable();
        }
    }

    public function test_detail_sesuai_hak_akses(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa2)->getJson('/api/v1/pengumuman/'.$d->pengumumanGlobal->id_pengumuman)->assertOk()->assertJsonPath('data.cakupan', 'global')->assertJsonPath('data.id_mapel', null);
        $this->sebagai($d->siswa1)->getJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertOk()->assertJsonPath('data.mapel.id_mapel', $d->mapelA->id_mapel);
        $this->sebagai($d->siswa2)->getJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertForbidden();
        $this->sebagai($d->guruC)->getJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/pengumuman/'.$d->pengumumanB->id_pengumuman)->assertOk();
        $this->sebagai($d->admin)->getJson('/api/v1/pengumuman/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/pengumuman/abc')->assertNotFound();
    }

    public function test_daftar_per_mapel(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/mapel/'.$d->mapelA->id_mapel.'/pengumuman';

        $this->assertSame([$d->pengumumanA->id_pengumuman], $this->ids($this->sebagai($d->siswa1)->getJson($url)->assertOk()));
        $this->assertSame([$d->pengumumanA->id_pengumuman], $this->ids($this->sebagai($d->guruA)->getJson($url)->assertOk()));
        $this->sebagai($d->siswa2)->getJson($url)->assertForbidden();
        $this->sebagai($d->guruB)->getJson($url)->assertForbidden();
    }

    // ------------------------------------------------------------- membuat

    public function test_admin_membuat_pengumuman_global(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson('/api/v1/pengumuman', ['judul' => 'Libur Nasional', 'isi' => 'Sekolah libur.', 'cakupan' => 'global'])
            ->assertCreated()
            ->assertJsonPath('data.cakupan', 'global')
            ->assertJsonPath('data.id_mapel', null)
            ->assertJsonPath('data.id_penulis', $d->admin->id_pengguna);

        $this->assertDatabaseHas('pengumuman', ['judul' => 'Libur Nasional', 'cakupan' => 'global', 'id_mapel' => null, 'id_penulis' => $d->admin->id_pengguna]);
    }

    public function test_guru_dan_siswa_tidak_boleh_membuat_global(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruA, $d->siswa1] as $pelaku) {
            $this->sebagai($pelaku)->postJson('/api/v1/pengumuman', ['judul' => 'X', 'isi' => 'Y', 'cakupan' => 'global'])->assertForbidden();
        }
        $this->assertDatabaseMissing('pengumuman', ['judul' => 'X']);
    }

    public function test_guru_pengampu_membuat_pengumuman_mapel(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumuman', ['judul' => 'Kuis Besok', 'isi' => 'Bawa alat tulis.', 'cakupan' => 'mapel', 'id_mapel' => $d->mapelA->id_mapel])
            ->assertCreated()
            ->assertJsonPath('data.cakupan', 'mapel')
            ->assertJsonPath('data.id_mapel', $d->mapelA->id_mapel)
            ->assertJsonPath('data.id_penulis', $d->guruA->id_pengguna);

        // admin boleh untuk mapel mana pun
        $this->sebagai($d->admin)->postJson('/api/v1/pengumuman', ['judul' => 'Dari Admin', 'isi' => 'Z', 'cakupan' => 'mapel', 'id_mapel' => $d->mapelB->id_mapel])->assertCreated();
    }

    public function test_pembuatan_mapel_ditolak_untuk_yang_tidak_berwenang(): void
    {
        $d = $this->buatDunia();
        $isi = ['judul' => 'X', 'isi' => 'Y', 'cakupan' => 'mapel'];

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumuman', $isi + ['id_mapel' => $d->mapelB->id_mapel])->assertForbidden();
        $this->sebagai($d->guruC)->postJson('/api/v1/pengumuman', $isi + ['id_mapel' => $d->mapelA->id_mapel])->assertForbidden();
        $this->sebagai($d->siswa1)->postJson('/api/v1/pengumuman', $isi + ['id_mapel' => $d->mapelA->id_mapel])->assertForbidden();
        $this->sebagai($d->siswa1)->postJson('/api/v1/pengumuman', [])->assertForbidden();
        $this->assertDatabaseMissing('pengumuman', ['judul' => 'X']);
    }

    public function test_konsistensi_cakupan_dan_id_mapel_di_api(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/pengumuman';

        $this->sebagai($d->admin)->postJson($url, ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'global', 'id_mapel' => $d->mapelA->id_mapel])
            ->assertUnprocessable()->assertJsonValidationErrors(['id_mapel']);
        $this->sebagai($d->admin)->postJson($url, ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'mapel'])
            ->assertUnprocessable()->assertJsonValidationErrors(['id_mapel']);
        $this->sebagai($d->admin)->postJson($url, ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'mapel', 'id_mapel' => 999999])
            ->assertUnprocessable()->assertJsonValidationErrors(['id_mapel']);
        $this->sebagai($d->admin)->postJson($url, ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'mapel', 'id_mapel' => 'abc'])
            ->assertUnprocessable()->assertJsonValidationErrors(['id_mapel']);
        $this->sebagai($d->admin)->postJson($url, ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'lain'])
            ->assertUnprocessable()->assertJsonValidationErrors(['cakupan']);
        // guru dengan mapel yang tidak ada: 422 (bukan 403) dan tidak membocorkan apa pun
        $this->sebagai($d->guruA)->postJson($url, ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'mapel', 'id_mapel' => 999999])->assertUnprocessable();
        $this->assertSame(3, Pengumuman::query()->count());
    }

    public function test_validasi_isian_dan_penulis_tidak_dari_klien(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/pengumuman';

        $this->sebagai($d->admin)->postJson($url, [])->assertUnprocessable()->assertJsonValidationErrors(['judul', 'isi', 'cakupan']);
        $this->sebagai($d->admin)->postJson($url, ['judul' => str_repeat('a', 256), 'isi' => 'I', 'cakupan' => 'global'])->assertUnprocessable()->assertJsonValidationErrors(['judul']);
        $this->sebagai($d->admin)->postJson($url, ['judul' => 'J', 'isi' => str_repeat('a', 10001), 'cakupan' => 'global'])->assertUnprocessable()->assertJsonValidationErrors(['isi']);
        $this->sebagai($d->admin)->postJson($url, ['judul' => ['x'], 'isi' => 'I', 'cakupan' => 'global'])->assertUnprocessable();
        $this->sebagai($d->admin)->postJson($url, ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'global', 'id_penulis' => $d->guruA->id_pengguna])
            ->assertUnprocessable()->assertJsonValidationErrors(['id_penulis']);
    }

    public function test_mapel_diarsipkan_menolak_pengumuman_baru_dan_perubahan(): void
    {
        $d = $this->buatDunia();
        $d->mapelA->forceFill(['diarsipkan_pada' => now()])->save();

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumuman', ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'mapel', 'id_mapel' => $d->mapelA->id_mapel])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
        $this->sebagai($d->admin)->patchJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman, ['judul' => 'Baru'])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
        // menghapus tetap diperbolehkan
        $this->sebagai($d->guruA)->deleteJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertNoContent();
    }

    // ------------------------------------------------------------- mengubah

    public function test_mengubah_judul_dan_isi(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->patchJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman, ['judul' => 'Judul Baru'])
            ->assertOk()->assertJsonPath('data.judul', 'Judul Baru');
        $this->sebagai($d->admin)->patchJson('/api/v1/pengumuman/'.$d->pengumumanGlobal->id_pengumuman, ['isi' => 'Isi baru'])
            ->assertOk()->assertJsonPath('data.isi', 'Isi baru');
        $this->assertDatabaseHas('pengumuman', ['id_pengumuman' => $d->pengumumanA->id_pengumuman, 'judul' => 'Judul Baru']);
    }

    public function test_cakupan_mapel_dan_penulis_tidak_dapat_diubah(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman;

        foreach (['cakupan' => 'global', 'id_mapel' => $d->mapelB->id_mapel, 'id_penulis' => $d->admin->id_pengguna] as $kolom => $isi) {
            $this->sebagai($d->admin)->patchJson($url, [$kolom => $isi])->assertUnprocessable();
        }
        $this->sebagai($d->admin)->patchJson($url, [])->assertUnprocessable();
        $p = $d->pengumumanA->fresh();
        $this->assertSame('mapel', $p->cakupan->value);
        $this->assertSame($d->mapelA->id_mapel, $p->id_mapel);
        $this->assertSame($d->guruA->id_pengguna, $p->id_penulis);
    }

    public function test_perubahan_ditolak_untuk_yang_tidak_berwenang(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruB)->patchJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman, ['judul' => 'Hack'])->assertForbidden();
        $this->sebagai($d->guruA)->patchJson('/api/v1/pengumuman/'.$d->pengumumanGlobal->id_pengumuman, ['judul' => 'Hack'])->assertForbidden();
        $this->sebagai($d->siswa1)->patchJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman, ['judul' => 'Hack'])->assertForbidden();
        $this->sebagai($d->admin)->patchJson('/api/v1/pengumuman/999999', ['judul' => 'x'])->assertNotFound();
        $this->assertDatabaseMissing('pengumuman', ['judul' => 'Hack']);
    }

    public function test_guru_yang_tidak_lagi_mengampu_tidak_dapat_mengubah(): void
    {
        $d = $this->buatDunia();
        $d->mapelA->forceFill(['id_guru' => $d->guruC->id_pengguna])->save();

        $this->sebagai($d->guruA)->patchJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman, ['judul' => 'Hack'])->assertForbidden();
        $this->sebagai($d->guruA)->getJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertForbidden();
    }

    // ------------------------------------------------------------- menghapus

    public function test_menghapus_pengumuman(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruB)->deleteJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertForbidden();
        $this->sebagai($d->siswa1)->deleteJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertForbidden();
        $this->sebagai($d->guruA)->deleteJson('/api/v1/pengumuman/'.$d->pengumumanGlobal->id_pengumuman)->assertForbidden();

        $this->sebagai($d->guruA)->deleteJson('/api/v1/pengumuman/'.$d->pengumumanA->id_pengumuman)->assertNoContent();
        $this->sebagai($d->admin)->deleteJson('/api/v1/pengumuman/'.$d->pengumumanGlobal->id_pengumuman)->assertNoContent();
        $this->assertDatabaseMissing('pengumuman', ['id_pengumuman' => $d->pengumumanA->id_pengumuman]);
        $this->assertDatabaseMissing('pengumuman', ['id_pengumuman' => $d->pengumumanGlobal->id_pengumuman]);
        $this->assertDatabaseHas('pengumuman', ['id_pengumuman' => $d->pengumumanB->id_pengumuman]);
        $this->sebagai($d->admin)->deleteJson('/api/v1/pengumuman/999999')->assertNotFound();
    }

    // ------------------------------------------------------------- constraint database

    public function test_db_menolak_global_dengan_mapel(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $this->rawInsert(['cakupan' => 'global', 'id_mapel' => $d->mapelA->id_mapel, 'id_penulis' => $d->admin->id_pengguna]);
    }

    public function test_db_menolak_mapel_tanpa_id_mapel(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $this->rawInsert(['cakupan' => 'mapel', 'id_mapel' => null, 'id_penulis' => $d->admin->id_pengguna]);
    }

    /** @param array<string, mixed> $kolom */
    private function rawInsert(array $kolom): void
    {
        DB::table('pengumuman')->insert($kolom + ['judul' => 'J', 'isi' => 'I', 'created_at' => now(), 'updated_at' => now()]);
        $this->assertInstanceOf(MataPelajaran::class, MataPelajaran::query()->first());
    }
}
