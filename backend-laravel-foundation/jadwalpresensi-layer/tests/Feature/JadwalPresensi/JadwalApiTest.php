<?php

namespace Tests\Feature\JadwalPresensi;

use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\Presensi;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class JadwalApiTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    /** Waktu UTC relatif: $hari ke depan pada jam:menit. */
    private function waktu(int $hari, int $jam, int $menit = 0): \Illuminate\Support\Carbon
    {
        return now()->utc()->addDays($hari)->setTime($jam, $menit, 0);
    }

    private function iso(int $hari, int $jam, int $menit = 0): string
    {
        return $this->waktu($hari, $jam, $menit)->format('Y-m-d\TH:i:s\Z');
    }

    /** @param array<string, mixed> $ubah */
    private function payload(object $d, array $ubah = []): array
    {
        return $ubah + [
            'id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasA->id_kelas,
            'waktu_mulai' => $this->iso(30, 8), 'waktu_selesai' => $this->iso(30, 9, 30),
        ];
    }

    /** Jadwal tersimpan pada waktu eksplisit (tanpa API). */
    private function buat(object $d, int $hari, int $jam, int $menit = 0, int $durasi = 60, ?int $idKelas = null, ?int $idGuru = null): Jadwal
    {
        $mulai = $this->waktu($hari, $jam, $menit);

        return Jadwal::factory()->create([
            'id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $idKelas ?? $d->kelasA->id_kelas,
            'id_guru' => $idGuru ?? $d->guruA->id_pengguna, 'waktu_mulai' => $mulai, 'waktu_selesai' => $mulai->copy()->addMinutes($durasi),
        ]);
    }

    // ------------------------------------------------------------ autentikasi & peran

    public function test_tanpa_login_401(): void
    {
        foreach ([['GET', '/api/v1/jadwal'], ['POST', '/api/v1/jadwal'], ['GET', '/api/v1/jadwal/1'], ['PATCH', '/api/v1/jadwal/1'],
            ['DELETE', '/api/v1/jadwal/1'], ['GET', '/api/v1/siswa/1/jadwal'], ['GET', '/api/v1/guru/1/jadwal']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    public function test_hanya_admin_mengelola_jadwal_dan_403_mendahului_422(): void
    {
        $d = $this->buatDunia();
        $j = $this->buat($d, 30, 3);

        foreach ([$d->guruA, $d->siswa1] as $pelaku) {
            $this->sebagai($pelaku)->postJson('/api/v1/jadwal', [])->assertForbidden();
            $this->sebagai($pelaku)->postJson('/api/v1/jadwal', $this->payload($d))->assertForbidden();
            $this->sebagai($pelaku)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, ['id_kelas' => $d->kelasB->id_kelas])->assertForbidden();
            $this->sebagai($pelaku)->deleteJson('/api/v1/jadwal/'.$j->id_jadwal)->assertForbidden();
        }
        $this->assertDatabaseHas('jadwal', ['id_jadwal' => $j->id_jadwal, 'id_kelas' => $d->kelasA->id_kelas]);
    }

    // ------------------------------------------------------------ membuat

    public function test_admin_membuat_jadwal_dengan_guru_bawaan_pengampu(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d))
            ->assertCreated()
            ->assertJsonPath('data.id_mapel', $d->mapelA->id_mapel)
            ->assertJsonPath('data.id_kelas', $d->kelasA->id_kelas)
            ->assertJsonPath('data.id_guru', $d->guruA->id_pengguna)
            ->assertJsonPath('data.durasi_menit', 90)
            ->assertJsonPath('data.status', 'akan_datang');

        $this->assertDatabaseHas('jadwal', ['id_kelas' => $d->kelasA->id_kelas, 'id_guru' => $d->guruA->id_pengguna, 'waktu_mulai' => $this->waktu(30, 8)->toDateTimeString()]);
    }

    public function test_admin_dapat_menunjuk_guru_pengganti(): void
    {
        $d = $this->buatDunia();

        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['id_guru' => $d->guruC->id_pengguna]))
            ->assertCreated()->assertJsonPath('data.id_guru', $d->guruC->id_pengguna);
    }

    public function test_waktu_dengan_offset_zona_disimpan_sebagai_instan_yang_sama(): void
    {
        $d = $this->buatDunia();
        $tgl = $this->waktu(31, 0)->setTimezone('Asia/Jakarta');

        $r = $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, [
            'waktu_mulai' => $tgl->copy()->setTime(7, 30)->format('Y-m-d\TH:i:sP'),
            'waktu_selesai' => $tgl->copy()->setTime(9, 0)->format('Y-m-d\TH:i:sP'),
        ]))->assertCreated();

        $this->assertTrue(Jadwal::query()->find($r->json('data.id_jadwal'))->waktu_mulai->equalTo($tgl->copy()->setTime(7, 30)));
    }

    /** @return array<string, array{0: array<string, mixed>, 1: string}> */
    public static function inputBuruk(): array
    {
        return [
            'kosong' => [['id_mapel' => null], 'id_mapel'],
            'mapel tidak ada' => [['id_mapel' => 999999], 'id_mapel'],
            'kelas bukan angka' => [['id_kelas' => 'abc'], 'id_kelas'],
            'guru bukan guru' => [['id_guru' => 1], 'id_guru'],
            'tanpa offset zona' => [['waktu_mulai' => '2099-01-01 08:00:00'], 'waktu_mulai'],
            'format bebas' => [['waktu_mulai' => 'besok pagi'], 'waktu_mulai'],
            'mulai bertipe array' => [['waktu_mulai' => ['x']], 'waktu_mulai'],
        ];
    }

    #[DataProvider('inputBuruk')]
    public function test_validasi_input_pembuatan(array $ubah, string $kolom): void
    {
        $d = $this->buatDunia();
        if ($kolom === 'id_guru') {
            $ubah['id_guru'] = $d->siswa1->id_pengguna;
        }

        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, $ubah))->assertUnprocessable()->assertJsonValidationErrors([$kolom]);
        $this->assertDatabaseMissing('jadwal', ['waktu_mulai' => $this->waktu(30, 8)->toDateTimeString()]);
    }

    public function test_jadwal_tidak_valid_waktu_dan_durasi(): void
    {
        $d = $this->buatDunia();
        $post = fn (array $ubah) => $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, $ubah));

        $post(['waktu_mulai' => now()->utc()->subDay()->format('Y-m-d\TH:i:s\Z'), 'waktu_selesai' => now()->utc()->addHour()->format('Y-m-d\TH:i:s\Z')])
            ->assertUnprocessable()->assertJsonValidationErrors(['waktu_mulai']);
        $post(['waktu_selesai' => $this->iso(30, 8)])->assertUnprocessable()->assertJsonValidationErrors(['waktu_selesai']);   // sama dengan mulai
        $post(['waktu_selesai' => $this->iso(30, 7)])->assertUnprocessable()->assertJsonValidationErrors(['waktu_selesai']);   // sebelum mulai
        $post(['waktu_selesai' => $this->iso(30, 8, 5)])->assertUnprocessable()->assertJsonValidationErrors(['waktu_selesai']); // < durasi minimum
        $post(['waktu_selesai' => $this->iso(30, 20)])->assertUnprocessable()->assertJsonValidationErrors(['waktu_selesai']);   // > durasi maksimum
        $post(['waktu_mulai' => null, 'waktu_selesai' => null])->assertUnprocessable()->assertJsonValidationErrors(['waktu_mulai', 'waktu_selesai']);
    }

    public function test_mapel_atau_kelas_diarsipkan_dan_guru_nonaktif_ditolak(): void
    {
        $d = $this->buatDunia();

        $d->mapelB->forceFill(['diarsipkan_pada' => now()])->save();
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['id_mapel' => $d->mapelB->id_mapel]))
            ->assertStatus(409)->assertJsonPath('code', 'subject_archived');

        $kelas = Kelas::factory()->create();
        $kelas->forceFill(['diarsipkan_pada' => now()])->save();
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['id_kelas' => $kelas->id_kelas]))
            ->assertStatus(409)->assertJsonPath('code', 'class_archived');

        $d->guruC->forceFill(['nonaktif_pada' => now()])->save();
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['id_guru' => $d->guruC->id_pengguna]))
            ->assertUnprocessable()->assertJsonValidationErrors(['id_guru']);
    }

    public function test_bentrok_jadwal_kelas_dan_guru(): void
    {
        $d = $this->buatDunia();
        $this->buat($d, 30, 8, 0, 90); // kelasA, guruA 08:00–09:30

        // tumpang tindih sebagian pada kelas yang sama
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['waktu_mulai' => $this->iso(30, 9), 'waktu_selesai' => $this->iso(30, 10)]))
            ->assertStatus(409)->assertJsonPath('code', 'class_schedule_conflict');
        // dimulai pada waktu yang sama persis
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d))->assertStatus(409);
        // di dalam jadwal yang ada
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['waktu_mulai' => $this->iso(30, 8, 20), 'waktu_selesai' => $this->iso(30, 8, 50)]))
            ->assertStatus(409);
        // guru yang sama pada kelas lain
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['id_kelas' => $d->kelasB->id_kelas, 'waktu_mulai' => $this->iso(30, 9), 'waktu_selesai' => $this->iso(30, 10)]))
            ->assertStatus(409)->assertJsonPath('code', 'teacher_schedule_conflict');
        // berurutan (selesai = mulai berikutnya) diperbolehkan
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['waktu_mulai' => $this->iso(30, 9, 30), 'waktu_selesai' => $this->iso(30, 10, 30)]))
            ->assertCreated();
        // kelas dan guru lain pada jam yang sama diperbolehkan
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', $this->payload($d, ['id_mapel' => $d->mapelB->id_mapel, 'id_kelas' => $d->kelasB->id_kelas]))
            ->assertCreated();
    }

    // ------------------------------------------------------------ mengubah

    public function test_admin_mengubah_jadwal_mendatang_tanpa_bentrok_dengan_dirinya_sendiri(): void
    {
        $d = $this->buatDunia();
        $j = $this->buat($d, 40, 8, 0, 60);

        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, ['waktu_mulai' => $this->iso(40, 8, 30), 'waktu_selesai' => $this->iso(40, 9, 30)])
            ->assertOk()->assertJsonPath('data.durasi_menit', 60);
        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, ['id_kelas' => $d->kelasB->id_kelas])
            ->assertOk()->assertJsonPath('data.id_kelas', $d->kelasB->id_kelas);
        $this->assertSame($d->kelasB->id_kelas, $j->fresh()->id_kelas);
    }

    public function test_pindah_mapel_tanpa_menyebut_guru_mengikuti_guru_mapel_baru(): void
    {
        $d = $this->buatDunia();
        $j = $this->buat($d, 41, 8);

        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, ['id_mapel' => $d->mapelB->id_mapel])
            ->assertOk()->assertJsonPath('data.id_guru', $d->guruB->id_pengguna);
    }

    public function test_perubahan_yang_bentrok_atau_tidak_valid_ditolak(): void
    {
        $d = $this->buatDunia();
        $j = $this->buat($d, 42, 8, 0, 60);
        $this->buat($d, 42, 10, 0, 60);

        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, ['waktu_mulai' => $this->iso(42, 9, 30), 'waktu_selesai' => $this->iso(42, 10, 30)])
            ->assertStatus(409)->assertJsonPath('code', 'class_schedule_conflict');
        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, ['waktu_selesai' => $this->iso(42, 7)])
            ->assertUnprocessable()->assertJsonValidationErrors(['waktu_selesai']);
        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, [])->assertUnprocessable();
        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$j->id_jadwal, ['waktu_mulai' => now()->utc()->subDay()->format('Y-m-d\TH:i:s\Z')])->assertUnprocessable();
        $this->assertTrue($j->fresh()->waktu_mulai->equalTo($this->waktu(42, 8)));
    }

    public function test_jadwal_yang_sudah_dimulai_atau_punya_presensi_terkunci(): void
    {
        $d = $this->buatDunia();

        $lampau = $this->buat($d, -3, 8);
        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$lampau->id_jadwal, ['id_kelas' => $d->kelasB->id_kelas])
            ->assertStatus(409)->assertJsonPath('code', 'schedule_started');
        $this->sebagai($d->admin)->deleteJson('/api/v1/jadwal/'.$lampau->id_jadwal)->assertStatus(409)->assertJsonPath('code', 'schedule_started');

        $depan = $this->buat($d, 43, 8);
        Presensi::factory()->tanpaCheckin()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $depan->id_jadwal]);
        $this->sebagai($d->admin)->patchJson('/api/v1/jadwal/'.$depan->id_jadwal, ['id_kelas' => $d->kelasB->id_kelas])
            ->assertStatus(409)->assertJsonPath('code', 'schedule_has_attendance');
        $this->sebagai($d->admin)->deleteJson('/api/v1/jadwal/'.$depan->id_jadwal)->assertStatus(409)->assertJsonPath('code', 'schedule_has_attendance');
        $this->assertDatabaseHas('jadwal', ['id_jadwal' => $depan->id_jadwal]);
    }

    // ------------------------------------------------------------ menghapus

    public function test_admin_menghapus_jadwal_mendatang_tanpa_presensi(): void
    {
        $d = $this->buatDunia();
        $j = $this->buat($d, 44, 8);

        $this->sebagai($d->admin)->deleteJson('/api/v1/jadwal/'.$j->id_jadwal)->assertNoContent();
        $this->assertDatabaseMissing('jadwal', ['id_jadwal' => $j->id_jadwal]);
        $this->sebagai($d->admin)->deleteJson('/api/v1/jadwal/'.$j->id_jadwal)->assertNotFound();
        $this->sebagai($d->admin)->deleteJson('/api/v1/jadwal/abc')->assertNotFound();
    }

    // ------------------------------------------------------------ membaca & filter

    public function test_detail_sesuai_hak_akses(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/jadwal/'.$d->jadwalA->id_jadwal;

        foreach ([$d->admin, $d->guruA, $d->siswa1] as $boleh) {
            $this->sebagai($boleh)->getJson($url)->assertOk()->assertJsonPath('data.id_jadwal', $d->jadwalA->id_jadwal);
        }
        foreach ([$d->guruB, $d->guruC, $d->siswa2] as $dilarang) {
            $this->sebagai($dilarang)->getJson($url)->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/jadwal/999999')->assertNotFound();
    }

    public function test_guru_pengampu_mapel_melihat_jadwal_walau_diajar_guru_pengganti(): void
    {
        $d = $this->buatDunia();
        $j = $this->buat($d, 45, 8, 0, 60, null, $d->guruC->id_pengguna);

        $this->sebagai($d->guruA)->getJson('/api/v1/jadwal/'.$j->id_jadwal)->assertOk(); // pengampu mapel
        $this->sebagai($d->guruC)->getJson('/api/v1/jadwal/'.$j->id_jadwal)->assertOk(); // pengajar
        $this->sebagai($d->guruB)->getJson('/api/v1/jadwal/'.$j->id_jadwal)->assertForbidden();
    }

    public function test_daftar_dibatasi_per_peran_dan_filter(): void
    {
        $d = $this->buatDunia();
        $a = $this->buat($d, 50, 8);
        $b = Jadwal::factory()->create(['id_mapel' => $d->mapelB->id_mapel, 'id_kelas' => $d->kelasB->id_kelas, 'id_guru' => $d->guruB->id_pengguna,
            'waktu_mulai' => $this->waktu(50, 8, 0), 'waktu_selesai' => $this->waktu(50, 9, 0)]);
        $tgl = $this->waktu(50, 0)->format('Y-m-d');
        $ids = fn ($r) => collect($r->json('data'))->pluck('id_jadwal')->sort()->values()->all();
        $get = fn ($u, string $q) => $this->sebagai($u)->getJson('/api/v1/jadwal?tanggal='.$tgl.$q)->assertOk();

        $this->assertSame([$a->id_jadwal], $ids($get($d->siswa1, '')));
        $this->assertSame([$b->id_jadwal], $ids($get($d->siswa2, '')));
        $this->assertSame([$a->id_jadwal], $ids($get($d->guruA, '')));
        $this->assertSame([], $ids($get($d->guruC, '')));
        $this->assertSame([$a->id_jadwal, $b->id_jadwal], $ids($get($d->admin, '')));
        $this->assertSame([$b->id_jadwal], $ids($get($d->admin, '&id_kelas='.$d->kelasB->id_kelas)));
        $this->assertSame([$a->id_jadwal], $ids($get($d->admin, '&id_guru='.$d->guruA->id_pengguna)));
        $this->assertSame([$b->id_jadwal], $ids($get($d->admin, '&id_mapel='.$d->mapelB->id_mapel)));
        $this->assertSame([], $ids($get($d->admin, '&id_mapel='.$d->mapelB->id_mapel.'&id_kelas='.$d->kelasA->id_kelas)));
    }

    public function test_filter_tanggal_memakai_zona_waktu_sekolah(): void
    {
        $d = $this->buatDunia();
        // 17:30Z = 00:30 WIB hari berikutnya
        $j = Jadwal::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasA->id_kelas, 'id_guru' => $d->guruA->id_pengguna,
            'waktu_mulai' => '2031-12-10 17:30:00+00', 'waktu_selesai' => '2031-12-10 18:30:00+00']);
        $ada = fn (string $q) => in_array($j->id_jadwal, collect($this->sebagai($d->admin)->getJson('/api/v1/jadwal?'.$q)->assertOk()->json('data'))->pluck('id_jadwal')->all(), true);

        $this->assertTrue($ada('tanggal=2031-12-11'));
        $this->assertFalse($ada('tanggal=2031-12-10'));
        $this->assertTrue($ada('dari=2031-12-11&sampai=2031-12-11'));
        $this->assertTrue($ada('dari=2031-12-09&sampai=2031-12-12'));
        $this->assertFalse($ada('dari=2031-12-12'));
        $this->assertFalse($ada('sampai=2031-12-10'));
    }

    public function test_parameter_filter_tidak_valid_ditolak(): void
    {
        $d = $this->buatDunia();

        foreach (['tanggal=2031-02-31', 'tanggal=besok', 'dari=2031-12-10&sampai=2031-12-01', 'tanggal=2031-12-10&dari=2031-12-01',
            'id_kelas=abc', 'id_guru=-1', 'urut=waktu_mulai;drop', 'arah=sideways', 'per_page=100000'] as $q) {
            $this->sebagai($d->admin)->getJson('/api/v1/jadwal?'.$q)->assertUnprocessable();
        }
    }

    public function test_jadwal_per_siswa(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/siswa/'.$d->siswa1->id_pengguna.'/jadwal';

        $this->sebagai($d->siswa1)->getJson($url)->assertOk();
        $this->sebagai($d->admin)->getJson($url)->assertOk();
        $this->sebagai($d->siswa2)->getJson($url)->assertForbidden();
        $this->sebagai($d->guruA)->getJson($url)->assertOk();
        $this->sebagai($d->admin)->getJson('/api/v1/siswa/'.$d->guruA->id_pengguna.'/jadwal')->assertNotFound();

        $ids = fn ($u) => collect($this->sebagai($u)->getJson($url)->json('data'))->pluck('id_kelas')->unique()->values()->all();
        $this->assertSame([$d->kelasA->id_kelas], $ids($d->admin));
        // guru hanya melihat irisan dengan jadwal yang dapat dilihatnya
        $this->assertSame([], $ids($d->guruB));
    }

    public function test_jadwal_per_guru(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/guru/'.$d->guruA->id_pengguna.'/jadwal';

        $this->sebagai($d->guruA)->getJson($url)->assertOk();
        $this->sebagai($d->admin)->getJson($url)->assertOk();
        $this->sebagai($d->guruB)->getJson($url)->assertForbidden();
        $this->sebagai($d->siswa1)->getJson($url)->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/guru/'.$d->siswa1->id_pengguna.'/jadwal')->assertNotFound();
        $this->assertContains($d->jadwalA->id_jadwal, collect($this->sebagai($d->guruA)->getJson($url)->json('data'))->pluck('id_jadwal')->all());
    }

    // ------------------------------------------------------------ constraint database

    public function test_db_menolak_waktu_selesai_tidak_setelah_mulai(): void
    {
        $d = $this->buatDunia();

        $this->expectException(QueryException::class);
        DB::table('jadwal')->insert(['id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasA->id_kelas, 'id_guru' => $d->guruA->id_pengguna,
            'waktu_mulai' => $this->waktu(60, 8), 'waktu_selesai' => $this->waktu(60, 8), 'created_at' => now(), 'updated_at' => now()]);
    }

    public function test_db_menolak_dua_jadwal_kelas_dengan_mulai_sama(): void
    {
        $d = $this->buatDunia();
        $this->buat($d, 61, 8);

        $this->expectException(QueryException::class);
        $this->buat($d, 61, 8, 0, 30, null, $d->guruC->id_pengguna);
    }

    public function test_sesi_database_memakai_utc(): void
    {
        $this->assertSame('UTC', DB::selectOne('SHOW TIME ZONE')->TimeZone);
    }
}
