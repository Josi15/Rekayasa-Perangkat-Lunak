<?php

namespace Tests\Feature\KuisNilai;

use App\Enums\StatusPengumpulan;
use App\Models\Kuis;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Tugas;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class NilaiApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    /** Pengumpulan siswa1 pada tugas baru di mapel A yang BELUM dinilai. */
    private function pengumpulanBaru(object $d): PengumpulanTugas
    {
        $tugas = Tugas::factory()->create(['id_mapel' => $d->mapelA->id_mapel]);

        return PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $tugas->id_tugas]);
    }

    private function kuisBaru(object $d): Kuis
    {
        return Kuis::factory()->create(['id_mapel' => $d->mapelA->id_mapel]);
    }

    // ----------------------------------------------------------------- autentikasi

    public function test_tanpa_login_401(): void
    {
        foreach ([['GET', '/api/v1/nilai'], ['GET', '/api/v1/nilai/saya'], ['GET', '/api/v1/nilai/1'], ['PATCH', '/api/v1/nilai/1'],
            ['POST', '/api/v1/pengumpulan/1/nilai'], ['POST', '/api/v1/kuis/1/nilai'], ['GET', '/api/v1/mapel/1/nilai'], ['GET', '/api/v1/siswa/1/nilai']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    // ----------------------------------------------------------------- nilai tugas

    public function test_guru_memberi_nilai_pengumpulan_tugas(): void
    {
        $d = $this->buatDunia();
        $p = $this->pengumpulanBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/'.$p->id_pengumpulan.'/nilai', ['nilai' => 87.5, 'umpan_balik' => 'Bagus, perbaiki kesimpulan.'])
            ->assertCreated()
            ->assertJsonPath('data.sumber', 'tugas')
            ->assertJsonPath('data.id_siswa', $d->siswa1->id_pengguna)
            ->assertJsonPath('data.id_pengumpulan', $p->id_pengumpulan)
            ->assertJsonPath('data.id_kuis', null)
            ->assertJsonPath('data.nilai', 87.5)
            ->assertJsonPath('data.umpan_balik', 'Bagus, perbaiki kesimpulan.');

        $this->assertDatabaseHas('nilai', ['id_pengumpulan' => $p->id_pengumpulan, 'id_siswa' => $d->siswa1->id_pengguna, 'id_kuis' => null, 'nilai' => '87.50']);
        $this->assertSame(StatusPengumpulan::Dinilai, $p->fresh()->status);
    }

    public function test_siswa_diturunkan_dari_pengumpulan_bukan_dari_klien(): void
    {
        $d = $this->buatDunia();
        $p = $this->pengumpulanBaru($d);
        $url = '/api/v1/pengumpulan/'.$p->id_pengumpulan.'/nilai';

        foreach (['id_siswa' => $d->siswa2->id_pengguna, 'id_pengumpulan' => 1, 'id_kuis' => $d->kuisA->id_kuis] as $kolom => $nilai) {
            $this->sebagai($d->guruA)->postJson($url, ['nilai' => 80, $kolom => $nilai])->assertUnprocessable()->assertJsonValidationErrors([$kolom]);
        }
        $this->assertDatabaseMissing('nilai', ['id_pengumpulan' => $p->id_pengumpulan]);
        $this->assertSame(StatusPengumpulan::Dikumpulkan, $p->fresh()->status);
    }

    public function test_nilai_tugas_ganda_ditolak_409(): void
    {
        $d = $this->buatDunia();
        $p = $this->pengumpulanBaru($d);
        $url = '/api/v1/pengumpulan/'.$p->id_pengumpulan.'/nilai';

        $this->sebagai($d->guruA)->postJson($url, ['nilai' => 70])->assertCreated();
        $this->sebagai($d->guruA)->postJson($url, ['nilai' => 90])->assertStatus(409)->assertJsonPath('code', 'grade_exists');
        $this->assertSame(1, Nilai::query()->where('id_pengumpulan', $p->id_pengumpulan)->count());
        $this->assertDatabaseHas('nilai', ['id_pengumpulan' => $p->id_pengumpulan, 'nilai' => '70.00']);
    }

    public function test_hanya_guru_pengampu_boleh_menilai_tugas(): void
    {
        $d = $this->buatDunia();
        $p = $this->pengumpulanBaru($d);
        $url = '/api/v1/pengumpulan/'.$p->id_pengumpulan.'/nilai';

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->siswa2, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->postJson($url, ['nilai' => 100])->assertForbidden();
        }
        $this->assertDatabaseMissing('nilai', ['id_pengumpulan' => $p->id_pengumpulan]);
        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/999999/nilai', ['nilai' => 1])->assertNotFound();
        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/abc/nilai', ['nilai' => 1])->assertNotFound();
    }

    public function test_siswa_tidak_dapat_merevisi_setelah_dinilai(): void
    {
        $d = $this->buatDunia();
        $p = $this->pengumpulanBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/'.$p->id_pengumpulan.'/nilai', ['nilai' => 60])->assertCreated();
        Storage::fake((string) config('tugas.disk'));
        $this->sebagai($d->siswa1)->post('/api/v1/tugas/'.$p->id_tugas.'/pengumpulan/revisi', ['file' => UploadedFile::fake()->create('revisi.pdf', 50, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertStatus(409)->assertJsonPath('code', 'already_graded');
    }

    // ----------------------------------------------------------------- rentang nilai

    /** @return array<string, array{0: mixed}> */
    public static function nilaiBuruk(): array
    {
        return [
            'negatif' => [-1], 'di atas 100' => [100.01], '101' => [101], 'teks' => ['abc'], 'boolean' => [true], 'array' => [[80]],
            'tiga desimal' => ['85.555'], 'notasi ilmiah' => ['1e1'], 'null' => [null], 'kosong' => [''],
        ];
    }

    #[DataProvider('nilaiBuruk')]
    public function test_rentang_dan_format_nilai_ditolak(mixed $buruk): void
    {
        $d = $this->buatDunia();
        $p = $this->pengumpulanBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/'.$p->id_pengumpulan.'/nilai', ['nilai' => $buruk])
            ->assertUnprocessable()->assertJsonValidationErrors(['nilai']);
        $this->assertDatabaseMissing('nilai', ['id_pengumpulan' => $p->id_pengumpulan]);
    }

    public function test_nilai_wajib(): void
    {
        $d = $this->buatDunia();
        $p = $this->pengumpulanBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/'.$p->id_pengumpulan.'/nilai', [])->assertUnprocessable()->assertJsonValidationErrors(['nilai']);
    }

    public function test_batas_nilai_0_dan_100_diterima(): void
    {
        $d = $this->buatDunia();
        $a = $this->pengumpulanBaru($d);
        $b = $this->pengumpulanBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/'.$a->id_pengumpulan.'/nilai', ['nilai' => 0])->assertCreated();
        $this->assertEquals(0, $a->nilai()->first()->nilai);
        $this->sebagai($d->guruA)->postJson('/api/v1/pengumpulan/'.$b->id_pengumpulan.'/nilai', ['nilai' => '100'])->assertCreated();
        $this->assertEquals(100, $b->nilai()->first()->nilai);
    }

    // ----------------------------------------------------------------- nilai kuis

    public function test_guru_mencatat_nilai_kuis(): void
    {
        $d = $this->buatDunia();
        $kuis = $this->kuisBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/kuis/'.$kuis->id_kuis.'/nilai', ['id_siswa' => $d->siswa1->id_pengguna, 'nilai' => 92, 'umpan_balik' => 'Mantap'])
            ->assertCreated()
            ->assertJsonPath('data.sumber', 'kuis')
            ->assertJsonPath('data.id_kuis', $kuis->id_kuis)
            ->assertJsonPath('data.id_pengumpulan', null)
            ->assertJsonPath('data.nilai', 92.0);

        $this->assertDatabaseHas('nilai', ['id_kuis' => $kuis->id_kuis, 'id_siswa' => $d->siswa1->id_pengguna, 'id_pengumpulan' => null]);
    }

    public function test_nilai_kuis_ganda_ditolak_409(): void
    {
        $d = $this->buatDunia();
        $kuis = $this->kuisBaru($d);
        $url = '/api/v1/kuis/'.$kuis->id_kuis.'/nilai';

        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $d->siswa1->id_pengguna, 'nilai' => 50])->assertCreated();
        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $d->siswa1->id_pengguna, 'nilai' => 60])->assertStatus(409)->assertJsonPath('code', 'grade_exists');
        $this->assertSame(1, Nilai::query()->where('id_kuis', $kuis->id_kuis)->count());
    }

    public function test_siswa_harus_mengikuti_mapel_kuis(): void
    {
        $d = $this->buatDunia();
        $kuis = $this->kuisBaru($d);

        // siswa2 hanya di kelas B (mapel B)
        $this->sebagai($d->guruA)->postJson('/api/v1/kuis/'.$kuis->id_kuis.'/nilai', ['id_siswa' => $d->siswa2->id_pengguna, 'nilai' => 80])
            ->assertUnprocessable()->assertJsonValidationErrors(['id_siswa']);
        $this->assertDatabaseMissing('nilai', ['id_kuis' => $kuis->id_kuis]);
    }

    public function test_id_siswa_harus_siswa_aktif_yang_ada(): void
    {
        $d = $this->buatDunia();
        $kuis = $this->kuisBaru($d);
        $url = '/api/v1/kuis/'.$kuis->id_kuis.'/nilai';

        $nonaktif = Pengguna::factory()->create();
        $d->kelasA->siswa()->attach($nonaktif->id_pengguna);
        $nonaktif->forceFill(['nonaktif_pada' => now()])->save();

        foreach ([$nonaktif->id_pengguna, $d->guruA->id_pengguna, 999999, 'abc', null, 0] as $buruk) {
            $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $buruk, 'nilai' => 80])->assertUnprocessable()->assertJsonValidationErrors(['id_siswa']);
        }
        $this->sebagai($d->guruA)->postJson($url, ['nilai' => 80])->assertUnprocessable()->assertJsonValidationErrors(['id_siswa']);
        $this->assertDatabaseMissing('nilai', ['id_kuis' => $kuis->id_kuis]);
    }

    public function test_hanya_guru_pengampu_mencatat_nilai_kuis(): void
    {
        $d = $this->buatDunia();
        $kuis = $this->kuisBaru($d);
        $url = '/api/v1/kuis/'.$kuis->id_kuis.'/nilai';

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->postJson($url, ['id_siswa' => $d->siswa1->id_pengguna, 'nilai' => 100])->assertForbidden();
        }
        $this->assertDatabaseMissing('nilai', ['id_kuis' => $kuis->id_kuis]);
    }

    public function test_sumber_tidak_boleh_dikirim_klien_pada_nilai_kuis(): void
    {
        $d = $this->buatDunia();
        $kuis = $this->kuisBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/kuis/'.$kuis->id_kuis.'/nilai', [
            'id_siswa' => $d->siswa1->id_pengguna, 'nilai' => 80, 'id_pengumpulan' => $d->pengumpulanA->id_pengumpulan,
        ])->assertUnprocessable()->assertJsonValidationErrors(['id_pengumpulan']);
    }

    // ----------------------------------------------------------------- perubahan & feedback

    public function test_guru_memperbarui_nilai(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->patchJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai, ['nilai' => 95.25])
            ->assertOk()->assertJsonPath('data.nilai', 95.25);
        $this->assertDatabaseHas('nilai', ['id_nilai' => $d->nilaiTugasA->id_nilai, 'nilai' => '95.25']);
    }

    public function test_guru_memberi_dan_menghapus_umpan_balik_tanpa_mengubah_nilai(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/nilai/'.$d->nilaiKuisA->id_nilai;
        $awal = $d->nilaiKuisA->fresh()->nilai;

        $this->sebagai($d->guruA)->patchJson($url, ['umpan_balik' => 'Perhatikan soal 3.'])->assertOk()->assertJsonPath('data.umpan_balik', 'Perhatikan soal 3.');
        $this->assertEquals($awal, $d->nilaiKuisA->fresh()->nilai);

        $this->sebagai($d->guruA)->patchJson($url, ['umpan_balik' => null])->assertOk()->assertJsonPath('data.umpan_balik', null);
    }

    public function test_perubahan_hanya_nilai_dan_umpan_balik(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/nilai/'.$d->nilaiTugasA->id_nilai;

        foreach (['id_siswa' => $d->siswa2->id_pengguna, 'id_pengumpulan' => $d->pengumpulanB->id_pengumpulan, 'id_kuis' => $d->kuisA->id_kuis] as $kolom => $isi) {
            $this->sebagai($d->guruA)->patchJson($url, [$kolom => $isi])->assertUnprocessable();
        }
        $this->sebagai($d->guruA)->patchJson($url, [])->assertUnprocessable();
        $this->sebagai($d->guruA)->patchJson($url, ['nilai' => 101])->assertUnprocessable()->assertJsonValidationErrors(['nilai']);
        $this->sebagai($d->guruA)->patchJson($url, ['nilai' => null])->assertUnprocessable();

        $baris = $d->nilaiTugasA->fresh();
        $this->assertSame($d->siswa1->id_pengguna, $baris->id_siswa);
        $this->assertSame($d->pengumpulanA->id_pengumpulan, $baris->id_pengumpulan);
        $this->assertNull($baris->id_kuis);
    }

    public function test_siswa_tidak_dapat_mengubah_nilainya_sendiri(): void
    {
        $d = $this->buatDunia();
        $sebelum = $d->nilaiTugasA->fresh()->nilai;

        $this->sebagai($d->siswa1)->patchJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai, ['nilai' => 100])->assertForbidden();
        $this->sebagai($d->siswa1)->patchJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai, ['umpan_balik' => 'x'])->assertForbidden();
        $this->sebagai($d->siswa1)->deleteJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai)->assertStatus(405);
        $this->assertEquals($sebelum, $d->nilaiTugasA->fresh()->nilai);
    }

    public function test_guru_lain_dan_admin_tidak_dapat_mengubah_nilai(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruB, $d->guruC, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->patchJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai, ['nilai' => 1])->assertForbidden();
        }
        $this->sebagai($d->guruA)->patchJson('/api/v1/nilai/'.$d->nilaiTugasB->id_nilai, ['nilai' => 1])->assertForbidden();
        $this->sebagai($d->guruA)->patchJson('/api/v1/nilai/999999', ['nilai' => 1])->assertNotFound();
    }

    // ----------------------------------------------------------------- membaca

    public function test_siswa_melihat_nilai_miliknya(): void
    {
        $d = $this->buatDunia();

        $r = $this->sebagai($d->siswa1)->getJson('/api/v1/nilai/saya')->assertOk();
        $this->assertEqualsCanonicalizing([$d->nilaiTugasA->id_nilai, $d->nilaiKuisA->id_nilai], collect($r->json('data'))->pluck('id_nilai')->all());

        $this->sebagai($d->siswa1)->getJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai)->assertOk()->assertJsonPath('data.sumber', 'tugas');
        $this->sebagai($d->siswa1)->getJson('/api/v1/nilai/'.$d->nilaiTugasB->id_nilai)->assertForbidden();
        $this->sebagai($d->siswa2)->getJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai)->assertForbidden();
        $this->sebagai($d->guruA)->getJson('/api/v1/nilai/saya')->assertForbidden();
    }

    public function test_daftar_nilai_dibatasi_per_peran(): void
    {
        $d = $this->buatDunia();
        $ids = fn ($r) => collect($r->json('data'))->pluck('id_nilai')->sort()->values()->all();

        $this->assertSame([$d->nilaiTugasA->id_nilai, $d->nilaiKuisA->id_nilai], $ids($this->sebagai($d->guruA)->getJson('/api/v1/nilai')->assertOk()));
        $this->assertSame([$d->nilaiTugasB->id_nilai], $ids($this->sebagai($d->guruB)->getJson('/api/v1/nilai')->assertOk()));
        $this->assertSame([], $ids($this->sebagai($d->guruC)->getJson('/api/v1/nilai')->assertOk()));
        $this->assertSame([$d->nilaiTugasB->id_nilai], $ids($this->sebagai($d->siswa2)->getJson('/api/v1/nilai')->assertOk()));
        $this->assertCount(3, $this->sebagai($d->admin)->getJson('/api/v1/nilai')->assertOk()->json('data'));
    }

    public function test_filter_sumber_dan_mapel(): void
    {
        $d = $this->buatDunia();

        $tugas = $this->sebagai($d->admin)->getJson('/api/v1/nilai?sumber=tugas')->assertOk()->json('data');
        $this->assertCount(2, $tugas);
        $this->sebagai($d->admin)->getJson('/api/v1/nilai?sumber=kuis')->assertOk()->assertJsonCount(1, 'data');
        $this->sebagai($d->admin)->getJson('/api/v1/nilai?id_mapel='.$d->mapelB->id_mapel)->assertOk()->assertJsonCount(1, 'data');
        $this->sebagai($d->admin)->getJson('/api/v1/nilai?id_kuis='.$d->kuisA->id_kuis)->assertOk()->assertJsonCount(1, 'data');
        $this->sebagai($d->admin)->getJson('/api/v1/nilai?id_tugas='.$d->tugasB->id_tugas)->assertOk()->assertJsonCount(1, 'data');
        $this->sebagai($d->admin)->getJson('/api/v1/nilai?sumber=lain')->assertUnprocessable();
        $this->sebagai($d->admin)->getJson('/api/v1/nilai?urut=nilai;drop')->assertUnprocessable();
    }

    public function test_rekap_per_mapel(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->getJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/nilai')->assertOk()->assertJsonCount(2, 'data');
        $this->sebagai($d->admin)->getJson('/api/v1/mapel/'.$d->mapelB->id_mapel.'/nilai')->assertOk()->assertJsonCount(1, 'data');
        $this->sebagai($d->guruB)->getJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/nilai')->assertForbidden();
        $this->sebagai($d->guruC)->getJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/nilai')->assertForbidden();
        $this->sebagai($d->siswa1)->getJson('/api/v1/mapel/'.$d->mapelA->id_mapel.'/nilai')->assertForbidden();
    }

    public function test_rekap_per_siswa(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/siswa/'.$d->siswa1->id_pengguna.'/nilai';

        $this->sebagai($d->siswa1)->getJson($url)->assertOk()->assertJsonCount(2, 'data');
        $this->sebagai($d->admin)->getJson($url)->assertOk()->assertJsonCount(2, 'data');
        $this->sebagai($d->guruA)->getJson($url)->assertOk()->assertJsonCount(2, 'data');
        $this->sebagai($d->guruB)->getJson($url)->assertOk()->assertJsonCount(0, 'data'); // tidak ada nilai pada mapel yang diampunya
        $this->sebagai($d->siswa2)->getJson($url)->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/siswa/'.$d->guruA->id_pengguna.'/nilai')->assertNotFound();
    }

    public function test_resource_tidak_membocorkan_data_internal(): void
    {
        $d = $this->buatDunia();

        $data = $this->sebagai($d->siswa1)->getJson('/api/v1/nilai/'.$d->nilaiTugasA->id_nilai)->assertOk()->json('data');
        $this->assertArrayNotHasKey('jawaban_file', $data);
        $this->assertSame(['min' => 0, 'maks' => 100], $data['skala']);
        $this->assertArrayNotHasKey('nilai_akhir', $data);
    }

    // ----------------------------------------------------------------- constraint database

    public function test_db_menolak_nilai_dengan_dua_sumber(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $this->rawInsert(['id_siswa' => $d->siswa1->id_pengguna, 'id_pengumpulan' => $this->pengumpulanBaru($d)->id_pengumpulan, 'id_kuis' => $d->kuisA->id_kuis, 'nilai' => 80]);
    }

    public function test_db_menolak_nilai_tanpa_sumber(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $this->rawInsert(['id_siswa' => $d->siswa1->id_pengguna, 'nilai' => 80]);
    }

    public function test_db_menolak_nilai_di_luar_rentang(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $this->rawInsert(['id_siswa' => $d->siswa1->id_pengguna, 'id_kuis' => $this->kuisBaru($d)->id_kuis, 'nilai' => 100.5]);
    }

    public function test_db_menolak_siswa_tidak_cocok_dengan_pengumpulan(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $this->rawInsert(['id_siswa' => $d->siswa2->id_pengguna, 'id_pengumpulan' => $this->pengumpulanBaru($d)->id_pengumpulan, 'nilai' => 80]);
    }

    public function test_db_menolak_nilai_kuis_ganda_untuk_siswa_sama(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $this->rawInsert(['id_siswa' => $d->siswa1->id_pengguna, 'id_kuis' => $d->kuisA->id_kuis, 'nilai' => 10]);
    }

    /** @param array<string, mixed> $kolom */
    private function rawInsert(array $kolom): void
    {
        DB::table('nilai')->insert($kolom + ['id_pengumpulan' => null, 'id_kuis' => null, 'created_at' => now(), 'updated_at' => now()]);
    }
}
