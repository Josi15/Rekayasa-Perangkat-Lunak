<?php

namespace Tests\Feature\Tugas;

use App\Enums\StatusPengumpulan;
use App\Models\PengumpulanTugas;
use App\Models\Tugas;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class TugasApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const JSON = ['Accept' => 'application/json'];

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake((string) config('tugas.disk'));
    }

    private function disk(): Filesystem
    {
        return Storage::disk((string) config('tugas.disk'));
    }

    private function berkas(string $nama = 'soal.pdf', int $kb = 50, string $mime = 'application/pdf'): UploadedFile
    {
        return UploadedFile::fake()->create($nama, $kb, $mime);
    }

    /** @return list<string> */
    private function semuaFile(): array
    {
        return $this->disk()->allFiles();
    }

    /** @param array<string, mixed> $ubah */
    private function tugasBaru(object $d, array $ubah = []): Tugas
    {
        return Tugas::factory()->create($ubah + ['id_mapel' => $d->mapelA->id_mapel, 'batas_waktu' => $this->besok(5)]);
    }

    /** @param array<string, mixed> $ubah @return array<string, mixed> */
    private function payload(array $ubah = []): array
    {
        return $ubah + ['judul' => 'Latihan Bab 1', 'instruksi' => 'Kerjakan soal 1-10.', 'batas_waktu' => now()->addDays(4)->toIso8601String()];
    }

    private function urlMapel(object $d): string
    {
        return '/api/v1/mapel/'.$d->mapelA->id_mapel.'/tugas';
    }

    // ------------------------------------------------------------- autentikasi

    public function test_tanpa_login_401_di_semua_endpoint(): void
    {
        foreach ([['GET', '/api/v1/tugas'], ['GET', '/api/v1/mapel/1/tugas'], ['POST', '/api/v1/mapel/1/tugas'], ['GET', '/api/v1/tugas/1'],
            ['PATCH', '/api/v1/tugas/1'], ['DELETE', '/api/v1/tugas/1'], ['POST', '/api/v1/tugas/1/tutup'], ['GET', '/api/v1/tugas/1/lampiran'],
            ['POST', '/api/v1/tugas/1/lampiran'], ['DELETE', '/api/v1/tugas/1/lampiran']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    // ------------------------------------------------------------- buat

    public function test_guru_pengampu_membuat_tugas(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->postJson($this->urlMapel($d), $this->payload(['judul' => '  Latihan Bab 1  ']))
            ->assertCreated()
            ->assertJsonPath('data.judul', 'Latihan Bab 1')
            ->assertJsonPath('data.id_mapel', $d->mapelA->id_mapel)
            ->assertJsonPath('data.status', 'terbuka')
            ->assertJsonPath('data.menerima_pengumpulan', true)
            ->assertJsonPath('data.punya_lampiran', false)
            ->assertJsonPath('data.url_lampiran', null)
            ->assertJsonPath('data.jumlah_pengumpulan', 0)
            ->assertJsonMissingPath('data.lampiran');

        $this->assertDatabaseHas('tugas', ['judul' => 'Latihan Bab 1', 'id_mapel' => $d->mapelA->id_mapel, 'lampiran' => null]);
    }

    public function test_membuat_tugas_dengan_lampiran_menyimpan_file_privat_bernama_acak(): void
    {
        $d = $this->buatDunia();

        $r = $this->sebagai($d->guruA)->post($this->urlMapel($d), $this->payload(['lampiran' => $this->berkas('../../soal.php.pdf')]), self::JSON)
            ->assertCreated()->assertJsonPath('data.punya_lampiran', true)->assertJsonMissingPath('data.lampiran');

        $path = Tugas::query()->findOrFail($r->json('data.id_tugas'))->lampiran;
        $this->disk()->assertExists($path);
        $this->assertMatchesRegularExpression('#^tugas/lampiran/'.$d->mapelA->id_mapel.'/[0-9a-f-]{36}\.pdf$#', $path);
        $this->assertStringNotContainsString($path, $r->getContent());
    }

    public function test_batas_waktu_dengan_offset_zona_disimpan_sebagai_instan_yang_sama(): void
    {
        $d = $this->buatDunia();
        $kirim = now()->addDays(6)->setTimezone('Asia/Jakarta');

        $r = $this->sebagai($d->guruA)->postJson($this->urlMapel($d), $this->payload(['batas_waktu' => $kirim->toIso8601String()]))->assertCreated();

        $this->assertTrue(Carbon::parse($r->json('data.batas_waktu'))->equalTo($kirim));
        $this->assertTrue(Tugas::query()->findOrFail($r->json('data.id_tugas'))->batas_waktu->equalTo($kirim));
    }

    /** @return array<string, array{0: array<string, mixed>, 1: string}> */
    public static function payloadTugasTidakValid(): array
    {
        return [
            'judul kosong' => [['judul' => ''], 'judul'],
            'judul terlalu panjang' => [['judul' => str_repeat('a', 256)], 'judul'],
            'instruksi kosong' => [['instruksi' => ''], 'instruksi'],
            'instruksi terlalu panjang' => [['instruksi' => str_repeat('a', 20001)], 'instruksi'],
            'batas waktu kosong' => [['batas_waktu' => null], 'batas_waktu'],
            'batas waktu bukan tanggal' => [['batas_waktu' => 'besok-sore'], 'batas_waktu'],
            'batas waktu sudah lewat' => [['batas_waktu' => '2020-01-01T00:00:00+00:00'], 'batas_waktu'],
        ];
    }

    /** @param array<string, mixed> $ubah */
    #[DataProvider('payloadTugasTidakValid')]
    public function test_validasi_pembuatan_tugas(array $ubah, string $kolom): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->postJson($this->urlMapel($d), $this->payload($ubah))
            ->assertUnprocessable()->assertJsonPath('code', 'validation_error')->assertJsonValidationErrors($kolom, 'errors');
        $this->assertDatabaseCount('tugas', 2); // hanya tugasA & tugasB dari dunia uji
    }

    /** @return array<string, array{0: string, 1: string}> */
    public static function lampiranDitolak(): array
    {
        return [
            'exe' => ['virus.exe', 'application/x-msdownload'],
            'php menyamar .pdf' => ['soal.pdf', 'text/x-php'],
            'html menyamar .pdf' => ['soal.pdf', 'text/html'],
            'svg' => ['gambar.svg', 'image/svg+xml'],
            'zip' => ['arsip.zip', 'application/zip'],
        ];
    }

    #[DataProvider('lampiranDitolak')]
    public function test_lampiran_tidak_valid_ditolak_tanpa_jejak(string $nama, string $mime): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->post($this->urlMapel($d), $this->payload(['lampiran' => $this->berkas($nama, 10, $mime)]), self::JSON)
            ->assertUnprocessable()->assertJsonValidationErrors('lampiran', 'errors');

        $this->assertDatabaseCount('tugas', 2);
        $this->assertSame([], $this->semuaFile());
    }

    public function test_lampiran_melebihi_batas_ukuran_ditolak(): void
    {
        $d = $this->buatDunia();
        config(['tugas.maks_kb_lampiran' => 100]);

        $this->sebagai($d->guruA)->post($this->urlMapel($d), $this->payload(['lampiran' => $this->berkas('besar.pdf', 101)]), self::JSON)->assertUnprocessable();
        $this->sebagai($d->guruA)->post($this->urlMapel($d), $this->payload(['lampiran' => $this->berkas('pas.pdf', 100)]), self::JSON)->assertCreated();
    }

    public function test_hanya_guru_pengampu_boleh_membuat_tugas(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->postJson($this->urlMapel($d), $this->payload())->assertForbidden();
        }
        $this->sebagai($d->siswa1)->postJson($this->urlMapel($d), [])->assertForbidden(); // 403 mendahului 422
        $this->assertDatabaseCount('tugas', 2);
    }

    public function test_mapel_arsip_menolak_tugas_baru(): void
    {
        $d = $this->buatDunia();
        $d->mapelA->forceFill(['diarsipkan_pada' => now()])->save();

        $this->sebagai($d->guruA)->postJson($this->urlMapel($d), $this->payload())
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
    }

    public function test_kegagalan_penyimpanan_lampiran_503_tanpa_baris_baru(): void
    {
        $d = $this->buatDunia();
        config(['filesystems.disks.rusak' => ['driver' => 'local', 'root' => __FILE__, 'throw' => true], 'tugas.disk' => 'rusak']);

        $this->sebagai($d->guruA)->post($this->urlMapel($d), $this->payload(['lampiran' => $this->berkas()]), self::JSON)
            ->assertStatus(503)->assertJsonPath('code', 'storage_failure');
        $this->assertDatabaseCount('tugas', 2);
    }

    public function test_kegagalan_basis_data_setelah_lampiran_tertulis_menghapus_file(): void
    {
        $d = $this->buatDunia();
        Tugas::creating(fn () => throw new \RuntimeException('gagal simpan baris'));

        $this->sebagai($d->guruA)->post($this->urlMapel($d), $this->payload(['lampiran' => $this->berkas()]), self::JSON)->assertStatus(500);

        $this->assertSame([], $this->semuaFile());
    }

    // ------------------------------------------------------------- daftar

    public function test_daftar_tugas_per_mapel_sesuai_hak_akses(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruA, $d->siswa1, $d->admin] as $pelaku) {
            $ids = array_column($this->sebagai($pelaku)->getJson($this->urlMapel($d))->assertOk()->json('data'), 'id_tugas');
            $this->assertSame([$d->tugasA->id_tugas], $ids);
        }
        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson($this->urlMapel($d))->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/mapel/999999/tugas')->assertNotFound();
    }

    public function test_daftar_tugas_tersedia_dibatasi_peran(): void
    {
        $d = $this->buatDunia();
        $ids = fn ($p, $q = '') => array_column($this->sebagai($p)->getJson('/api/v1/tugas?per_page=100'.$q)->assertOk()->json('data'), 'id_tugas');

        $this->assertEqualsCanonicalizing([$d->tugasA->id_tugas, $d->tugasB->id_tugas], $ids($d->admin));
        $this->assertSame([$d->tugasA->id_tugas], $ids($d->siswa1));
        $this->assertSame([$d->tugasA->id_tugas], $ids($d->guruA));
        $this->assertSame([], $ids($d->guruC));
        $this->assertSame([$d->tugasB->id_tugas], $ids($d->admin, '&id_mapel='.$d->mapelB->id_mapel));
    }

    public function test_filter_status_terbuka_dan_tertutup_serta_pencarian_dan_urutan(): void
    {
        $d = $this->buatDunia();
        $buka = $this->tugasBaru($d, ['judul' => 'Aljabar Terbuka']);
        $tutup = $this->tugasBaru($d, ['judul' => 'Aljabar Tertutup', 'batas_waktu' => $this->kemarin(2)]);
        $ids = fn ($q) => array_column($this->sebagai($d->siswa1)->getJson('/api/v1/tugas?per_page=100'.$q)->assertOk()->json('data'), 'id_tugas');

        $this->assertContains($buka->id_tugas, $ids('&status=terbuka'));
        $this->assertNotContains($tutup->id_tugas, $ids('&status=terbuka'));
        $this->assertSame([$tutup->id_tugas], $ids('&status=tertutup'));
        $this->assertEqualsCanonicalizing([$buka->id_tugas, $tutup->id_tugas], $ids('&cari=ALJABAR'));

        $urut = array_column($this->sebagai($d->siswa1)->getJson('/api/v1/tugas?urut=batas_waktu&arah=asc&per_page=100')->json('data'), 'batas_waktu');
        $sorted = $urut;
        sort($sorted);
        $this->assertSame($sorted, $urut);

        foreach (['status=hapus', 'urut=lampiran', 'per_page=101', 'id_mapel=abc'] as $q) {
            $this->sebagai($d->siswa1)->getJson('/api/v1/tugas?'.$q)->assertUnprocessable();
        }
    }

    public function test_tampilan_siswa_dan_guru_berbeda_dan_tidak_membocorkan_data_lain(): void
    {
        $d = $this->buatDunia(); // siswa1 sudah mengumpulkan tugasA (pengumpulanA)
        $d->siswa2->kelas()->attach($d->kelasA->id_kelas);
        PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa2->id_pengguna, 'id_tugas' => $d->tugasA->id_tugas]);

        // siswa hanya melihat pengumpulan MILIKNYA, bukan jumlah/daftar pengumpulan siswa lain
        $this->sebagai($d->siswa1)->getJson('/api/v1/tugas/'.$d->tugasA->id_tugas)->assertOk()
            ->assertJsonPath('data.pengumpulan_saya.id_pengumpulan', $d->pengumpulanA->id_pengumpulan)
            ->assertJsonMissingPath('data.jumlah_pengumpulan');

        $this->sebagai($d->guruA)->getJson('/api/v1/tugas/'.$d->tugasA->id_tugas)->assertOk()
            ->assertJsonPath('data.jumlah_pengumpulan', 2)->assertJsonMissingPath('data.pengumpulan_saya');
    }

    // ------------------------------------------------------------- detail

    public function test_detail_sesuai_hak_akses(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/tugas/'.$d->tugasA->id_tugas;

        foreach ([$d->guruA, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertOk()
                ->assertJsonPath('data.id_tugas', $d->tugasA->id_tugas)->assertJsonPath('data.mapel.id_mapel', $d->mapelA->id_mapel);
        }
        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/tugas/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/tugas/abc')->assertNotFound();
    }

    // ------------------------------------------------------------- ubah

    public function test_guru_pengampu_mengubah_tugas(): void
    {
        $d = $this->buatDunia();
        $baru = now()->addDays(9)->toIso8601String();

        $this->sebagai($d->guruA)->patchJson('/api/v1/tugas/'.$d->tugasA->id_tugas, ['judul' => 'Judul Baru', 'instruksi' => 'Instruksi baru', 'batas_waktu' => $baru])
            ->assertOk()->assertJsonPath('data.judul', 'Judul Baru')->assertJsonPath('data.instruksi', 'Instruksi baru');

        $this->assertTrue($d->tugasA->fresh()->batas_waktu->equalTo(Carbon::parse($baru)));
    }

    public function test_ubah_validasi_dan_field_terlarang(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/tugas/'.$d->tugasA->id_tugas;

        $this->sebagai($d->guruA)->patchJson($url, [])->assertUnprocessable();
        $this->sebagai($d->guruA)->patchJson($url, ['judul' => ''])->assertUnprocessable();
        $this->sebagai($d->guruA)->patchJson($url, ['batas_waktu' => '2020-01-01T00:00:00+00:00'])->assertUnprocessable()->assertJsonValidationErrors('batas_waktu', 'errors');
        $this->sebagai($d->guruA)->patchJson($url, ['judul' => 'X', 'lampiran' => 'tugas/x.pdf'])->assertUnprocessable()->assertJsonValidationErrors('lampiran', 'errors');
        $this->sebagai($d->guruA)->patchJson($url, ['judul' => 'X', 'id_mapel' => $d->mapelB->id_mapel])->assertUnprocessable()->assertJsonValidationErrors('id_mapel', 'errors');
        $this->assertSame($d->mapelA->id_mapel, $d->tugasA->fresh()->id_mapel);
    }

    public function test_pihak_tak_berwenang_tidak_boleh_mengubah_menutup_atau_menghapus(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/tugas/'.$d->tugasA->id_tugas;
        $judul = $d->tugasA->judul;

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->patchJson($url, ['judul' => 'Dibajak'])->assertForbidden();
            $this->sebagai($pelaku)->postJson($url.'/tutup')->assertForbidden();
            $this->sebagai($pelaku)->deleteJson($url)->assertForbidden();
            $this->sebagai($pelaku)->post($url.'/lampiran', ['lampiran' => $this->berkas()], self::JSON)->assertForbidden();
            $this->sebagai($pelaku)->deleteJson($url.'/lampiran')->assertForbidden();
        }
        $this->assertSame($judul, $d->tugasA->fresh()->judul);
        $this->assertTrue($d->tugasA->fresh()->menerimaPengumpulan());
    }

    public function test_mapel_arsip_menolak_perubahan_tugas(): void
    {
        $d = $this->buatDunia();
        $d->mapelA->forceFill(['diarsipkan_pada' => now()])->save();

        $this->sebagai($d->guruA)->patchJson('/api/v1/tugas/'.$d->tugasA->id_tugas, ['judul' => 'Baru'])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
    }

    public function test_mengubah_deadline_tidak_menulis_ulang_status_pengumpulan_lama(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $p = PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $tugas->id_tugas, 'status' => StatusPengumpulan::Terlambat]);

        $this->sebagai($d->guruA)->patchJson('/api/v1/tugas/'.$tugas->id_tugas, ['batas_waktu' => now()->addDays(30)->toIso8601String()])->assertOk();

        $this->assertSame(StatusPengumpulan::Terlambat, $p->fresh()->status);
    }

    // ------------------------------------------------------------- tutup

    public function test_tutup_tugas_menghentikan_pengumpulan_tanpa_mengubah_yang_sudah_masuk(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $url = '/api/v1/tugas/'.$tugas->id_tugas;
        $sudah = PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $tugas->id_tugas]);

        $this->sebagai($d->guruA)->postJson($url.'/tutup')->assertOk()
            ->assertJsonPath('data.status', 'tertutup')->assertJsonPath('data.menerima_pengumpulan', false);

        $this->sebagai($d->guruA)->postJson($url.'/tutup')->assertOk(); // idempotent
        $this->assertSame(StatusPengumpulan::Dikumpulkan, $sudah->fresh()->status);

        $this->sebagai($d->siswa1)->post($url.'/pengumpulan/revisi', ['file' => $this->berkas('x.pdf')], self::JSON)
            ->assertStatus(409)->assertJsonPath('code', 'deadline_passed');
    }

    public function test_tutup_tetap_menutup_walau_ada_toleransi_keterlambatan(): void
    {
        $d = $this->buatDunia();
        config(['tugas.toleransi_terlambat_jam' => 6]);
        $tugas = $this->tugasBaru($d);

        $this->sebagai($d->guruA)->postJson('/api/v1/tugas/'.$tugas->id_tugas.'/tutup')->assertOk()->assertJsonPath('data.menerima_pengumpulan', false);
        $this->sebagai($d->siswa1)->post('/api/v1/tugas/'.$tugas->id_tugas.'/pengumpulan', ['file' => $this->berkas('x.pdf')], self::JSON)
            ->assertStatus(409)->assertJsonPath('code', 'deadline_passed');
    }

    public function test_tugas_dibuka_kembali_dengan_batas_waktu_baru(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $url = '/api/v1/tugas/'.$tugas->id_tugas;

        $this->sebagai($d->guruA)->postJson($url.'/tutup')->assertOk();
        $this->sebagai($d->guruA)->patchJson($url, ['batas_waktu' => now()->addDays(2)->toIso8601String()])
            ->assertOk()->assertJsonPath('data.status', 'terbuka');
        $this->sebagai($d->siswa1)->post($url.'/pengumpulan', ['file' => $this->berkas('x.pdf')], self::JSON)->assertCreated();
    }

    // ------------------------------------------------------------- hapus

    public function test_hapus_tugas_tanpa_pengumpulan_menghapus_baris_dan_lampiran(): void
    {
        $d = $this->buatDunia();
        $path = 'tugas/lampiran/'.$d->mapelA->id_mapel.'/contoh.pdf';
        $this->disk()->put($path, 'isi');
        $tugas = $this->tugasBaru($d, ['lampiran' => $path]);

        $this->sebagai($d->guruA)->deleteJson('/api/v1/tugas/'.$tugas->id_tugas)->assertNoContent();

        $this->assertDatabaseMissing('tugas', ['id_tugas' => $tugas->id_tugas]);
        $this->disk()->assertMissing($path);
        $this->sebagai($d->guruA)->deleteJson('/api/v1/tugas/'.$tugas->id_tugas)->assertNotFound();
    }

    public function test_hapus_tugas_yang_sudah_ada_pengumpulan_ditolak_409(): void
    {
        $d = $this->buatDunia(); // tugasA punya pengumpulanA

        $this->sebagai($d->guruA)->deleteJson('/api/v1/tugas/'.$d->tugasA->id_tugas)
            ->assertStatus(409)->assertJsonPath('code', 'task_has_submissions');
        $this->assertDatabaseHas('tugas', ['id_tugas' => $d->tugasA->id_tugas]);
        $this->assertDatabaseHas('pengumpulan_tugas', ['id_pengumpulan' => $d->pengumpulanA->id_pengumpulan]);
    }

    public function test_foreign_key_mencegah_hapus_mapel_yang_masih_punya_tugas(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $d->mapelA->delete();
    }

    // ------------------------------------------------------------- lampiran

    public function test_unduh_lampiran_oleh_yang_berhak_dengan_header_aman(): void
    {
        $d = $this->buatDunia();
        $path = 'tugas/lampiran/'.$d->mapelA->id_mapel.'/soal.pdf';
        $this->disk()->put($path, '%PDF-1.4 soal rahasia');
        $tugas = $this->tugasBaru($d, ['lampiran' => $path, 'judul' => 'Soal Latihan 1']);
        $url = '/api/v1/tugas/'.$tugas->id_tugas.'/lampiran';

        foreach ([$d->guruA, $d->siswa1, $d->admin] as $pelaku) {
            $r = $this->sebagai($pelaku)->get($url)->assertOk()
                ->assertHeader('Content-Type', 'application/pdf')->assertHeader('X-Content-Type-Options', 'nosniff');
            $this->assertStringContainsString('attachment', $r->headers->get('Content-Disposition'));
            $this->assertStringContainsString('lampiran-soal-latihan-1.pdf', $r->headers->get('Content-Disposition'));
            $this->assertSame('%PDF-1.4 soal rahasia', $r->streamedContent());
        }
        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertForbidden();
        }
    }

    public function test_unduh_lampiran_tanpa_lampiran_atau_file_hilang_404(): void
    {
        $d = $this->buatDunia();
        $tanpa = $this->tugasBaru($d);
        $hilang = $this->tugasBaru($d, ['lampiran' => 'tugas/lampiran/1/tidak-ada.pdf']);

        $this->sebagai($d->guruA)->getJson('/api/v1/tugas/'.$tanpa->id_tugas.'/lampiran')->assertNotFound()->assertJsonPath('code', 'not_found');
        $this->sebagai($d->guruA)->getJson('/api/v1/tugas/'.$hilang->id_tugas.'/lampiran')->assertNotFound()->assertJsonPath('code', 'not_found');
    }

    public function test_ganti_dan_hapus_lampiran(): void
    {
        $d = $this->buatDunia();
        $lama = 'tugas/lampiran/'.$d->mapelA->id_mapel.'/lama.pdf';
        $this->disk()->put($lama, 'lama');
        $tugas = $this->tugasBaru($d, ['lampiran' => $lama]);
        $url = '/api/v1/tugas/'.$tugas->id_tugas.'/lampiran';

        $this->sebagai($d->guruA)->post($url, ['lampiran' => $this->berkas('baru.png', 10, 'image/png')], self::JSON)
            ->assertOk()->assertJsonPath('data.punya_lampiran', true);
        $baru = $tugas->fresh()->lampiran;
        $this->assertNotSame($lama, $baru);
        $this->disk()->assertMissing($lama);
        $this->disk()->assertExists($baru);

        $this->sebagai($d->guruA)->deleteJson($url)->assertOk()->assertJsonPath('data.punya_lampiran', false);
        $this->assertNull($tugas->fresh()->lampiran);
        $this->disk()->assertMissing($baru);
    }

    public function test_ganti_lampiran_tidak_valid_menjaga_file_lama(): void
    {
        $d = $this->buatDunia();
        $lama = 'tugas/lampiran/'.$d->mapelA->id_mapel.'/lama.pdf';
        $this->disk()->put($lama, 'lama');
        $tugas = $this->tugasBaru($d, ['lampiran' => $lama]);

        $this->sebagai($d->guruA)->post('/api/v1/tugas/'.$tugas->id_tugas.'/lampiran', ['lampiran' => $this->berkas('x.exe', 10, 'application/x-msdownload')], self::JSON)->assertUnprocessable();
        $this->sebagai($d->guruA)->post('/api/v1/tugas/'.$tugas->id_tugas.'/lampiran', [], self::JSON)->assertUnprocessable();

        $this->assertSame($lama, $tugas->fresh()->lampiran);
        $this->assertSame([$lama], $this->semuaFile());
    }

    public function test_siswa_tidak_melihat_tugas_mapel_yang_tidak_diikutinya(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa1)->getJson('/api/v1/tugas/'.$d->tugasB->id_tugas)->assertForbidden();
    }
}
