<?php

namespace Tests\Feature\JadwalPresensi;

use App\Models\Jadwal;
use App\Models\Presensi;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class PresensiCheckinTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    private const REF_LAT = -6.2;

    private const REF_LNG = 106.816666;

    /** Panjang 1 meter dalam derajat lintang. */
    private const METER = 1 / 111195;

    protected function setUp(): void
    {
        parent::setUp();

        config(['presensi.lokasi' => ['lat' => self::REF_LAT, 'lng' => self::REF_LNG, 'radius_meter' => 100, 'wajib' => true, 'luar_radius' => 'tolak']]);
        config(['presensi.checkin' => ['buka_sebelum_menit' => 15, 'toleransi_terlambat_menit' => 10]]);
    }

    /** Awal sesi uji (menit ganjil agar tidak bertabrakan dengan data factory). */
    private function mulai(): Carbon
    {
        return Carbon::parse('2026-11-02 02:07:00', 'UTC');
    }

    private function sesi(object $d): Jadwal
    {
        return $this->buatJadwal($d->mapelA, $d->kelasA, $d->guruA, $this->mulai()); // 60 menit
    }

    /** Koordinat $meter di utara titik referensi. @return array{lokasi_lat: float, lokasi_lng: float} */
    private function titik(float $meter): array
    {
        return ['lokasi_lat' => self::REF_LAT + $meter * self::METER, 'lokasi_lng' => self::REF_LNG];
    }

    private function checkin(object $d, Jadwal $j, array $isi, $siswa = null)
    {
        return $this->sebagai($siswa ?? $d->siswa1)->postJson('/api/v1/jadwal/'.$j->id_jadwal.'/checkin', $isi);
    }

    // ------------------------------------------------------------ presensi valid

    public function test_checkin_valid_dalam_radius_dan_tepat_waktu(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(3));

        $r = $this->checkin($d, $j, $this->titik(50))->assertCreated()
            ->assertJsonPath('data.id_siswa', $d->siswa1->id_pengguna)
            ->assertJsonPath('data.id_jadwal', $j->id_jadwal)
            ->assertJsonPath('data.status_kehadiran', 'hadir')
            ->assertJsonPath('data.status_validasi_lokasi', 'valid')
            ->assertJsonPath('data.radius_meter', 100);

        $this->assertEqualsWithDelta(50, $r->json('data.jarak_meter'), 1.0);
        $this->assertDatabaseHas('presensi', ['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $j->id_jadwal,
            'status_kehadiran' => 'hadir', 'status_validasi_lokasi' => 'valid']);
        $this->assertTrue(Presensi::query()->where('id_jadwal', $j->id_jadwal)->firstOrFail()->waktu_checkin->equalTo($this->mulai()->addMinutes(3)));
    }

    public function test_status_hadir_atau_terlambat_menurut_toleransi(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);

        $this->travelTo($this->mulai()->subMinutes(10)); // sebelum mulai tapi jendela sudah buka
        $this->checkin($d, $j, $this->titik(10))->assertCreated()->assertJsonPath('data.status_kehadiran', 'hadir');

        $this->travelTo($this->mulai()->addMinutes(10)); // tepat di batas toleransi
        $this->checkin($d, $j, $this->titik(10), $d->siswa1)->assertStatus(409); // sudah tercatat

        $siswa3 = $this->siswaBaru($d);
        $this->checkin($d, $j, $this->titik(10), $siswa3)->assertCreated()->assertJsonPath('data.status_kehadiran', 'hadir');

        $siswa4 = $this->siswaBaru($d);
        $this->travelTo($this->mulai()->addMinutes(10)->addSecond());
        $this->checkin($d, $j, $this->titik(10), $siswa4)->assertCreated()->assertJsonPath('data.status_kehadiran', 'terlambat');
    }

    // ------------------------------------------------------------ jendela waktu

    public function test_jendela_checkin(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);

        $this->travelTo($this->mulai()->subMinutes(15)->subSecond());
        $this->checkin($d, $j, $this->titik(10))->assertStatus(409)->assertJsonPath('code', 'checkin_not_open');

        $this->travelTo($this->mulai()->subMinutes(15));
        $this->checkin($d, $j, $this->titik(10))->assertCreated();

        $siswa3 = $this->siswaBaru($d);
        $this->travelTo($this->mulai()->addHour()); // tepat saat selesai
        $this->checkin($d, $j, $this->titik(10), $siswa3)->assertCreated()->assertJsonPath('data.status_kehadiran', 'terlambat');

        $siswa4 = $this->siswaBaru($d);
        $this->travelTo($this->mulai()->addHour()->addSecond());
        $this->checkin($d, $j, $this->titik(10), $siswa4)->assertStatus(409)->assertJsonPath('code', 'checkin_closed');
        $this->assertDatabaseMissing('presensi', ['id_siswa' => $siswa4->id_pengguna, 'id_jadwal' => $j->id_jadwal]);
    }

    // ------------------------------------------------------------ validasi lokasi

    public function test_di_luar_radius_ditolak_dan_tidak_disimpan(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(1));

        $this->checkin($d, $j, $this->titik(250))->assertStatus(409)->assertJsonPath('code', 'outside_radius');
        $this->assertDatabaseMissing('presensi', ['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $j->id_jadwal]);

        // pindah ke dalam radius -> boleh mencoba lagi (percobaan gagal tidak mengunci)
        $this->checkin($d, $j, $this->titik(99))->assertCreated()->assertJsonPath('data.status_validasi_lokasi', 'valid');
    }

    public function test_mode_tandai_menyimpan_di_luar_radius_sebagai_tidak_valid(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        config(['presensi.lokasi.luar_radius' => 'tandai']);
        $this->travelTo($this->mulai()->addMinutes(1));

        $this->checkin($d, $j, $this->titik(500))->assertCreated()
            ->assertJsonPath('data.status_validasi_lokasi', 'tidak_valid')
            ->assertJsonPath('data.status_kehadiran', 'hadir');
        $this->assertDatabaseHas('presensi', ['id_siswa' => $d->siswa1->id_pengguna, 'status_validasi_lokasi' => 'tidak_valid']);
    }

    public function test_lokasi_wajib_bila_dikonfigurasi(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(1));

        foreach ([[], ['lokasi_lat' => null, 'lokasi_lng' => null]] as $isi) {
            $this->checkin($d, $j, $isi)->assertUnprocessable()->assertJsonValidationErrors(['lokasi_lat']);
        }
        $this->assertDatabaseMissing('presensi', ['id_jadwal' => $j->id_jadwal]);
    }

    public function test_tanpa_koordinat_diterima_bila_lokasi_tidak_wajib(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        config(['presensi.lokasi.wajib' => false]);
        $this->travelTo($this->mulai()->addMinutes(1));

        $this->checkin($d, $j, [])->assertCreated()
            ->assertJsonPath('data.status_validasi_lokasi', 'belum_divalidasi')
            ->assertJsonPath('data.lokasi_lat', null)
            ->assertJsonPath('data.lokasi_lng', null);
    }

    public function test_titik_referensi_belum_dikonfigurasi_503(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        config(['presensi.lokasi.lat' => null, 'presensi.lokasi.lng' => null]);
        $this->travelTo($this->mulai()->addMinutes(1));

        $this->checkin($d, $j, $this->titik(10))->assertStatus(503)->assertJsonPath('code', 'location_not_configured');
        $this->assertDatabaseMissing('presensi', ['id_jadwal' => $j->id_jadwal]);
    }

    /** @return array<string, array{0: array<string, mixed>}> */
    public static function koordinatBuruk(): array
    {
        return [
            'lat di atas 90' => [['lokasi_lat' => 91, 'lokasi_lng' => 106.8]],
            'lat di bawah -90' => [['lokasi_lat' => -90.0001, 'lokasi_lng' => 106.8]],
            'lng di atas 180' => [['lokasi_lat' => -6.2, 'lokasi_lng' => 181]],
            'lng di bawah -180' => [['lokasi_lat' => -6.2, 'lokasi_lng' => -180.5]],
            'teks' => [['lokasi_lat' => 'abc', 'lokasi_lng' => 'def']],
            'boolean' => [['lokasi_lat' => true, 'lokasi_lng' => false]],
            'array' => [['lokasi_lat' => [1], 'lokasi_lng' => [2]]],
            'hanya lat' => [['lokasi_lat' => -6.2]],
            'hanya lng' => [['lokasi_lng' => 106.8]],
        ];
    }

    #[DataProvider('koordinatBuruk')]
    public function test_format_dan_rentang_koordinat_divalidasi(array $isi): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(1));

        $this->checkin($d, $j, $isi)->assertUnprocessable();
        $this->assertDatabaseMissing('presensi', ['id_jadwal' => $j->id_jadwal]);
    }

    public function test_koordinat_batas_sah_diterima_formatnya(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        config(['presensi.lokasi.luar_radius' => 'tandai']);
        $this->travelTo($this->mulai()->addMinutes(1));

        // 90/180 lolos validasi format; jaraknya jauh -> ditandai tidak_valid (bukan error 422)
        $this->checkin($d, $j, ['lokasi_lat' => 90, 'lokasi_lng' => 180])->assertCreated()->assertJsonPath('data.status_validasi_lokasi', 'tidak_valid');
    }

    // ------------------------------------------------------------ klien tidak dipercaya

    public function test_klien_tidak_dapat_menentukan_status_waktu_atau_identitas(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(1));

        foreach ([
            'status_validasi_lokasi' => 'valid', 'status_kehadiran' => 'hadir', 'waktu_checkin' => '2020-01-01T00:00:00Z',
            'id_siswa' => $d->siswa2->id_pengguna, 'id_jadwal' => $d->jadwalB->id_jadwal,
        ] as $kolom => $nilai) {
            $this->checkin($d, $j, $this->titik(10) + [$kolom => $nilai])->assertUnprocessable()->assertJsonValidationErrors([$kolom]);
        }
        $this->assertDatabaseMissing('presensi', ['id_jadwal' => $j->id_jadwal]);
    }

    public function test_status_validasi_dihitung_server_walau_klien_berbohong_soal_posisi(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(1));

        // posisi sebenarnya jauh; klien tidak punya cara menyatakan "valid" selain koordinat -> ditolak
        $this->checkin($d, $j, $this->titik(5000) + ['status_validasi_lokasi' => 'valid'])->assertUnprocessable();
        $this->checkin($d, $j, $this->titik(5000))->assertStatus(409)->assertJsonPath('code', 'outside_radius');
    }

    // ------------------------------------------------------------ presensi ganda

    public function test_presensi_ganda_ditolak(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(2));

        $this->checkin($d, $j, $this->titik(10))->assertCreated();
        $this->checkin($d, $j, $this->titik(10))->assertStatus(409)->assertJsonPath('code', 'attendance_exists');
        $this->assertSame(1, Presensi::query()->where('id_siswa', $d->siswa1->id_pengguna)->where('id_jadwal', $j->id_jadwal)->count());
    }

    public function test_tidak_dapat_check_in_bila_guru_sudah_mencatat_izin(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        Presensi::factory()->tanpaCheckin()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $j->id_jadwal]);
        $this->travelTo($this->mulai()->addMinutes(2));

        $this->checkin($d, $j, $this->titik(10))->assertStatus(409)->assertJsonPath('code', 'attendance_exists');
    }

    // ------------------------------------------------------------ akses & peran

    public function test_hanya_siswa_di_kelas_jadwal_boleh_check_in(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(2));

        $this->checkin($d, $j, $this->titik(10), $d->siswa2)->assertForbidden();   // siswa kelas lain
        $this->checkin($d, $j, $this->titik(10), $d->guruA)->assertForbidden();    // guru pengajar sendiri
        $this->checkin($d, $j, $this->titik(10), $d->admin)->assertForbidden();
        $this->json('POST', '/api/v1/jadwal/'.$j->id_jadwal.'/checkin', $this->titik(10))->assertUnauthorized();
        $this->assertDatabaseMissing('presensi', ['id_jadwal' => $j->id_jadwal]);
    }

    public function test_403_mendahului_422_dan_jadwal_tidak_ada_404(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);

        $this->checkin($d, $j, ['lokasi_lat' => 'abc'], $d->siswa2)->assertForbidden();
        $this->sebagai($d->siswa1)->postJson('/api/v1/jadwal/999999/checkin', $this->titik(1))->assertNotFound();
        $this->sebagai($d->siswa1)->postJson('/api/v1/jadwal/abc/checkin', $this->titik(1))->assertNotFound();
    }

    public function test_siswa_nonaktif_ditolak(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $this->travelTo($this->mulai()->addMinutes(2));
        $d->siswa1->forceFill(['nonaktif_pada' => now()])->save();

        $this->checkin($d, $j, $this->titik(10))->assertUnauthorized();
        $this->assertDatabaseMissing('presensi', ['id_jadwal' => $j->id_jadwal]);
    }

    // ------------------------------------------------------------ constraint database

    public function test_db_menolak_koordinat_di_luar_rentang_dan_tidak_berpasangan(): void
    {
        $d = $this->buatDunia();
        $j = $this->sesi($d);
        $dasar = ['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $j->id_jadwal, 'status_kehadiran' => 'hadir', 'created_at' => now(), 'updated_at' => now()];

        foreach ([['lokasi_lat' => 91, 'lokasi_lng' => 10], ['lokasi_lat' => 10, 'lokasi_lng' => 181], ['lokasi_lat' => 10, 'lokasi_lng' => null]] as $buruk) {
            try {
                DB::transaction(fn () => DB::table('presensi')->insert($dasar + $buruk));
                $this->fail('Constraint koordinat seharusnya menolak '.json_encode($buruk));
            } catch (QueryException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_db_menolak_presensi_ganda_siswa_jadwal(): void
    {
        $d = $this->buatDunia(); // presensiA = siswa1 pada jadwalA

        $this->expectException(QueryException::class);
        DB::table('presensi')->insert(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $d->jadwalA->id_jadwal,
            'status_kehadiran' => 'alpa', 'created_at' => now(), 'updated_at' => now()]);
    }

    private function siswaBaru(object $d): \App\Models\Pengguna
    {
        $s = \App\Models\Pengguna::factory()->create();
        $d->kelasA->siswa()->attach($s->id_pengguna);

        return $s;
    }
}
