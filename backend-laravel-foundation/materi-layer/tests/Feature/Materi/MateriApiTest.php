<?php

namespace Tests\Feature\Materi;

use App\Models\Materi;
use App\Models\Pengguna;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class MateriApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake((string) config('materi.disk'));
    }

    private function disk(): \Illuminate\Contracts\Filesystem\Filesystem
    {
        return Storage::disk((string) config('materi.disk'));
    }

    private function pdf(string $nama = 'bahan.pdf', int $kb = 50, string $mime = 'application/pdf'): UploadedFile
    {
        return UploadedFile::fake()->create($nama, $kb, $mime);
    }

    /** @return list<string> */
    private function semuaFile(): array
    {
        return $this->disk()->allFiles();
    }

    private function urlDaftar(object $d, string $mapel = 'mapelA'): string
    {
        return '/api/v1/mapel/'.$d->{$mapel}->id_mapel.'/materi';
    }

    /** Membuat materi nyata (baris + file) langsung lewat penyimpanan. */
    private function materiDenganFile(object $d, string $isi = '%PDF-1.4 isi materi', string $judul = 'Bab 1: Pengantar'): Materi
    {
        $path = 'materi/'.$d->mapelA->id_mapel.'/contoh-'.uniqid().'.pdf';
        $this->disk()->put($path, $isi);

        return Materi::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'judul' => $judul, 'file' => $path]);
    }

    // ------------------------------------------------------------- autentikasi

    public function test_tanpa_login_401_di_semua_endpoint(): void
    {
        foreach ([['GET', '/api/v1/mapel/1/materi'], ['POST', '/api/v1/mapel/1/materi'], ['GET', '/api/v1/materi/1'],
            ['PATCH', '/api/v1/materi/1'], ['DELETE', '/api/v1/materi/1'], ['POST', '/api/v1/materi/1/file'], ['GET', '/api/v1/materi/1/file']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    // ------------------------------------------------------------- konfigurasi storage

    public function test_disk_materi_bukan_disk_publik(): void
    {
        $disk = (string) config('materi.disk');
        $konf = config('filesystems.disks.'.$disk);

        $this->assertNotSame('public', $disk);
        $this->assertNotSame('public', $konf['visibility'] ?? 'private');
        $this->assertStringNotContainsString(str_replace('\\', '/', public_path()), str_replace('\\', '/', (string) ($konf['root'] ?? '')));
    }

    // ------------------------------------------------------------- daftar

    public function test_daftar_materi_per_mapel_sesuai_hak_akses(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruA, $d->siswa1, $d->admin] as $pelaku) {
            $r = $this->sebagai($pelaku)->getJson($this->urlDaftar($d))->assertOk();
            $this->assertSame([$d->materiA->id_materi], array_column($r->json('data'), 'id_materi'));
        }

        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson($this->urlDaftar($d))->assertForbidden();
        }

        $this->sebagai($d->admin)->getJson('/api/v1/mapel/999999/materi')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/mapel/abc/materi')->assertNotFound();
    }

    public function test_daftar_pagination_pencarian_urutan_dan_validasi(): void
    {
        $d = $this->buatDunia();
        foreach (['Aljabar 1', 'Aljabar 2', 'Geometri', 'Statistika'] as $judul) {
            Materi::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'judul' => $judul]);
        }

        $r = $this->sebagai($d->guruA)->getJson($this->urlDaftar($d).'?cari=ALJABAR&per_page=1&page=2&urut=judul')->assertOk();
        $r->assertJsonPath('meta.total', 2)->assertJsonCount(1, 'data')->assertJsonPath('data.0.judul', 'Aljabar 2');

        $judul = array_column($this->sebagai($d->guruA)->getJson($this->urlDaftar($d).'?urut=judul&arah=desc&per_page=100')->json('data'), 'judul');
        $urut = $judul;
        rsort($urut);
        $this->assertSame($urut, $judul);

        foreach (['per_page=101', 'urut=file', 'status=aktif', 'arah=x'] as $q) {
            $this->sebagai($d->guruA)->getJson($this->urlDaftar($d).'?'.$q)->assertUnprocessable();
        }
    }

    public function test_respons_tidak_membocorkan_path_penyimpanan(): void
    {
        $d = $this->buatDunia();

        $r = $this->sebagai($d->siswa1)->getJson($this->urlDaftar($d))->assertOk()
            ->assertJsonMissingPath('data.0.file')
            ->assertJsonStructure(['data' => [['id_materi', 'judul', 'id_mapel', 'ekstensi', 'tipe', 'url_file']]]);

        $this->assertStringNotContainsString($d->materiA->file, $r->getContent());
    }

    // ------------------------------------------------------------- detail

    public function test_detail_sesuai_hak_akses(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/materi/'.$d->materiA->id_materi;

        foreach ([$d->guruA, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertOk()
                ->assertJsonPath('data.id_materi', $d->materiA->id_materi)
                ->assertJsonPath('data.mapel.id_mapel', $d->mapelA->id_mapel)
                ->assertJsonPath('data.url_file', $url.'/file');
        }

        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertForbidden();
        }

        $this->sebagai($d->admin)->getJson('/api/v1/materi/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/materi/abc')->assertNotFound();
    }

    // ------------------------------------------------------------- buat + upload

    public function test_guru_pengampu_membuat_materi_dengan_file(): void
    {
        $d = $this->buatDunia();

        $r = $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => '  Bab 2: Fungsi  ', 'file' => $this->pdf()], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.judul', 'Bab 2: Fungsi')
            ->assertJsonPath('data.id_mapel', $d->mapelA->id_mapel)
            ->assertJsonPath('data.ekstensi', 'pdf')
            ->assertJsonPath('data.tipe', 'application/pdf')
            ->assertJsonMissingPath('data.file');

        $materi = Materi::query()->findOrFail($r->json('data.id_materi'));
        $this->disk()->assertExists($materi->file);
        $this->assertMatchesRegularExpression('#^materi/'.$d->mapelA->id_mapel.'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$#', $materi->file);
    }

    public function test_nama_file_dari_pengguna_tidak_dipercaya(): void
    {
        $d = $this->buatDunia();

        foreach (['../../evil.php', 'shell.php.pdf', 'rahasia ../../../.env', 'NUL\\0.pdf'] as $nama) {
            $r = $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Uji', 'file' => $this->pdf($nama)], ['Accept' => 'application/json'])->assertCreated();
            $path = Materi::query()->findOrFail($r->json('data.id_materi'))->file;

            $this->assertStringNotContainsString('evil', $path);
            $this->assertStringNotContainsString('php', $path);
            $this->assertStringNotContainsString('..', $path);
            $this->assertMatchesRegularExpression('#^materi/\d+/[0-9a-f-]{36}\.pdf$#', $path);
        }
    }

    /** @return array<string, array{0: string, 1: string, 2: string}> */
    public static function jenisDiizinkan(): array
    {
        return [
            'pdf' => ['a.pdf', 'application/pdf', 'pdf'],
            'docx' => ['a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
            'pptx' => ['a.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx'],
            'xlsx' => ['a.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
            'png' => ['a.png', 'image/png', 'png'],
            'jpeg' => ['foto.jpeg', 'image/jpeg', 'jpg'],
            'txt' => ['catatan.txt', 'text/plain', 'txt'],
        ];
    }

    #[DataProvider('jenisDiizinkan')]
    public function test_jenis_file_yang_diizinkan_disimpan_dengan_ekstensi_dari_daftar_putih(string $nama, string $mime, string $ekstensi): void
    {
        $d = $this->buatDunia();

        $r = $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Uji', 'file' => $this->pdf($nama, 10, $mime)], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.ekstensi', $ekstensi);

        $this->assertStringEndsWith('.'.$ekstensi, Materi::query()->findOrFail($r->json('data.id_materi'))->file);
    }

    /** @return array<string, array{0: string, 1: string}> */
    public static function jenisDitolak(): array
    {
        return [
            'exe' => ['virus.exe', 'application/x-msdownload'],
            'php menyamar .pdf' => ['shell.pdf', 'text/x-php'],
            'html menyamar .pdf' => ['halaman.pdf', 'text/html'],
            'svg (bisa memuat skrip)' => ['gambar.svg', 'image/svg+xml'],
            'zip' => ['arsip.zip', 'application/zip'],
            'tak dikenal' => ['data.bin', 'application/octet-stream'],
        ];
    }

    #[DataProvider('jenisDitolak')]
    public function test_jenis_file_tidak_valid_ditolak_dan_tidak_ada_jejak(string $nama, string $mime): void
    {
        $d = $this->buatDunia();
        $sebelum = Materi::query()->count();

        $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Uji', 'file' => $this->pdf($nama, 10, $mime)], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonPath('code', 'validation_error')->assertJsonValidationErrors('file', 'errors');

        $this->assertSame($sebelum, Materi::query()->count());
        $this->assertSame([], $this->semuaFile());
    }

    public function test_batas_ukuran_file(): void
    {
        $d = $this->buatDunia();
        config(['materi.maks_kb' => 100]);

        $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Besar', 'file' => $this->pdf('besar.pdf', 101)], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('file', 'errors');
        $this->assertSame([], $this->semuaFile());

        $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Pas', 'file' => $this->pdf('pas.pdf', 100)], ['Accept' => 'application/json'])->assertCreated();
    }

    public function test_validasi_judul_dan_file_wajib(): void
    {
        $d = $this->buatDunia();

        $kasus = [
            'judul kosong' => [['judul' => '', 'file' => $this->pdf()], 'judul'],
            'judul spasi' => [['judul' => '   ', 'file' => $this->pdf()], 'judul'],
            'judul tanpa' => [['file' => $this->pdf()], 'judul'],
            'judul terlalu panjang' => [['judul' => str_repeat('a', 256), 'file' => $this->pdf()], 'judul'],
            'file tanpa' => [['judul' => 'Uji'], 'file'],
            'file berupa teks' => [['judul' => 'Uji', 'file' => 'bukan-file'], 'file'],
            'file berupa array' => [['judul' => 'Uji', 'file' => ['x']], 'file'],
        ];

        foreach ($kasus as $nama => [$payload, $kolom]) {
            $this->sebagai($d->guruA)->post($this->urlDaftar($d), $payload, ['Accept' => 'application/json'])
                ->assertUnprocessable($nama)->assertJsonValidationErrors($kolom, 'errors');
        }
        $this->assertSame([], $this->semuaFile());
    }

    public function test_upload_gagal_di_php_ditolak_422(): void
    {
        $d = $this->buatDunia();
        $asli = $this->pdf(); // tetap dirujuk agar berkas sementara tidak terhapus
        $rusak = new UploadedFile($asli->getPathname(), 'a.pdf', 'application/pdf', UPLOAD_ERR_INI_SIZE, true);

        $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Uji', 'file' => $rusak], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('file', 'errors');
    }

    public function test_hanya_guru_pengampu_boleh_membuat_materi(): void
    {
        $d = $this->buatDunia();
        $sebelum = Materi::query()->count();

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->post($this->urlDaftar($d), ['judul' => 'Liar', 'file' => $this->pdf()], ['Accept' => 'application/json'])->assertForbidden();
        }

        $this->assertSame($sebelum, Materi::query()->count());
        $this->assertSame([], $this->semuaFile());
    }

    public function test_403_mendahului_422_agar_tidak_membocorkan_aturan_validasi(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->siswa1)->post($this->urlDaftar($d), [], ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_mapel_arsip_menolak_materi_baru(): void
    {
        $d = $this->buatDunia();
        $d->mapelA->forceFill(['diarsipkan_pada' => now()])->save();

        $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Uji', 'file' => $this->pdf()], ['Accept' => 'application/json'])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
        $this->assertSame([], $this->semuaFile());
    }

    public function test_kegagalan_basis_data_setelah_file_tertulis_menghapus_file(): void
    {
        $d = $this->buatDunia();
        Materi::creating(fn () => throw new \RuntimeException('gagal simpan baris'));

        $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Uji', 'file' => $this->pdf()], ['Accept' => 'application/json'])
            ->assertStatus(500);

        $this->assertSame([], $this->semuaFile()); // tidak ada file yatim
    }

    public function test_kegagalan_penyimpanan_menghasilkan_503_tanpa_baris_baru(): void
    {
        $d = $this->buatDunia();
        $sebelum = Materi::query()->count();
        // root disk berupa FILE biasa -> tidak bisa dibuat/ditulis (lintas platform)
        config(['filesystems.disks.rusak' => ['driver' => 'local', 'root' => __FILE__, 'throw' => true], 'materi.disk' => 'rusak']);

        $this->sebagai($d->guruA)->post($this->urlDaftar($d), ['judul' => 'Uji', 'file' => $this->pdf()], ['Accept' => 'application/json'])
            ->assertStatus(503)->assertJsonPath('code', 'storage_failure')
            ->assertJsonMissingPath('trace');

        $this->assertSame($sebelum, Materi::query()->count());
    }

    // ------------------------------------------------------------- ubah judul

    public function test_guru_pengampu_mengubah_judul(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->patchJson('/api/v1/materi/'.$d->materiA->id_materi, ['judul' => ' Judul Baru '])
            ->assertOk()->assertJsonPath('data.judul', 'Judul Baru');
    }

    public function test_ubah_validasi_dan_field_terlarang(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/materi/'.$d->materiA->id_materi;

        $this->sebagai($d->guruA)->patchJson($url, ['judul' => ''])->assertUnprocessable();
        $this->sebagai($d->guruA)->patchJson($url, [])->assertUnprocessable();
        $this->sebagai($d->guruA)->patchJson($url, ['judul' => 'X', 'file' => 'materi/x.pdf'])->assertUnprocessable()->assertJsonValidationErrors('file', 'errors');
        // memindahkan materi ke mapel lain tidak diizinkan
        $this->sebagai($d->guruA)->patchJson($url, ['judul' => 'X', 'id_mapel' => $d->mapelB->id_mapel])->assertUnprocessable()->assertJsonValidationErrors('id_mapel', 'errors');
        $this->assertSame($d->mapelA->id_mapel, $d->materiA->fresh()->id_mapel);
    }

    public function test_pihak_tak_berwenang_tidak_boleh_mengubah(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/materi/'.$d->materiA->id_materi;
        $judul = $d->materiA->judul;

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->patchJson($url, ['judul' => 'Dibajak'])->assertForbidden();
            $this->sebagai($pelaku)->post($url.'/file', ['file' => $this->pdf()], ['Accept' => 'application/json'])->assertForbidden();
        }
        $this->assertSame($judul, $d->materiA->fresh()->judul);
        $this->assertSame([], $this->semuaFile());
    }

    public function test_mapel_arsip_menolak_perubahan_materi(): void
    {
        $d = $this->buatDunia();
        $d->mapelA->forceFill(['diarsipkan_pada' => now()])->save();

        $this->sebagai($d->guruA)->patchJson('/api/v1/materi/'.$d->materiA->id_materi, ['judul' => 'Baru'])
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');
    }

    // ------------------------------------------------------------- ganti file

    public function test_ganti_file_menyimpan_yang_baru_dan_menghapus_yang_lama(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d);
        $lama = $materi->file;

        $this->sebagai($d->guruA)->post('/api/v1/materi/'.$materi->id_materi.'/file', ['file' => $this->pdf('baru.png', 10, 'image/png')], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.ekstensi', 'png')->assertJsonMissingPath('data.file');

        $baru = $materi->fresh()->file;
        $this->assertNotSame($lama, $baru);
        $this->disk()->assertMissing($lama);
        $this->disk()->assertExists($baru);
    }

    public function test_ganti_file_tidak_valid_menjaga_file_lama(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d);
        $lama = $materi->file;

        $this->sebagai($d->guruA)->post('/api/v1/materi/'.$materi->id_materi.'/file', ['file' => $this->pdf('x.exe', 10, 'application/x-msdownload')], ['Accept' => 'application/json'])
            ->assertUnprocessable();
        $this->sebagai($d->guruA)->post('/api/v1/materi/'.$materi->id_materi.'/file', [], ['Accept' => 'application/json'])->assertUnprocessable();

        $this->assertSame($lama, $materi->fresh()->file);
        $this->disk()->assertExists($lama);
        $this->assertSame([$lama], $this->semuaFile());
    }

    public function test_ganti_file_gagal_menyimpan_menjaga_data_lama(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d);
        $lama = $materi->file;
        config(['filesystems.disks.rusak' => ['driver' => 'local', 'root' => __FILE__, 'throw' => true], 'materi.disk' => 'rusak']);

        $this->sebagai($d->guruA)->post('/api/v1/materi/'.$materi->id_materi.'/file', ['file' => $this->pdf()], ['Accept' => 'application/json'])
            ->assertStatus(503)->assertJsonPath('code', 'storage_failure');

        $this->assertSame($lama, $materi->fresh()->file);
    }

    // ------------------------------------------------------------- hapus

    public function test_guru_pengampu_menghapus_materi_beserta_file(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d);

        $this->sebagai($d->guruA)->deleteJson('/api/v1/materi/'.$materi->id_materi)->assertNoContent();

        $this->assertDatabaseMissing('materi', ['id_materi' => $materi->id_materi]);
        $this->disk()->assertMissing($materi->file);
        $this->sebagai($d->guruA)->deleteJson('/api/v1/materi/'.$materi->id_materi)->assertNotFound();
    }

    public function test_pihak_tak_berwenang_tidak_boleh_menghapus(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d);

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->deleteJson('/api/v1/materi/'.$materi->id_materi)->assertForbidden();
        }

        $this->assertDatabaseHas('materi', ['id_materi' => $materi->id_materi]);
        $this->disk()->assertExists($materi->file);
    }

    public function test_hapus_tetap_berhasil_bila_file_sudah_hilang(): void
    {
        $d = $this->buatDunia(); // file materiA memang tidak ada di disk

        $this->sebagai($d->guruA)->deleteJson('/api/v1/materi/'.$d->materiA->id_materi)->assertNoContent();
        $this->assertDatabaseMissing('materi', ['id_materi' => $d->materiA->id_materi]);
    }

    public function test_kegagalan_hapus_file_hanya_dicatat_dan_baris_tetap_terhapus(): void
    {
        $d = $this->buatDunia();
        Log::spy();
        config(['filesystems.disks.rusak' => ['driver' => 'local', 'root' => __FILE__, 'throw' => true], 'materi.disk' => 'rusak']);

        $this->sebagai($d->guruA)->deleteJson('/api/v1/materi/'.$d->materiA->id_materi)->assertNoContent();

        $this->assertDatabaseMissing('materi', ['id_materi' => $d->materiA->id_materi]);
        Log::shouldHaveReceived('warning')->atLeast()->once();
    }

    public function test_foreign_key_mencegah_hapus_mapel_yang_masih_punya_materi(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        $d->mapelA->delete();
    }

    // ------------------------------------------------------------- unduh

    public function test_unduh_oleh_yang_berhak_dengan_header_aman(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d, '%PDF-1.4 isi rahasia kelas');

        foreach ([$d->guruA, $d->siswa1, $d->admin] as $pelaku) {
            $r = $this->sebagai($pelaku)->get('/api/v1/materi/'.$materi->id_materi.'/file')->assertOk()
                ->assertHeader('Content-Type', 'application/pdf')
                ->assertHeader('X-Content-Type-Options', 'nosniff');

            $this->assertStringContainsString('attachment', $r->headers->get('Content-Disposition'));
            $this->assertStringContainsString('bab-1-pengantar.pdf', $r->headers->get('Content-Disposition'));
            $this->assertStringContainsString('no-store', $r->headers->get('Cache-Control'));
            $this->assertSame('%PDF-1.4 isi rahasia kelas', $r->streamedContent());
        }
    }

    public function test_unduh_ditolak_untuk_yang_tidak_berhak(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d);

        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson('/api/v1/materi/'.$materi->id_materi.'/file')->assertForbidden();
        }

        $nonaktif = Pengguna::factory()->nonaktif()->create();
        $this->sebagai($nonaktif)->getJson('/api/v1/materi/'.$materi->id_materi.'/file')->assertUnauthorized();
    }

    public function test_siswa_yang_dikeluarkan_dari_kelas_kehilangan_akses_unduh(): void
    {
        $d = $this->buatDunia();
        $materi = $this->materiDenganFile($d);

        $this->sebagai($d->siswa1)->get('/api/v1/materi/'.$materi->id_materi.'/file')->assertOk();

        $d->kelasA->siswa()->detach($d->siswa1->id_pengguna);

        $this->sebagai($d->siswa1)->getJson('/api/v1/materi/'.$materi->id_materi.'/file')->assertForbidden();
    }

    public function test_unduh_file_hilang_404_json_bukan_500(): void
    {
        $d = $this->buatDunia(); // materiA menunjuk file yang tidak ada

        $this->sebagai($d->guruA)->getJson('/api/v1/materi/'.$d->materiA->id_materi.'/file')
            ->assertNotFound()->assertJsonPath('code', 'not_found');
    }

    public function test_path_di_luar_direktori_materi_tidak_pernah_dilayani(): void
    {
        $d = $this->buatDunia();
        $this->disk()->put('rahasia/env.txt', 'APP_KEY=rahasia');
        $materi = Materi::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'file' => 'materi/../rahasia/env.txt']);
        $lain = Materi::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'file' => 'rahasia/env.txt']);

        foreach ([$materi, $lain] as $m) {
            $this->sebagai($d->guruA)->getJson('/api/v1/materi/'.$m->id_materi.'/file')->assertNotFound();
        }
    }
}
