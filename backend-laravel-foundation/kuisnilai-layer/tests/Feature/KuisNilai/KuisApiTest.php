<?php

namespace Tests\Feature\KuisNilai;

use App\Models\Kuis;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class KuisApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdAbCdEfGhIjKlMn/viewform';

    // ----------------------------------------------------------------- autentikasi

    public function test_tanpa_login_401(): void
    {
        foreach ([['GET', '/api/v1/kuis'], ['GET', '/api/v1/kuis/1'], ['POST', '/api/v1/mapel/1/kuis'],
            ['PATCH', '/api/v1/kuis/1'], ['DELETE', '/api/v1/kuis/1'], ['GET', '/api/v1/mapel/1/kuis']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    // ----------------------------------------------------------------- membaca

    public function test_daftar_dibatasi_per_peran(): void
    {
        $d = $this->buatDunia();

        $ids = fn ($r) => collect($r->json('data'))->pluck('id_kuis')->all();

        $this->assertSame([$d->kuisA->id_kuis], $ids($this->sebagai($d->siswa1)->getJson('/api/v1/kuis')->assertOk()));
        $this->assertSame([$d->kuisB->id_kuis], $ids($this->sebagai($d->guruB)->getJson('/api/v1/kuis')->assertOk()));
        $this->assertSame([], $ids($this->sebagai($d->guruC)->getJson('/api/v1/kuis')->assertOk()));
        $this->assertEqualsCanonicalizing([$d->kuisA->id_kuis, $d->kuisB->id_kuis], $ids($this->sebagai($d->admin)->getJson('/api/v1/kuis')->assertOk()));
    }

    public function test_detail_sesuai_hak(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa1)->getJson('/api/v1/kuis/'.$d->kuisA->id_kuis)->assertOk()
            ->assertJsonPath('data.tautan_google_form', $d->kuisA->tautan_google_form);
        $this->sebagai($d->admin)->getJson('/api/v1/kuis/'.$d->kuisA->id_kuis)->assertOk();
        $this->sebagai($d->guruA)->getJson('/api/v1/kuis/'.$d->kuisA->id_kuis)->assertOk();
        $this->sebagai($d->siswa2)->getJson('/api/v1/kuis/'.$d->kuisA->id_kuis)->assertForbidden();
        $this->sebagai($d->guruC)->getJson('/api/v1/kuis/'.$d->kuisA->id_kuis)->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/kuis/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/kuis/abc')->assertNotFound();
    }

    public function test_daftar_per_mapel_dan_filter(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa1)->getJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/kuis')->assertOk()->assertJsonCount(1, 'data');
        $this->sebagai($d->siswa1)->getJson('/api/v1/mapel/'.$d->mapelB->id_mapel.'/kuis')->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/kuis?id_mapel='.$d->mapelB->id_mapel)->assertOk()->assertJsonCount(1, 'data');
        $this->sebagai($d->admin)->getJson('/api/v1/kuis?urut=judul;drop')->assertUnprocessable();
        $this->sebagai($d->admin)->getJson('/api/v1/kuis?id_mapel=abc')->assertUnprocessable();
    }

    // ----------------------------------------------------------------- membuat

    public function test_guru_pengampu_membuat_kuis(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->postJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/kuis', ['judul' => 'Kuis Bab 1', 'tautan_google_form' => self::FORM])
            ->assertCreated()
            ->assertJsonPath('data.judul', 'Kuis Bab 1')
            ->assertJsonPath('data.id_mapel', $d->mapelA->id_mapel);

        $this->assertDatabaseHas('kuis', ['judul' => 'Kuis Bab 1', 'tautan_google_form' => self::FORM, 'id_mapel' => $d->mapelA->id_mapel]);
    }

    public function test_hanya_guru_pengampu_boleh_membuat(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/mapel/'.$d->mapelA->id_mapel.'/kuis';
        $isi = ['judul' => 'X', 'tautan_google_form' => self::FORM];

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->postJson($url, $isi)->assertForbidden();
        }
        $this->assertDatabaseMissing('kuis', ['judul' => 'X']);
    }

    public function test_403_mendahului_422(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa1)->postJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/kuis', [])->assertForbidden();
    }

    public function test_validasi_input_pembuatan(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/mapel/'.$d->mapelA->id_mapel.'/kuis';

        $this->sebagai($d->guruA)->postJson($url, [])->assertUnprocessable()->assertJsonValidationErrors(['judul', 'tautan_google_form']);
        $this->sebagai($d->guruA)->postJson($url, ['judul' => 'K', 'tautan_google_form' => 'https://evil.test/forms'])
            ->assertUnprocessable()->assertJsonValidationErrors(['tautan_google_form']);
        $this->sebagai($d->guruA)->postJson($url, ['judul' => 'K', 'tautan_google_form' => 'https://docs.google.com/forms/d/1AbCdEfGhIjKlMnOp/edit'])
            ->assertUnprocessable();
        $this->sebagai($d->guruA)->postJson($url, ['judul' => str_repeat('a', 256), 'tautan_google_form' => self::FORM])
            ->assertUnprocessable()->assertJsonValidationErrors(['judul']);
        $this->sebagai($d->guruA)->postJson($url, ['judul' => ['x'], 'tautan_google_form' => self::FORM])->assertUnprocessable();
    }

    public function test_mapel_diarsipkan_menolak_kuis_baru(): void
    {
        $d = $this->buatDunia();
        $d->mapelA->forceFill(['diarsipkan_pada' => now()])->save();

        $this->sebagai($d->guruA)->postJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/kuis', ['judul' => 'K', 'tautan_google_form' => self::FORM])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
        $this->sebagai($d->guruA)->patchJson('/api/v1/kuis/'.$d->kuisA->id_kuis, ['judul' => 'Baru'])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
    }

    // ----------------------------------------------------------------- mengubah & menghapus

    public function test_mengubah_kuis(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/kuis/'.$d->kuisA->id_kuis;

        $this->sebagai($d->guruA)->patchJson($url, ['judul' => 'Judul Baru'])->assertOk()->assertJsonPath('data.judul', 'Judul Baru');
        $this->sebagai($d->guruA)->patchJson($url, ['tautan_google_form' => 'https://forms.gle/AbCdEf123456'])->assertOk();
        $this->assertDatabaseHas('kuis', ['id_kuis' => $d->kuisA->id_kuis, 'judul' => 'Judul Baru', 'tautan_google_form' => 'https://forms.gle/AbCdEf123456']);
    }

    public function test_perubahan_ditolak_untuk_non_pengampu_dan_input_buruk(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/kuis/'.$d->kuisA->id_kuis;

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->patchJson($url, ['judul' => 'Hack'])->assertForbidden();
        }
        $this->sebagai($d->guruA)->patchJson($url, [])->assertUnprocessable();
        $this->sebagai($d->guruA)->patchJson($url, ['id_mapel' => $d->mapelB->id_mapel])->assertUnprocessable();
        $this->sebagai($d->guruA)->patchJson($url, ['tautan_google_form' => 'http://forms.gle/AbCdEf123456'])->assertUnprocessable();
        $this->assertDatabaseMissing('kuis', ['judul' => 'Hack']);
        $this->assertSame($d->mapelA->id_mapel, $d->kuisA->fresh()->id_mapel);
    }

    public function test_menghapus_kuis_tanpa_nilai(): void
    {
        $d = $this->buatDunia();
        $kuis = Kuis::factory()->create(['id_mapel' => $d->mapelA->id_mapel]);

        $this->sebagai($d->guruB)->deleteJson('/api/v1/kuis/'.$kuis->id_kuis)->assertForbidden();
        $this->sebagai($d->admin)->deleteJson('/api/v1/kuis/'.$kuis->id_kuis)->assertForbidden();
        $this->sebagai($d->guruA)->deleteJson('/api/v1/kuis/'.$kuis->id_kuis)->assertNoContent();
        $this->assertDatabaseMissing('kuis', ['id_kuis' => $kuis->id_kuis]);
    }

    public function test_kuis_yang_sudah_bernilai_tidak_dapat_dihapus(): void
    {
        $d = $this->buatDunia(); // kuisA sudah punya nilaiKuisA

        $this->sebagai($d->guruA)->deleteJson('/api/v1/kuis/'.$d->kuisA->id_kuis)
            ->assertStatus(409)->assertJsonPath('code', 'quiz_has_grades');
        $this->assertDatabaseHas('kuis', ['id_kuis' => $d->kuisA->id_kuis]);
        $this->assertDatabaseHas('nilai', ['id_nilai' => $d->nilaiKuisA->id_nilai]);
    }

    public function test_jumlah_nilai_dilaporkan(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->getJson('/api/v1/kuis/'.$d->kuisA->id_kuis)->assertOk()->assertJsonPath('data.jumlah_nilai', 1);
        $this->assertSame(1, Nilai::query()->where('id_kuis', $d->kuisA->id_kuis)->count());
        $this->assertInstanceOf(MataPelajaran::class, $d->mapelA);
    }
}
