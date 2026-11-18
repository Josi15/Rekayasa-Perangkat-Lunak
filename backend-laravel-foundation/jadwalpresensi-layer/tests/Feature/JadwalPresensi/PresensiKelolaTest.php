<?php

namespace Tests\Feature\JadwalPresensi;

use App\Enums\StatusKehadiran;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Presensi;
use Illuminate\Support\Carbon;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class PresensiKelolaTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private function siswaDiKelas(Kelas $kelas): Pengguna
    {
        $s = Pengguna::factory()->create();
        $kelas->siswa()->attach($s->id_pengguna);

        return $s;
    }

    /** Jadwal kelasA/mapelA/guruA pada $hari dari sekarang (negatif = lampau), menit ganjil. */
    private function sesi(object $d, int $hari, int $jam = 3, int $menit = 11): Jadwal
    {
        return $this->buatJadwal($d->mapelA, $d->kelasA, $d->guruA, now()->utc()->addDays($hari)->setTime($jam, $menit, 0));
    }

    private function ids($r, string $kunci = 'id_presensi'): array
    {
        return collect($r->json('data'))->pluck($kunci)->sort()->values()->all();
    }

    // ------------------------------------------------------------ autentikasi

    public function test_tanpa_login_401(): void
    {
        foreach ([['GET', '/api/v1/presensi'], ['GET', '/api/v1/presensi/saya'], ['GET', '/api/v1/presensi/1'], ['PATCH', '/api/v1/presensi/1'],
            ['GET', '/api/v1/jadwal/1/presensi'], ['POST', '/api/v1/jadwal/1/presensi'], ['GET', '/api/v1/rekap/presensi']] as [$m, $u]) {
            $this->json($m, $u)->assertUnauthorized();
        }
    }

    // ------------------------------------------------------------ riwayat siswa

    public function test_siswa_melihat_riwayat_presensi_miliknya_saja(): void
    {
        $d = $this->buatDunia();
        $j2 = $this->sesi($d, 1);
        $p2 = Presensi::factory()->tanpaCheckin(StatusKehadiran::Sakit)->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $j2->id_jadwal]);

        $r = $this->sebagai($d->siswa1)->getJson('/api/v1/presensi/saya')->assertOk();
        $this->assertSame([$d->presensiA->id_presensi, $p2->id_presensi], $this->ids($r));
        $this->assertSame($p2->id_presensi, $r->json('data.0.id_presensi')); // terbaru lebih dulu
        $this->assertNotContains($d->presensiB->id_presensi, $this->ids($r));

        $this->sebagai($d->guruA)->getJson('/api/v1/presensi/saya')->assertForbidden();
        $this->sebagai($d->admin)->getJson('/api/v1/presensi/saya')->assertForbidden();
    }

    public function test_filter_riwayat(): void
    {
        $d = $this->buatDunia();
        $j2 = Jadwal::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasA->id_kelas, 'id_guru' => $d->guruA->id_pengguna,
            'waktu_mulai' => '2031-05-05 08:11:00+00', 'waktu_selesai' => '2031-05-05 09:11:00+00']);
        $p2 = Presensi::factory()->tanpaCheckin(StatusKehadiran::Sakit)->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $j2->id_jadwal]);
        $get = fn (string $q) => $this->ids($this->sebagai($d->siswa1)->getJson('/api/v1/presensi/saya?'.$q)->assertOk());

        $this->assertSame([$p2->id_presensi], $get('status_kehadiran=sakit'));
        $this->assertSame([$p2->id_presensi], $get('dari=2031-05-05&sampai=2031-05-05'));
        $this->assertSame([$p2->id_presensi], $get('id_jadwal='.$j2->id_jadwal));
        $this->assertSame([], $get('dari=2031-05-06'));
        $this->assertSame([], $get('id_mapel='.$d->mapelB->id_mapel));
        $this->assertSame([$p2->id_presensi], $get('status_validasi_lokasi=belum_divalidasi'));

        foreach (['status_kehadiran=bolos', 'status_validasi_lokasi=x', 'dari=2031-13-01', 'id_kelas=abc', 'urut=id;drop'] as $q) {
            $this->sebagai($d->siswa1)->getJson('/api/v1/presensi/saya?'.$q)->assertUnprocessable();
        }
    }

    // ------------------------------------------------------------ daftar & detail menurut peran

    public function test_daftar_presensi_dibatasi_per_peran(): void
    {
        $d = $this->buatDunia();
        $get = fn ($u) => $this->ids($this->sebagai($u)->getJson('/api/v1/presensi')->assertOk());

        $this->assertSame([$d->presensiA->id_presensi], $get($d->guruA));
        $this->assertSame([$d->presensiB->id_presensi], $get($d->guruB));
        $this->assertSame([], $get($d->guruC));
        $this->assertSame([$d->presensiB->id_presensi], $get($d->siswa2));
        $this->assertEqualsCanonicalizing([$d->presensiA->id_presensi, $d->presensiB->id_presensi], $get($d->admin));
        $this->assertSame([$d->presensiB->id_presensi], $this->ids($this->sebagai($d->admin)->getJson('/api/v1/presensi?id_kelas='.$d->kelasB->id_kelas)->assertOk()));
    }

    public function test_detail_presensi(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/presensi/'.$d->presensiA->id_presensi;

        foreach ([$d->siswa1, $d->guruA, $d->admin] as $boleh) {
            $this->sebagai($boleh)->getJson($url)->assertOk()->assertJsonPath('data.id_siswa', $d->siswa1->id_pengguna);
        }
        foreach ([$d->siswa2, $d->guruB, $d->guruC] as $dilarang) {
            $this->sebagai($dilarang)->getJson($url)->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/presensi/999999')->assertNotFound();
        $this->sebagai($d->admin)->getJson('/api/v1/presensi/abc')->assertNotFound();
    }

    // ------------------------------------------------------------ guru melihat presensi kelas (roster)

    public function test_guru_melihat_roster_termasuk_siswa_belum_tercatat(): void
    {
        $d = $this->buatDunia();
        $s3 = $this->siswaDiKelas($d->kelasA);
        $url = '/api/v1/jadwal/'.$d->jadwalA->id_jadwal.'/presensi';

        $r = $this->sebagai($d->guruA)->getJson($url)->assertOk();
        $this->assertSame([$d->siswa1->id_pengguna, $s3->id_pengguna], $this->ids($r, 'id_siswa'));
        $baris = collect($r->json('data'))->keyBy('id_siswa');
        $this->assertSame('hadir', $baris[$d->siswa1->id_pengguna]['status_kehadiran']);
        $this->assertSame($d->presensiA->id_presensi, $baris[$d->siswa1->id_pengguna]['presensi']['id_presensi']);
        $this->assertSame('belum_tercatat', $baris[$s3->id_pengguna]['status_kehadiran']);
        $this->assertNull($baris[$s3->id_pengguna]['presensi']);

        $this->assertSame([$s3->id_pengguna], $this->ids($this->sebagai($d->guruA)->getJson($url.'?status_kehadiran=belum_tercatat')->assertOk(), 'id_siswa'));
        $this->assertSame([$d->siswa1->id_pengguna], $this->ids($this->sebagai($d->guruA)->getJson($url.'?status_kehadiran=hadir')->assertOk(), 'id_siswa'));
        $this->sebagai($d->guruA)->getJson($url.'?status_kehadiran=bolos')->assertUnprocessable();
        $this->sebagai($d->admin)->getJson($url)->assertOk();
    }

    public function test_roster_ditolak_untuk_peran_atau_guru_yang_salah(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/jadwal/'.$d->jadwalA->id_jadwal.'/presensi';

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->siswa2] as $dilarang) {
            $this->sebagai($dilarang)->getJson($url)->assertForbidden();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/jadwal/999999/presensi')->assertNotFound();
    }

    public function test_guru_pengampu_dan_guru_pengganti_sama_sama_berwenang(): void
    {
        $d = $this->buatDunia();
        $j = $this->buatJadwal($d->mapelA, $d->kelasA, $d->guruC, now()->utc()->addDays(20)->setTime(3, 17));

        $this->sebagai($d->guruA)->getJson('/api/v1/jadwal/'.$j->id_jadwal.'/presensi')->assertOk(); // pengampu mapel
        $this->sebagai($d->guruC)->getJson('/api/v1/jadwal/'.$j->id_jadwal.'/presensi')->assertOk(); // pengajar
        $this->sebagai($d->guruB)->getJson('/api/v1/jadwal/'.$j->id_jadwal.'/presensi')->assertForbidden();
    }

    // ------------------------------------------------------------ pencatatan manual

    public function test_guru_mencatat_izin_tanpa_checkin(): void
    {
        $d = $this->buatDunia();
        $s3 = $this->siswaDiKelas($d->kelasA);
        $j = $this->sesi($d, 2);

        $this->sebagai($d->guruA)->postJson('/api/v1/jadwal/'.$j->id_jadwal.'/presensi', ['id_siswa' => $s3->id_pengguna, 'status_kehadiran' => 'izin'])
            ->assertCreated()
            ->assertJsonPath('data.status_kehadiran', 'izin')
            ->assertJsonPath('data.waktu_checkin', null)
            ->assertJsonPath('data.lokasi_lat', null)
            ->assertJsonPath('data.status_validasi_lokasi', 'belum_divalidasi');

        $this->sebagai($d->guruA)->postJson('/api/v1/jadwal/'.$j->id_jadwal.'/presensi', ['id_siswa' => $s3->id_pengguna, 'status_kehadiran' => 'sakit'])
            ->assertStatus(409)->assertJsonPath('code', 'attendance_exists');
        $this->assertSame(1, Presensi::query()->where('id_jadwal', $j->id_jadwal)->count());
    }

    public function test_pencatatan_manual_menjaga_kewenangan_dan_data(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d, 2);
        $url = '/api/v1/jadwal/'.$j->id_jadwal.'/presensi';
        $isi = ['id_siswa' => $d->siswa1->id_pengguna, 'status_kehadiran' => 'izin'];

        foreach ([$d->guruB, $d->guruC, $d->siswa1, $d->siswa2] as $dilarang) {
            $this->sebagai($dilarang)->postJson($url, $isi)->assertForbidden();
        }
        $this->assertSame(0, Presensi::query()->where('id_jadwal', $j->id_jadwal)->count());

        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $d->siswa2->id_pengguna, 'status_kehadiran' => 'izin'])   // siswa kelas lain
            ->assertUnprocessable()->assertJsonValidationErrors(['id_siswa']);
        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $d->guruA->id_pengguna, 'status_kehadiran' => 'izin'])->assertUnprocessable();
        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => 'abc', 'status_kehadiran' => 'izin'])->assertUnprocessable();
        $this->sebagai($d->guruA)->postJson($url, array_merge($isi, ['status_kehadiran' => 'bolos']))->assertUnprocessable();
        $this->sebagai($d->guruA)->postJson($url, $isi + ['lokasi_lat' => -6.2])->assertUnprocessable()->assertJsonValidationErrors(['lokasi_lat']);
        $this->sebagai($d->guruA)->postJson($url, $isi + ['status_validasi_lokasi' => 'valid'])->assertUnprocessable();
        $this->sebagai($d->guruA)->postJson($url, $isi + ['waktu_checkin' => '2020-01-01T00:00:00Z'])->assertUnprocessable();

        $nonaktif = $this->siswaDiKelas($d->kelasA);
        $nonaktif->forceFill(['nonaktif_pada' => now()])->save();
        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $nonaktif->id_pengguna, 'status_kehadiran' => 'izin'])->assertUnprocessable();

        $this->sebagai($d->admin)->postJson($url, $isi)->assertCreated(); // admin berwenang
    }

    public function test_kehadiran_manual_hanya_untuk_sesi_yang_sudah_dimulai(): void
    {
        $d = $this->buatDunia();
        $depan = $this->sesi($d, 3);
        $s3 = $this->siswaDiKelas($d->kelasA);
        $url = '/api/v1/jadwal/'.$depan->id_jadwal.'/presensi';

        foreach (['hadir', 'terlambat', 'alpa'] as $status) {
            $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $d->siswa1->id_pengguna, 'status_kehadiran' => $status])
                ->assertStatus(409)->assertJsonPath('code', 'schedule_not_started');
        }
        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $d->siswa1->id_pengguna, 'status_kehadiran' => 'sakit'])->assertCreated();
        $this->sebagai($d->guruA)->postJson($url, ['id_siswa' => $s3->id_pengguna, 'status_kehadiran' => 'izin'])->assertCreated();

        $lampau = $this->sesi($d, -2);
        $this->sebagai($d->guruA)->postJson('/api/v1/jadwal/'.$lampau->id_jadwal.'/presensi', ['id_siswa' => $s3->id_pengguna, 'status_kehadiran' => 'alpa'])->assertCreated();
    }

    // ------------------------------------------------------------ koreksi

    public function test_guru_mengoreksi_status_tanpa_mengubah_jejak_checkin(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d, -2);
        $p = Presensi::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $j->id_jadwal, 'lokasi_lat' => -6.2, 'lokasi_lng' => 106.8]);
        $sebelum = $p->fresh();

        $this->sebagai($d->guruA)->patchJson('/api/v1/presensi/'.$p->id_presensi, ['status_kehadiran' => 'alpa'])
            ->assertOk()->assertJsonPath('data.status_kehadiran', 'alpa');

        $sesudah = $p->fresh();
        $this->assertSame(StatusKehadiran::Alpa, $sesudah->status_kehadiran);
        $this->assertTrue($sebelum->waktu_checkin->equalTo($sesudah->waktu_checkin));
        $this->assertEquals($sebelum->lokasi_lat, $sesudah->lokasi_lat);
        $this->assertSame($sebelum->status_validasi_lokasi, $sesudah->status_validasi_lokasi);

        $this->sebagai($d->admin)->patchJson('/api/v1/presensi/'.$p->id_presensi, ['status_kehadiran' => 'izin'])->assertOk()->assertJsonPath('data.status_kehadiran', 'izin');
    }

    public function test_koreksi_ditolak_untuk_pihak_tidak_berwenang(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/presensi/'.$d->presensiA->id_presensi;

        foreach ([$d->siswa1, $d->siswa2, $d->guruB, $d->guruC] as $dilarang) {
            $this->sebagai($dilarang)->patchJson($url, ['status_kehadiran' => 'sakit'])->assertForbidden();
        }
        $this->assertSame(StatusKehadiran::Hadir, $d->presensiA->fresh()->status_kehadiran);
        $this->sebagai($d->guruA)->patchJson('/api/v1/presensi/999999', ['status_kehadiran' => 'sakit'])->assertNotFound();
    }

    public function test_koreksi_validasi_input_dan_field_terlarang(): void
    {
        $d = $this->buatDunia();
        $url = '/api/v1/presensi/'.$d->presensiA->id_presensi;

        $this->sebagai($d->guruA)->patchJson($url, [])->assertUnprocessable()->assertJsonValidationErrors(['status_kehadiran']);
        $this->sebagai($d->guruA)->patchJson($url, ['status_kehadiran' => 'bolos'])->assertUnprocessable();
        foreach (['id_siswa' => $d->siswa2->id_pengguna, 'id_jadwal' => $d->jadwalB->id_jadwal, 'waktu_checkin' => '2020-01-01T00:00:00Z',
            'lokasi_lat' => 1, 'lokasi_lng' => 1, 'status_validasi_lokasi' => 'valid'] as $kolom => $nilai) {
            $this->sebagai($d->guruA)->patchJson($url, ['status_kehadiran' => 'sakit', $kolom => $nilai])->assertUnprocessable()->assertJsonValidationErrors([$kolom]);
        }
    }

    public function test_koreksi_menjadi_hadir_pada_sesi_belum_mulai_ditolak(): void
    {
        $d = $this->buatDunia();
        $depan = $this->sesi($d, 3);
        $p = Presensi::factory()->tanpaCheckin(StatusKehadiran::Izin)->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $depan->id_jadwal]);

        $this->sebagai($d->guruA)->patchJson('/api/v1/presensi/'.$p->id_presensi, ['status_kehadiran' => 'hadir'])
            ->assertStatus(409)->assertJsonPath('code', 'schedule_not_started');
        $this->sebagai($d->guruA)->patchJson('/api/v1/presensi/'.$p->id_presensi, ['status_kehadiran' => 'sakit'])->assertOk();
    }

    // ------------------------------------------------------------ rekap kehadiran

    /** @return array{kelas: Kelas, s1: Pengguna, s2: Pengguna, s3: Pengguna} */
    private function dunia_rekap(object $d): array
    {
        $mapel = MataPelajaran::factory()->create(['id_guru' => $d->guruA->id_pengguna]);
        $kelas = Kelas::factory()->create(['id_wali' => $d->guruA->id_pengguna]);
        [$s1, $s2, $s3] = [$this->siswaDiKelas($kelas), $this->siswaDiKelas($kelas), $this->siswaDiKelas($kelas)];

        $buat = fn (string $mulai) => Jadwal::factory()->create(['id_mapel' => $mapel->id_mapel, 'id_kelas' => $kelas->id_kelas, 'id_guru' => $d->guruA->id_pengguna,
            'waktu_mulai' => $mulai, 'waktu_selesai' => Carbon::parse($mulai)->addHour()]);
        $p1 = $buat('2026-11-02 01:07:00+00');
        $p2 = $buat('2026-11-03 01:07:00+00');
        $p3 = $buat('2026-11-04 01:07:00+00');
        $batas = $buat('2026-11-04 17:30:00+00'); // 2026-11-05 00:30 WIB
        $buat('2026-11-20 01:07:00+00');           // masa depan relatif sekarang beku

        $catat = fn (Pengguna $s, Jadwal $j, StatusKehadiran $st) => Presensi::factory()->tanpaCheckin($st)->create(['id_siswa' => $s->id_pengguna, 'id_jadwal' => $j->id_jadwal]);
        $catat($s1, $p1, StatusKehadiran::Hadir);
        $catat($s1, $p2, StatusKehadiran::Izin);
        $catat($s1, $p3, StatusKehadiran::Terlambat);
        $catat($s2, $p1, StatusKehadiran::Alpa);

        $this->travelTo(Carbon::parse('2026-11-10 00:00:00', 'UTC'));

        return ['kelas' => $kelas, 's1' => $s1, 's2' => $s2, 's3' => $s3, 'mapel' => $mapel, 'batas' => $batas];
    }

    public function test_rekap_per_periode_menghitung_status_dan_belum_tercatat(): void
    {
        $d = $this->buatDunia();
        $w = $this->dunia_rekap($d);

        $r = $this->sebagai($d->guruA)->getJson('/api/v1/rekap/presensi?dari=2026-11-02&sampai=2026-11-04&id_kelas='.$w['kelas']->id_kelas)->assertOk();
        $baris = collect($r->json('data'))->keyBy('id_siswa');

        $this->assertCount(3, $baris);
        $this->assertSame(['total_sesi' => 3, 'tercatat' => 3, 'belum_tercatat' => 0, 'hadir' => 1, 'terlambat' => 1, 'izin' => 1, 'sakit' => 0, 'alpa' => 0],
            collect($baris[$w['s1']->id_pengguna])->only(['total_sesi', 'tercatat', 'belum_tercatat', 'hadir', 'terlambat', 'izin', 'sakit', 'alpa'])->all());
        $this->assertSame(['total_sesi' => 3, 'tercatat' => 1, 'belum_tercatat' => 2, 'hadir' => 0, 'terlambat' => 0, 'izin' => 0, 'sakit' => 0, 'alpa' => 1],
            collect($baris[$w['s2']->id_pengguna])->only(['total_sesi', 'tercatat', 'belum_tercatat', 'hadir', 'terlambat', 'izin', 'sakit', 'alpa'])->all());
        $this->assertSame(3, $baris[$w['s3']->id_pengguna]['belum_tercatat']);
        $this->assertArrayNotHasKey('persen', $baris[$w['s1']->id_pengguna]);
    }

    public function test_rekap_memakai_zona_waktu_sekolah_dan_mengabaikan_sesi_mendatang(): void
    {
        $d = $this->buatDunia();
        $w = $this->dunia_rekap($d);
        $total = fn (string $q) => collect($this->sebagai($d->admin)->getJson('/api/v1/rekap/presensi?id_kelas='.$w['kelas']->id_kelas.'&'.$q)->assertOk()->json('data'))->pluck('total_sesi')->unique()->all();

        $this->assertSame([1], $total('dari=2026-11-05&sampai=2026-11-05'));  // sesi 00:30 WIB hanya masuk tanggal 5
        $this->assertSame([3], $total('dari=2026-11-02&sampai=2026-11-04'));
        $this->assertSame([4], $total('dari=2026-11-01&sampai=2026-11-30'));  // sesi 20 Nov belum dimulai -> tidak dihitung
        $this->assertSame([], $total('dari=2026-10-01&sampai=2026-10-02'));
    }

    public function test_rekap_dibatasi_per_peran(): void
    {
        $d = $this->buatDunia();
        $w = $this->dunia_rekap($d);
        $q = '/api/v1/rekap/presensi?dari=2026-11-02&sampai=2026-11-04&id_kelas='.$w['kelas']->id_kelas;

        $this->assertCount(3, $this->sebagai($d->admin)->getJson($q)->assertOk()->json('data'));
        $this->assertCount(0, $this->sebagai($d->guruB)->getJson($q)->assertOk()->json('data'));
        $this->assertCount(0, $this->sebagai($d->guruC)->getJson($q)->assertOk()->json('data'));

        $milik = $this->sebagai($w['s1'])->getJson($q)->assertOk()->json('data');
        $this->assertCount(1, $milik);
        $this->assertSame($w['s1']->id_pengguna, $milik[0]['id_siswa']);
        // siswa tidak dapat meminta rekap siswa lain lewat filter
        $this->assertCount(0, $this->sebagai($w['s1'])->getJson($q.'&id_siswa='.$w['s2']->id_pengguna)->assertOk()->json('data'));
    }

    public function test_rekap_validasi_periode(): void
    {
        $d = $this->buatDunia();

        foreach (['', 'dari=2026-11-02', 'sampai=2026-11-02', 'dari=2026-11-05&sampai=2026-11-01', 'dari=2026-02-31&sampai=2026-03-01',
            'dari=2026-01-01&sampai=2027-12-31', 'dari=2026-11-01&sampai=2026-11-02&id_kelas=abc', 'dari=2026-11-01&sampai=2026-11-02&per_page=9999'] as $q) {
            $this->sebagai($d->admin)->getJson('/api/v1/rekap/presensi?'.$q)->assertUnprocessable();
        }
        $this->sebagai($d->admin)->getJson('/api/v1/rekap/presensi?dari=2026-01-01&sampai=2026-12-31')->assertOk();
    }
}
