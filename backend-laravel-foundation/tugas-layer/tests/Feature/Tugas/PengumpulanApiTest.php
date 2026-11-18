<?php

namespace Tests\Feature\Tugas;

use App\Enums\StatusPengumpulan;
use App\Models\PengumpulanTugas;
use App\Models\Pengguna;
use App\Models\Tugas;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class PengumpulanApiTest extends DatabaseTestCase
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

    private function berkas(string $nama = 'jawaban.pdf', int $kb = 50, string $mime = 'application/pdf'): UploadedFile
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

    private function url(Tugas $t, string $akhir = ''): string
    {
        return '/api/v1/tugas/'.$t->id_tugas.'/pengumpulan'.$akhir;
    }

    private function kirim(Pengguna $siswa, Tugas $t, ?UploadedFile $file = null, array $extra = [], string $akhir = '')
    {
        return $this->sebagai($siswa)->post($this->url($t, $akhir), $extra + ['file' => $file ?? $this->berkas()], self::JSON);
    }

    /** Pengumpulan yang sudah ada (baris + file nyata di disk). */
    private function sudahMengumpulkan(Pengguna $siswa, Tugas $t, string $isi = 'jawaban lama', array $ubah = []): PengumpulanTugas
    {
        $path = 'tugas/jawaban/'.$t->id_tugas.'/lama-'.uniqid().'.pdf';
        $this->disk()->put($path, $isi);

        return PengumpulanTugas::factory()->create($ubah + ['id_siswa' => $siswa->id_pengguna, 'id_tugas' => $t->id_tugas, 'jawaban_file' => $path]);
    }

    private function rusakkanDisk(): void
    {
        config(['filesystems.disks.rusak' => ['driver' => 'local', 'root' => __FILE__, 'throw' => true], 'tugas.disk' => 'rusak']);
    }

    // ------------------------------------------------------------- autentikasi

    public function test_tanpa_login_401_di_semua_endpoint(): void
    {
        foreach ([['GET', '/api/v1/tugas/1/pengumpulan'], ['POST', '/api/v1/tugas/1/pengumpulan'], ['POST', '/api/v1/tugas/1/pengumpulan/revisi'],
            ['GET', '/api/v1/tugas/1/pengumpulan/saya'], ['GET', '/api/v1/pengumpulan/saya'], ['GET', '/api/v1/pengumpulan/1'], ['GET', '/api/v1/pengumpulan/1/file']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    // ------------------------------------------------------------- pengumpulan valid

    public function test_siswa_mengumpulkan_jawaban_dan_server_menentukan_status_waktu_dan_pemilik(): void
    {
        $d = $this->buatDunia();
        $sekarang = now()->startOfSecond();
        $this->travelTo($sekarang);
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $sekarang->copy()->addDays(2)]);

        // id_siswa / status / waktu_kumpul dari klien harus diabaikan
        $r = $this->kirim($d->siswa1, $tugas, null, ['id_siswa' => $d->siswa2->id_pengguna, 'status' => 'dinilai', 'waktu_kumpul' => '2020-01-01T00:00:00+00:00'])
            ->assertCreated()
            ->assertJsonPath('data.id_siswa', $d->siswa1->id_pengguna)
            ->assertJsonPath('data.id_tugas', $tugas->id_tugas)
            ->assertJsonPath('data.status', 'dikumpulkan')
            ->assertJsonPath('data.terlambat', false)
            ->assertJsonMissingPath('data.jawaban_file');

        $this->assertSame($sekarang->timestamp, Carbon::parse($r->json('data.waktu_kumpul'))->timestamp);

        $p = PengumpulanTugas::query()->findOrFail($r->json('data.id_pengumpulan'));
        $this->assertSame($d->siswa1->id_pengguna, (int) $p->id_siswa);
        $this->assertSame(StatusPengumpulan::Dikumpulkan, $p->status);
        $this->disk()->assertExists($p->jawaban_file);
        $this->assertMatchesRegularExpression('#^tugas/jawaban/'.$tugas->id_tugas.'/[0-9a-f-]{36}\.pdf$#', $p->jawaban_file);
        $this->assertStringNotContainsString($p->jawaban_file, $r->getContent());
    }

    public function test_nama_file_dari_siswa_tidak_dipercaya(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);

        $r = $this->kirim($d->siswa1, $tugas, $this->berkas('../../../.env.php.pdf'))->assertCreated();

        $path = PengumpulanTugas::query()->findOrFail($r->json('data.id_pengumpulan'))->jawaban_file;
        $this->assertMatchesRegularExpression('#^tugas/jawaban/\d+/[0-9a-f-]{36}\.pdf$#', $path);
        $this->assertStringNotContainsString('env', $path);
    }

    public function test_siswa_dapat_mengumpulkan_pada_beberapa_tugas_berbeda(): void
    {
        $d = $this->buatDunia();

        $this->kirim($d->siswa1, $this->tugasBaru($d))->assertCreated();
        $this->kirim($d->siswa1, $this->tugasBaru($d))->assertCreated();
        $this->assertSame(3, PengumpulanTugas::query()->where('id_siswa', $d->siswa1->id_pengguna)->count()); // + pengumpulanA
    }

    // ------------------------------------------------------------- kelas/mapel tidak diikuti

    public function test_siswa_yang_tidak_mengikuti_mapel_tidak_boleh_mengumpulkan(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);

        $this->kirim($d->siswa2, $tugas)->assertForbidden()->assertJsonPath('code', 'forbidden');
        $this->kirim($d->siswa2, $tugas, null, [], '/revisi')->assertForbidden();

        $this->assertSame(0, PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->count());
        $this->assertSame([], $this->semuaFile());
    }

    public function test_siswa_yang_dikeluarkan_dari_kelas_tidak_boleh_mengumpulkan(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $d->kelasA->siswa()->detach($d->siswa1->id_pengguna);

        $this->kirim($d->siswa1, $tugas)->assertForbidden();
        $this->assertSame(0, PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->count());
    }

    public function test_guru_dan_admin_tidak_boleh_mengumpulkan_dan_403_mendahului_422(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);

        foreach ([$d->guruA, $d->guruB, $d->admin] as $pelaku) {
            $this->kirim($pelaku, $tugas)->assertForbidden();
        }
        $this->sebagai($d->siswa2)->post($this->url($tugas), [], self::JSON)->assertForbidden();
        $this->assertSame([], $this->semuaFile());
    }

    public function test_akun_siswa_nonaktif_ditolak_401(): void
    {
        $d = $this->buatDunia();
        $d->siswa1->forceFill(['nonaktif_pada' => now()])->save();

        $this->kirim($d->siswa1->fresh(), $this->tugasBaru($d))->assertUnauthorized();
    }

    public function test_mapel_arsip_menolak_pengumpulan(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $d->mapelA->forceFill(['diarsipkan_pada' => now()])->save();

        $this->kirim($d->siswa1, $tugas)->assertStatus(409)->assertJsonPath('code', 'subject_archived');
    }

    // ------------------------------------------------------------- tenggat

    public function test_pengumpulan_tepat_di_batas_waktu_diterima(): void
    {
        $d = $this->buatDunia();
        $batas = now()->addDay()->startOfSecond();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $batas]);

        $this->travelTo($batas);
        $this->kirim($d->siswa1, $tugas)->assertCreated()->assertJsonPath('data.status', 'dikumpulkan');
    }

    public function test_pengumpulan_setelah_batas_waktu_ditolak_tanpa_jejak(): void
    {
        $d = $this->buatDunia();
        $batas = now()->addDay()->startOfSecond();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $batas]);

        $this->travelTo($batas->copy()->addSecond());
        $this->kirim($d->siswa1, $tugas)->assertStatus(409)->assertJsonPath('code', 'deadline_passed');

        $this->assertSame(0, PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->count());
        $this->assertSame([], $this->semuaFile());
    }

    public function test_tugas_yang_sudah_lewat_batas_tidak_menerima_pengumpulan(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $this->kemarin(2)]);

        $this->kirim($d->siswa1, $tugas)->assertStatus(409)->assertJsonPath('code', 'deadline_passed');
    }

    public function test_toleransi_keterlambatan_menghasilkan_status_terlambat_lalu_ditolak(): void
    {
        $d = $this->buatDunia();
        config(['tugas.toleransi_terlambat_jam' => 2]);
        $batas = now()->addDay()->startOfSecond();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $batas]);

        $this->travelTo($batas->copy()->addHour());
        $r = $this->kirim($d->siswa1, $tugas)->assertCreated()
            ->assertJsonPath('data.status', 'terlambat')->assertJsonPath('data.terlambat', true);
        $this->assertSame(StatusPengumpulan::Terlambat, PengumpulanTugas::query()->findOrFail($r->json('data.id_pengumpulan'))->status);

        // tepat di akhir masa toleransi masih diterima; sesudahnya ditolak
        $d->siswa2->kelas()->attach($d->kelasA->id_kelas);
        $this->travelTo($batas->copy()->addHours(2));
        $this->kirim($d->siswa2, $tugas)->assertCreated()->assertJsonPath('data.status', 'terlambat');

        $lain = Pengguna::factory()->create();
        $d->kelasA->siswa()->attach($lain->id_pengguna);
        $this->travelTo($batas->copy()->addHours(2)->addSecond());
        $this->kirim($lain, $tugas)->assertStatus(409)->assertJsonPath('code', 'deadline_passed');
    }

    public function test_status_dan_waktu_kumpul_selalu_konsisten_dengan_batas_waktu(): void
    {
        $d = $this->buatDunia();
        config(['tugas.toleransi_terlambat_jam' => 3]);
        $batas = now()->addDay()->startOfSecond();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $batas]);

        foreach ([-30, -1, 0, 1, 60, 179] as $menit) {
            $siswa = Pengguna::factory()->create();
            $d->kelasA->siswa()->attach($siswa->id_pengguna);
            $this->travelTo($batas->copy()->addMinutes($menit));
            $this->kirim($siswa, $tugas)->assertCreated();
        }

        $semua = PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->get();
        $this->assertCount(6, $semua);
        foreach ($semua as $p) {
            $this->assertSame($p->waktu_kumpul->greaterThan($batas) ? StatusPengumpulan::Terlambat : StatusPengumpulan::Dikumpulkan, $p->status);
            $this->assertNotSame(StatusPengumpulan::Dinilai, $p->status); // "dinilai" hanya diberikan oleh proses penilaian
        }
    }

    // ------------------------------------------------------------- keanggotaan ganda

    public function test_pengumpulan_ganda_ditolak_409_dan_jawaban_asli_utuh(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $asli = $this->sudahMengumpulkan($d->siswa1, $tugas);

        $this->kirim($d->siswa1, $tugas)->assertStatus(409)->assertJsonPath('code', 'already_submitted');

        $this->assertSame($asli->jawaban_file, $asli->fresh()->jawaban_file);
        $this->assertSame([$asli->jawaban_file], $this->semuaFile());
        $this->assertSame(1, PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->count());
    }

    public function test_unique_siswa_tugas_dijaga_database(): void
    {
        $d = $this->buatDunia();

        $this->expectException(UniqueConstraintViolationException::class);
        DB::table('pengumpulan_tugas')->insert([
            'id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $d->tugasA->id_tugas, 'jawaban_file' => 'tugas/jawaban/x.pdf',
            'status' => 'dikumpulkan', 'waktu_kumpul' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    // ------------------------------------------------------------- file tidak valid

    /** @return array<string, array{0: string, 1: string}> */
    public static function jawabanDitolak(): array
    {
        return [
            'exe' => ['virus.exe', 'application/x-msdownload'],
            'php menyamar .pdf' => ['jawaban.pdf', 'text/x-php'],
            'html menyamar .pdf' => ['jawaban.pdf', 'text/html'],
            'svg' => ['gambar.svg', 'image/svg+xml'],
            'zip' => ['arsip.zip', 'application/zip'],
            'tak dikenal' => ['data.bin', 'application/octet-stream'],
        ];
    }

    #[DataProvider('jawabanDitolak')]
    public function test_file_jawaban_tidak_valid_ditolak_tanpa_jejak(string $nama, string $mime): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);

        $this->kirim($d->siswa1, $tugas, $this->berkas($nama, 10, $mime))
            ->assertUnprocessable()->assertJsonPath('code', 'validation_error')->assertJsonValidationErrors('file', 'errors');

        $this->assertSame(0, PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->count());
        $this->assertSame([], $this->semuaFile());
    }

    public function test_file_jawaban_wajib_dan_dibatasi_ukurannya(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        config(['tugas.maks_kb_jawaban' => 100]);

        $this->sebagai($d->siswa1)->post($this->url($tugas), [], self::JSON)->assertUnprocessable()->assertJsonValidationErrors('file', 'errors');
        $this->sebagai($d->siswa1)->post($this->url($tugas), ['file' => 'bukan-file'], self::JSON)->assertUnprocessable();
        $this->kirim($d->siswa1, $tugas, $this->berkas('besar.pdf', 101))->assertUnprocessable();
        $this->assertSame([], $this->semuaFile());

        $this->kirim($d->siswa1, $tugas, $this->berkas('pas.pdf', 100))->assertCreated();
    }

    public function test_kegagalan_penyimpanan_503_tanpa_baris_baru(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $this->rusakkanDisk();

        $this->kirim($d->siswa1, $tugas)->assertStatus(503)->assertJsonPath('code', 'storage_failure');
        $this->assertSame(0, PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->count());
    }

    public function test_kegagalan_basis_data_setelah_file_tertulis_menghapus_file(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        PengumpulanTugas::creating(fn () => throw new \RuntimeException('gagal simpan baris'));

        $this->kirim($d->siswa1, $tugas)->assertStatus(500);

        $this->assertSame([], $this->semuaFile());
    }

    // ------------------------------------------------------------- revisi

    public function test_revisi_sebelum_batas_mengganti_file_waktu_dan_menghapus_file_lama(): void
    {
        $d = $this->buatDunia();
        $t0 = now()->startOfSecond();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $t0->copy()->addDays(3)]);

        $this->travelTo($t0);
        $id = $this->kirim($d->siswa1, $tugas)->assertCreated()->json('data.id_pengumpulan');
        $lama = PengumpulanTugas::query()->findOrFail($id)->jawaban_file;

        $this->travelTo($t0->copy()->addDay());
        $this->kirim($d->siswa1, $tugas, $this->berkas('revisi.png', 10, 'image/png'), [], '/revisi')
            ->assertOk()->assertJsonPath('data.id_pengumpulan', $id)->assertJsonPath('data.status', 'dikumpulkan');

        $p = PengumpulanTugas::query()->findOrFail($id);
        $this->assertNotSame($lama, $p->jawaban_file);
        $this->assertStringEndsWith('.png', $p->jawaban_file);
        $this->assertSame($t0->copy()->addDay()->timestamp, $p->waktu_kumpul->timestamp);
        $this->disk()->assertMissing($lama);
        $this->disk()->assertExists($p->jawaban_file);
        $this->assertSame(1, PengumpulanTugas::query()->where('id_tugas', $tugas->id_tugas)->count()); // diperbarui, bukan baris baru
    }

    public function test_revisi_dalam_masa_toleransi_menghitung_ulang_status_menjadi_terlambat(): void
    {
        $d = $this->buatDunia();
        config(['tugas.toleransi_terlambat_jam' => 3]);
        $batas = now()->addDay()->startOfSecond();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $batas]);

        $this->travelTo($batas->copy()->subHour());
        $this->kirim($d->siswa1, $tugas)->assertCreated()->assertJsonPath('data.status', 'dikumpulkan');

        $this->travelTo($batas->copy()->addHour());
        $this->kirim($d->siswa1, $tugas, null, [], '/revisi')->assertOk()->assertJsonPath('data.status', 'terlambat');
    }

    public function test_revisi_setelah_batas_ditolak_dan_jawaban_lama_utuh(): void
    {
        $d = $this->buatDunia();
        $batas = now()->addDay()->startOfSecond();
        $tugas = $this->tugasBaru($d, ['batas_waktu' => $batas]);
        $asli = $this->sudahMengumpulkan($d->siswa1, $tugas);

        $this->travelTo($batas->copy()->addSecond());
        $this->kirim($d->siswa1, $tugas, null, [], '/revisi')->assertStatus(409)->assertJsonPath('code', 'deadline_passed');

        $this->assertSame($asli->jawaban_file, $asli->fresh()->jawaban_file);
        $this->assertSame([$asli->jawaban_file], $this->semuaFile());
    }

    public function test_revisi_tanpa_pengumpulan_sebelumnya_404(): void
    {
        $d = $this->buatDunia();

        $this->kirim($d->siswa1, $this->tugasBaru($d), null, [], '/revisi')->assertNotFound();
        $this->assertSame([], $this->semuaFile());
    }

    public function test_pengumpulan_yang_sudah_dinilai_terkunci(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $p = $this->sudahMengumpulkan($d->siswa1, $tugas, 'dinilai', ['status' => StatusPengumpulan::Dinilai]);

        $this->kirim($d->siswa1, $tugas, null, [], '/revisi')->assertStatus(409)->assertJsonPath('code', 'already_graded');
        $this->assertSame($p->jawaban_file, $p->fresh()->jawaban_file);

        // pengumpulanA sudah memiliki baris nilai (nilaiTugasA) -> juga terkunci walau statusnya belum "dinilai"
        $this->kirim($d->siswa1, $d->tugasA, null, [], '/revisi')->assertStatus(409)->assertJsonPath('code', 'already_graded');
    }

    public function test_revisi_file_tidak_valid_atau_penyimpanan_gagal_menjaga_jawaban_lama(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $asli = $this->sudahMengumpulkan($d->siswa1, $tugas);

        $this->kirim($d->siswa1, $tugas, $this->berkas('x.exe', 10, 'application/x-msdownload'), [], '/revisi')->assertUnprocessable();
        $this->sebagai($d->siswa1)->post($this->url($tugas, '/revisi'), [], self::JSON)->assertUnprocessable();
        $this->assertSame([$asli->jawaban_file], $this->semuaFile());

        $this->rusakkanDisk();
        $this->kirim($d->siswa1, $tugas, null, [], '/revisi')->assertStatus(503)->assertJsonPath('code', 'storage_failure');
        $this->assertSame($asli->jawaban_file, $asli->fresh()->jawaban_file);
    }

    public function test_siswa_tidak_dapat_merevisi_jawaban_siswa_lain(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $d->siswa2->kelas()->attach($d->kelasA->id_kelas);
        $punya1 = $this->sudahMengumpulkan($d->siswa1, $tugas);

        // siswa2 (anggota kelas) tidak punya pengumpulan sendiri -> 404, jawaban siswa1 tidak tersentuh
        $this->kirim($d->siswa2, $tugas, null, [], '/revisi')->assertNotFound();
        $this->assertSame($punya1->jawaban_file, $punya1->fresh()->jawaban_file);
    }

    // ------------------------------------------------------------- status milik sendiri

    public function test_siswa_melihat_status_pengumpulan_miliknya(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);

        $this->sebagai($d->siswa1)->getJson($this->url($tugas, '/saya'))->assertNotFound();

        $p = $this->sudahMengumpulkan($d->siswa1, $tugas);
        $this->sebagai($d->siswa1)->getJson($this->url($tugas, '/saya'))->assertOk()
            ->assertJsonPath('data.id_pengumpulan', $p->id_pengumpulan)->assertJsonPath('data.status', 'dikumpulkan')
            ->assertJsonPath('data.tugas.id_tugas', $tugas->id_tugas)->assertJsonMissingPath('data.jawaban_file');
    }

    public function test_status_saya_hanya_untuk_siswa_yang_berhak(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->getJson($this->url($d->tugasA, '/saya'))->assertForbidden();
        $this->sebagai($d->admin)->getJson($this->url($d->tugasA, '/saya'))->assertForbidden();
        $this->sebagai($d->siswa2)->getJson($this->url($d->tugasA, '/saya'))->assertForbidden(); // mapel tidak diikuti
    }

    public function test_daftar_pengumpulan_milik_sendiri_dengan_filter_dan_pagination(): void
    {
        $d = $this->buatDunia();
        $a = $this->sudahMengumpulkan($d->siswa1, $this->tugasBaru($d));
        $b = $this->sudahMengumpulkan($d->siswa1, $this->tugasBaru($d), 'x', ['status' => StatusPengumpulan::Terlambat]);
        $this->sudahMengumpulkan($d->siswa2, $this->tugasBaru($d, ['id_mapel' => $d->mapelB->id_mapel])); // milik siswa lain

        $semua = $this->sebagai($d->siswa1)->getJson('/api/v1/pengumpulan/saya?per_page=100')->assertOk();
        $ids = array_column($semua->json('data'), 'id_pengumpulan');
        $this->assertEqualsCanonicalizing([$d->pengumpulanA->id_pengumpulan, $a->id_pengumpulan, $b->id_pengumpulan], $ids);

        $this->sebagai($d->siswa1)->getJson('/api/v1/pengumpulan/saya?status=terlambat')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id_pengumpulan', $b->id_pengumpulan);
        $this->sebagai($d->siswa1)->getJson('/api/v1/pengumpulan/saya?per_page=2&page=2')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 3);
        $this->sebagai($d->siswa1)->getJson('/api/v1/pengumpulan/saya?status=hapus')->assertUnprocessable();
    }

    public function test_daftar_milik_sendiri_hanya_untuk_siswa(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->guruA)->getJson('/api/v1/pengumpulan/saya')->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/pengumpulan/saya')->assertForbidden();
    }

    // ------------------------------------------------------------- guru melihat pengumpulan

    public function test_guru_pengampu_dan_admin_melihat_daftar_pengumpulan_tugas(): void
    {
        $d = $this->buatDunia();
        $d->siswa2->kelas()->attach($d->kelasA->id_kelas);
        $kedua = $this->sudahMengumpulkan($d->siswa2, $d->tugasA);

        foreach ([$d->guruA, $d->admin] as $pelaku) {
            $r = $this->sebagai($pelaku)->getJson($this->url($d->tugasA))->assertOk()
                ->assertJsonStructure(['data' => [['id_pengumpulan', 'status', 'waktu_kumpul', 'url_file', 'siswa' => ['id_pengguna', 'nisn', 'username']]], 'links', 'meta'])
                ->assertJsonMissingPath('data.0.jawaban_file');
            $this->assertEqualsCanonicalizing([$d->pengumpulanA->id_pengumpulan, $kedua->id_pengumpulan], array_column($r->json('data'), 'id_pengumpulan'));
            $this->assertStringNotContainsString($kedua->jawaban_file, $r->getContent());
        }
    }

    public function test_daftar_pengumpulan_ditolak_untuk_pihak_lain_termasuk_pemilik(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->siswa2] as $pelaku) {
            $this->sebagai($pelaku)->getJson($this->url($d->tugasA))->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/tugas/999999/pengumpulan')->assertNotFound();
    }

    public function test_daftar_pengumpulan_pencarian_filter_pagination_dan_urutan(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d);
        $nama = ['andi', 'budi', 'citra', 'dedi'];
        foreach ($nama as $i => $n) {
            $s = Pengguna::factory()->create(['username' => 'kls.'.$n]);
            $this->sudahMengumpulkan($s, $tugas, 'x', ['status' => $i === 3 ? StatusPengumpulan::Terlambat : StatusPengumpulan::Dikumpulkan, 'waktu_kumpul' => now()->addMinutes($i)]);
        }
        $url = $this->url($tugas);

        $this->sebagai($d->guruA)->getJson($url.'?cari=BUD')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.siswa.username', 'kls.budi');
        $this->sebagai($d->guruA)->getJson($url.'?status=terlambat')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.siswa.username', 'kls.dedi');
        $this->sebagai($d->guruA)->getJson($url.'?per_page=3&page=2')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 4);

        $waktu = array_column($this->sebagai($d->guruA)->getJson($url.'?urut=waktu_kumpul&arah=desc')->json('data'), 'waktu_kumpul');
        $urut = $waktu;
        rsort($urut);
        $this->assertSame($urut, $waktu);

        foreach (['status=hapus', 'urut=jawaban_file', 'per_page=101'] as $q) {
            $this->sebagai($d->guruA)->getJson($url.'?'.$q)->assertUnprocessable();
        }
    }

    // ------------------------------------------------------------- akses jawaban siswa lain

    public function test_detail_pengumpulan_hanya_untuk_pemilik_guru_pengampu_dan_admin(): void
    {
        $d = $this->buatDunia();
        $d->siswa2->kelas()->attach($d->kelasA->id_kelas); // teman sekelas
        $url = '/api/v1/pengumpulan/'.$d->pengumpulanA->id_pengumpulan;

        foreach ([$d->siswa1, $d->guruA, $d->admin] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertOk()
                ->assertJsonPath('data.id_siswa', $d->siswa1->id_pengguna)->assertJsonMissingPath('data.jawaban_file');
        }
        foreach ([$d->siswa2 /* teman sekelas */, $d->guruB, $d->guruC] as $pelaku) {
            $this->sebagai($pelaku)->getJson($url)->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/pengumpulan/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/pengumpulan/abc')->assertNotFound();
    }

    public function test_unduh_jawaban_oleh_yang_berhak_dengan_header_aman(): void
    {
        $d = $this->buatDunia();
        $tugas = $this->tugasBaru($d, ['judul' => 'Latihan Bab 3']);
        $p = $this->sudahMengumpulkan($d->siswa1, $tugas, '%PDF-1.4 jawaban pribadi');
        $url = '/api/v1/pengumpulan/'.$p->id_pengumpulan.'/file';

        foreach ([$d->siswa1, $d->guruA, $d->admin] as $pelaku) {
            $r = $this->sebagai($pelaku)->get($url)->assertOk()
                ->assertHeader('Content-Type', 'application/pdf')->assertHeader('X-Content-Type-Options', 'nosniff');
            $this->assertStringContainsString('attachment', $r->headers->get('Content-Disposition'));
            $this->assertStringContainsString('jawaban-latihan-bab-3-'.$p->id_pengumpulan.'.pdf', $r->headers->get('Content-Disposition'));
            $this->assertStringContainsString('no-store', $r->headers->get('Cache-Control'));
            $this->assertSame('%PDF-1.4 jawaban pribadi', $r->streamedContent());
        }
    }

    public function test_siswa_lain_dan_guru_mapel_lain_tidak_dapat_mengunduh_jawaban(): void
    {
        $d = $this->buatDunia();
        $d->siswa2->kelas()->attach($d->kelasA->id_kelas);
        $p = $this->sudahMengumpulkan($d->siswa1, $this->tugasBaru($d));

        foreach ([$d->siswa2, $d->guruB, $d->guruC] as $pelaku) {
            $this->sebagai($pelaku)->getJson('/api/v1/pengumpulan/'.$p->id_pengumpulan.'/file')->assertForbidden();
        }
    }

    public function test_unduh_file_hilang_atau_path_di_luar_direktori_404(): void
    {
        $d = $this->buatDunia();
        $this->disk()->put('rahasia/env.txt', 'APP_KEY=rahasia');
        $hilang = PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $this->tugasBaru($d)->id_tugas, 'jawaban_file' => 'tugas/jawaban/1/tidak-ada.pdf']);
        $liar = PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $this->tugasBaru($d)->id_tugas, 'jawaban_file' => 'tugas/../rahasia/env.txt']);
        $luar = PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $this->tugasBaru($d)->id_tugas, 'jawaban_file' => 'rahasia/env.txt']);

        foreach ([$hilang, $liar, $luar] as $p) {
            $this->sebagai($d->guruA)->getJson('/api/v1/pengumpulan/'.$p->id_pengumpulan.'/file')->assertNotFound()->assertJsonPath('code', 'not_found');
        }
    }

    public function test_disk_tugas_bukan_disk_publik(): void
    {
        $disk = (string) config('tugas.disk');
        $konf = config('filesystems.disks.'.$disk);

        $this->assertNotSame('public', $disk);
        $this->assertNotSame('public', $konf['visibility'] ?? 'private');
        $this->assertStringNotContainsString(str_replace('\\', '/', public_path()), str_replace('\\', '/', (string) ($konf['root'] ?? '')));
    }
}
