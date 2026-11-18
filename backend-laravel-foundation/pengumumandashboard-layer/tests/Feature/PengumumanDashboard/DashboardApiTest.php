<?php

namespace Tests\Feature\PengumumanDashboard;

use App\Models\Kelas;
use App\Models\Kuis;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Pengumuman;
use App\Models\Presensi;
use App\Models\Tugas;
use App\Enums\StatusKehadiran;
use App\Enums\StatusPengumpulan;
use App\Enums\StatusValidasiLokasi;
use Tests\Concerns\MasterApi;
use Tests\DatabaseTestCase;

/**
 * Setiap tes membangun data kecil yang angkanya diketahui pasti (database uji kosong per tes),
 * lalu membandingkan keluaran dashboard dengan angka yang dihitung manual di sini.
 */
class DashboardApiTest extends DatabaseTestCase
{
    use MasterApi;

    public function test_tanpa_login_401(): void
    {
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();
    }

    public function test_parameter_periode_tidak_valid_422(): void
    {
        $admin = Pengguna::factory()->admin()->create();

        $this->sebagai($admin)->getJson('/api/v1/dashboard?dari=bukan-tanggal')->assertUnprocessable();
        $this->sebagai($admin)->getJson('/api/v1/dashboard?dari=2026-02-10&sampai=2026-02-01')->assertUnprocessable();
    }

    // ------------------------------------------------------------------ siswa

    /** @return array<string, mixed> */
    private function duniaSiswa(): array
    {
        $guru = Pengguna::factory()->guru()->create();
        $s = Pengguna::factory()->create();
        $lain = Pengguna::factory()->create();

        $kelasA = Kelas::factory()->create(['id_wali' => $guru->id_pengguna]);
        $kelasArsip = Kelas::factory()->diarsipkan()->create(['id_wali' => $guru->id_pengguna]);
        $kelasA->siswa()->attach([$s->id_pengguna]);
        $kelasArsip->siswa()->attach([$s->id_pengguna]);
        $kelasLain = Kelas::factory()->create(['id_wali' => $guru->id_pengguna]);
        $kelasLain->siswa()->attach([$lain->id_pengguna]);

        $mapelA = MataPelajaran::factory()->create(['id_guru' => $guru->id_pengguna]);
        $mapelX = MataPelajaran::factory()->create(['id_guru' => $guru->id_pengguna]); // tidak diikuti s

        $j1 = $this->buatJadwal($mapelA, $kelasA, $guru, $this->besok(1));
        $j2 = $this->buatJadwal($mapelA, $kelasA, $guru, $this->besok(2));
        $this->buatJadwal($mapelA, $kelasA, $guru, $this->kemarin(2));           // sudah lewat
        $this->buatJadwal($mapelX, $kelasLain, $guru, $this->besok(1)->addHours(2)); // kelas lain

        $t1 = Tugas::factory()->create(['id_mapel' => $mapelA->id_mapel, 'batas_waktu' => $this->besok(3)]);       // belum, terbuka
        $t2 = Tugas::factory()->create(['id_mapel' => $mapelA->id_mapel, 'batas_waktu' => $this->besok(4)]);       // sudah dikumpulkan
        $t3 = Tugas::factory()->create(['id_mapel' => $mapelA->id_mapel, 'batas_waktu' => $this->kemarin(1)]);     // belum, lewat batas
        $t4 = Tugas::factory()->create(['id_mapel' => $mapelA->id_mapel, 'batas_waktu' => $this->besok(5)]);       // sudah dikumpulkan, belum dinilai
        Tugas::factory()->create(['id_mapel' => $mapelX->id_mapel, 'batas_waktu' => $this->besok(3)]);             // mapel tidak diikuti

        $p2 = PengumpulanTugas::factory()->create(['id_siswa' => $s->id_pengguna, 'id_tugas' => $t2->id_tugas]);
        PengumpulanTugas::factory()->create(['id_siswa' => $s->id_pengguna, 'id_tugas' => $t4->id_tugas]);
        PengumpulanTugas::factory()->create(['id_siswa' => $lain->id_pengguna, 'id_tugas' => $t1->id_tugas]); // milik siswa lain

        $kuis = Kuis::factory()->create(['id_mapel' => $mapelA->id_mapel]);
        Nilai::factory()->dariPengumpulan($p2)->create(['nilai' => 80]);
        Nilai::factory()->create(['id_siswa' => $s->id_pengguna, 'id_kuis' => $kuis->id_kuis, 'nilai' => 60.5]);

        $g = Pengumuman::factory()->create(['id_penulis' => Pengguna::factory()->admin()->create()->id_pengguna, 'judul' => 'Global', 'created_at' => now()->subDays(3)]);
        $m = Pengumuman::factory()->untukMapel($mapelA)->create(['judul' => 'MapelA', 'created_at' => now()->subDay()]);
        Pengumuman::factory()->untukMapel($mapelX)->create(['judul' => 'MapelX']);

        return compact('guru', 's', 'lain', 'kelasA', 'mapelA', 'j1', 'j2', 't1', 't3', 'g', 'm');
    }

    public function test_dashboard_siswa(): void
    {
        $d = $this->duniaSiswa();

        $r = $this->sebagai($d['s'])->getJson('/api/v1/dashboard')->assertOk();

        $r->assertJsonPath('data.peran', 'siswa');
        $r->assertJsonPath('data.jumlah_kelas', 1); // kelas diarsipkan tidak dihitung
        $r->assertJsonPath('data.tugas_belum_dikumpulkan.total', 2);
        $r->assertJsonPath('data.tugas_belum_dikumpulkan.masih_terbuka', 1);
        $r->assertJsonPath('data.tugas_belum_dikumpulkan.lewat_batas', 1);
        $r->assertJsonPath('data.tugas_belum_dikumpulkan.tenggat_terdekat.0.id_tugas', $d['t1']->id_tugas);
        $this->assertCount(1, $r->json('data.tugas_belum_dikumpulkan.tenggat_terdekat'));

        $this->assertSame([$d['j1']->id_jadwal, $d['j2']->id_jadwal], array_column($r->json('data.jadwal_terdekat'), 'id_jadwal'));

        $n = $r->json('data.ringkasan_nilai');
        $this->assertSame(2, $n['jumlah_nilai']);
        $this->assertSame(1, $n['dari_tugas']);
        $this->assertSame(1, $n['dari_kuis']);
        $this->assertEquals(60.5, $n['terendah']);
        $this->assertEquals(80, $n['tertinggi']);
        $this->assertSame(1, $n['pengumpulan_menunggu_nilai']); // t4
        $this->assertCount(2, $n['terbaru']);
        $this->assertArrayNotHasKey('rata_rata', $n); // tidak ada rumus nilai akhir

        // global + mapel yang diikuti, terbaru dulu; MapelX tidak muncul
        $this->assertSame(['MapelA', 'Global'], array_column($r->json('data.pengumuman_terbaru'), 'judul'));
    }

    public function test_dashboard_siswa_lain_tidak_melihat_data_orang_lain(): void
    {
        $d = $this->duniaSiswa();

        $r = $this->sebagai($d['lain'])->getJson('/api/v1/dashboard')->assertOk();

        $r->assertJsonPath('data.jumlah_kelas', 1);
        $r->assertJsonPath('data.ringkasan_nilai.jumlah_nilai', 0);
        $r->assertJsonPath('data.ringkasan_nilai.terendah', null);
        $r->assertJsonPath('data.tugas_belum_dikumpulkan.total', 1); // hanya tugas mapelX
        $this->assertSame(['Global'], array_column(array_filter($r->json('data.pengumuman_terbaru'), fn ($p) => $p['cakupan'] === 'global'), 'judul'));
    }

    // ------------------------------------------------------------------- guru

    /** @return array<string, mixed> */
    private function duniaGuru(): array
    {
        $guruA = Pengguna::factory()->guru()->create();
        $guruB = Pengguna::factory()->guru()->create();
        $s1 = Pengguna::factory()->create();
        $s2 = Pengguna::factory()->create();
        $s3 = Pengguna::factory()->create();
        $s4 = Pengguna::factory()->nonaktif()->create();
        $sB = Pengguna::factory()->create();

        $kA = Kelas::factory()->create(['id_wali' => $guruA->id_pengguna]);
        $kB = Kelas::factory()->create(['id_wali' => $guruA->id_pengguna]);
        $kArsip = Kelas::factory()->diarsipkan()->create(['id_wali' => $guruA->id_pengguna]);
        $kLain = Kelas::factory()->create(['id_wali' => $guruB->id_pengguna]);
        $kA->siswa()->attach([$s1->id_pengguna, $s2->id_pengguna, $s4->id_pengguna]);
        $kB->siswa()->attach([$s2->id_pengguna, $s3->id_pengguna]); // s2 di dua kelas: dihitung sekali
        $kArsip->siswa()->attach([Pengguna::factory()->create()->id_pengguna]);
        $kLain->siswa()->attach([$sB->id_pengguna]);

        $mapelA = MataPelajaran::factory()->create(['id_guru' => $guruA->id_pengguna]);
        $mapelB = MataPelajaran::factory()->create(['id_guru' => $guruB->id_pengguna]);

        $this->buatJadwal($mapelA, $kA, $guruA, $this->besok(1));
        $this->buatJadwal($mapelA, $kB, $guruA, $this->besok(2));
        $this->buatJadwal($mapelA, $kArsip, $guruA, $this->besok(3));   // kelas diarsipkan: tidak dihitung sebagai kelas diajar
        $this->buatJadwal($mapelB, $kLain, $guruB, $this->besok(1));

        $t1 = Tugas::factory()->create(['id_mapel' => $mapelA->id_mapel, 'batas_waktu' => $this->besok(5)]);
        $t2 = Tugas::factory()->create(['id_mapel' => $mapelA->id_mapel, 'batas_waktu' => $this->kemarin(2)]);
        $t3 = Tugas::factory()->create(['id_mapel' => $mapelB->id_mapel, 'batas_waktu' => $this->besok(5)]);

        $p1 = PengumpulanTugas::factory()->create(['id_siswa' => $s1->id_pengguna, 'id_tugas' => $t1->id_tugas, 'status' => StatusPengumpulan::Dikumpulkan]);
        $p2 = PengumpulanTugas::factory()->create(['id_siswa' => $s2->id_pengguna, 'id_tugas' => $t1->id_tugas, 'status' => StatusPengumpulan::Dinilai]);
        $p3 = PengumpulanTugas::factory()->create(['id_siswa' => $s3->id_pengguna, 'id_tugas' => $t2->id_tugas, 'status' => StatusPengumpulan::Terlambat]);
        PengumpulanTugas::factory()->create(['id_siswa' => $sB->id_pengguna, 'id_tugas' => $t3->id_tugas]); // mapel guru lain
        Nilai::factory()->dariPengumpulan($p2)->create(['nilai' => 90]);

        return compact('guruA', 'guruB', 't1', 't2', 'p1', 'p3');
    }

    public function test_dashboard_guru(): void
    {
        $d = $this->duniaGuru();

        $r = $this->sebagai($d['guruA'])->getJson('/api/v1/dashboard')->assertOk();

        $r->assertJsonPath('data.peran', 'guru');
        $r->assertJsonPath('data.jumlah_kelas_diajar', 2);
        $r->assertJsonPath('data.jumlah_siswa', 3); // s1, s2, s3 (s4 nonaktif, s2 sekali)
        $r->assertJsonPath('data.tugas_perlu_dinilai', 2); // p1 & p3 belum bernilai
        $this->assertCount(3, $r->json('data.jadwal_mengajar'));

        $k = $r->json('data.ringkasan_pengumpulan');
        $this->assertSame(2, $k['jumlah_tugas']);
        $this->assertSame(1, $k['tugas_masih_terbuka']);
        $this->assertSame(3, $k['total_pengumpulan']);
        $this->assertSame(['dikumpulkan' => 1, 'terlambat' => 1, 'dinilai' => 1], $k['per_status']);

        $per = collect($k['tugas_terbaru'])->keyBy('id_tugas');
        $this->assertSame(2, $per[$d['t1']->id_tugas]['jumlah_pengumpulan']);
        $this->assertSame(1, $per[$d['t1']->id_tugas]['belum_dinilai']);
        $this->assertSame(3, $per[$d['t1']->id_tugas]['siswa_target']);
        $this->assertSame(1, $per[$d['t2']->id_tugas]['jumlah_pengumpulan']);
        $this->assertSame($d['t1']->id_tugas, $k['tugas_terbaru'][0]['id_tugas']); // batas_waktu terbaru dulu
    }

    public function test_dashboard_guru_lain_terisolasi(): void
    {
        $d = $this->duniaGuru();

        $r = $this->sebagai($d['guruB'])->getJson('/api/v1/dashboard')->assertOk();

        $r->assertJsonPath('data.jumlah_kelas_diajar', 1);
        $r->assertJsonPath('data.jumlah_siswa', 1);
        $r->assertJsonPath('data.tugas_perlu_dinilai', 1);
        $r->assertJsonPath('data.ringkasan_pengumpulan.total_pengumpulan', 1);
    }

    public function test_dashboard_guru_tanpa_data_bernilai_nol(): void
    {
        $guru = Pengguna::factory()->guru()->create();

        $r = $this->sebagai($guru)->getJson('/api/v1/dashboard')->assertOk();

        $r->assertJsonPath('data.jumlah_kelas_diajar', 0);
        $r->assertJsonPath('data.jumlah_siswa', 0);
        $r->assertJsonPath('data.tugas_perlu_dinilai', 0);
        $r->assertJsonPath('data.jadwal_mengajar', []);
        $r->assertJsonPath('data.ringkasan_pengumpulan.per_status', ['dikumpulkan' => 0, 'terlambat' => 0, 'dinilai' => 0]);
    }

    // ------------------------------------------------------------------ admin

    public function test_dashboard_admin(): void
    {
        $admin = Pengguna::factory()->admin()->create();
        $guru1 = Pengguna::factory()->guru()->create();
        $guru2 = Pengguna::factory()->guru()->nonaktif()->create();
        $s1 = Pengguna::factory()->create();
        $s2 = Pengguna::factory()->create();
        Pengguna::factory()->nonaktif()->create(); // siswa nonaktif

        $kelas = Kelas::factory()->create(['id_wali' => $guru1->id_pengguna]);
        Kelas::factory()->diarsipkan()->create(['id_wali' => $guru1->id_pengguna]);
        $mapel = MataPelajaran::factory()->create(['id_guru' => $guru1->id_pengguna]);
        MataPelajaran::factory()->create(['id_guru' => $guru1->id_pengguna]);
        MataPelajaran::factory()->diarsipkan()->create(['id_guru' => $guru1->id_pengguna]);
        $kelas->siswa()->attach([$s1->id_pengguna, $s2->id_pengguna]);

        // 3 sesi dalam periode, 1 di luar periode (60 hari lalu)
        $j1 = $this->buatJadwal($mapel, $kelas, $guru1, $this->kemarin(1));
        $j2 = $this->buatJadwal($mapel, $kelas, $guru1, $this->kemarin(2));
        $j3 = $this->buatJadwal($mapel, $kelas, $guru1, $this->kemarin(3));
        $jLama = $this->buatJadwal($mapel, $kelas, $guru1, $this->kemarin(60));

        Presensi::factory()->create(['id_siswa' => $s1->id_pengguna, 'id_jadwal' => $j1->id_jadwal, 'status_kehadiran' => StatusKehadiran::Hadir, 'status_validasi_lokasi' => StatusValidasiLokasi::Valid]);
        Presensi::factory()->create(['id_siswa' => $s2->id_pengguna, 'id_jadwal' => $j1->id_jadwal, 'status_kehadiran' => StatusKehadiran::Terlambat, 'status_validasi_lokasi' => StatusValidasiLokasi::Valid]);
        Presensi::factory()->create(['id_siswa' => $s1->id_pengguna, 'id_jadwal' => $j2->id_jadwal, 'status_kehadiran' => StatusKehadiran::Hadir, 'status_validasi_lokasi' => StatusValidasiLokasi::TidakValid]);
        Presensi::factory()->tanpaCheckin(StatusKehadiran::Izin)->create(['id_siswa' => $s2->id_pengguna, 'id_jadwal' => $j2->id_jadwal]);
        Presensi::factory()->tanpaCheckin(StatusKehadiran::Alpa)->create(['id_siswa' => $s1->id_pengguna, 'id_jadwal' => $j3->id_jadwal]);
        Presensi::factory()->create(['id_siswa' => $s1->id_pengguna, 'id_jadwal' => $jLama->id_jadwal, 'status_kehadiran' => StatusKehadiran::Hadir]); // di luar periode

        Pengumuman::factory()->create(['id_penulis' => $admin->id_pengguna]);
        Pengumuman::factory()->create(['id_penulis' => $admin->id_pengguna, 'created_at' => now()->subDays(10)]);

        $r = $this->sebagai($admin)->getJson('/api/v1/dashboard')->assertOk();

        $r->assertJsonPath('data.peran', 'admin');
        $r->assertJsonPath('data.pengguna.total', 6);
        $r->assertJsonPath('data.pengguna.per_peran.admin', ['total' => 1, 'aktif' => 1, 'nonaktif' => 0]);
        $r->assertJsonPath('data.pengguna.per_peran.guru', ['total' => 2, 'aktif' => 1, 'nonaktif' => 1]);
        $r->assertJsonPath('data.pengguna.per_peran.siswa', ['total' => 3, 'aktif' => 2, 'nonaktif' => 1]);
        $r->assertJsonPath('data.kelas', ['total' => 2, 'aktif' => 1, 'diarsipkan' => 1]);
        $r->assertJsonPath('data.mata_pelajaran', ['total' => 3, 'aktif' => 2, 'diarsipkan' => 1]);

        $r->assertJsonPath('data.presensi.jumlah_sesi', 3);
        $r->assertJsonPath('data.presensi.total_presensi', 5);
        $r->assertJsonPath('data.presensi.per_status_kehadiran', ['hadir' => 2, 'terlambat' => 1, 'izin' => 1, 'sakit' => 0, 'alpa' => 1]);
        $r->assertJsonPath('data.presensi.per_status_lokasi.valid', 2);
        $r->assertJsonPath('data.presensi.per_status_lokasi.tidak_valid', 1);
        $r->assertJsonPath('data.presensi.per_status_lokasi.belum_divalidasi', 2);

        $aktif = $r->json('data.aktivitas_sistem');
        $this->assertSame(6, $aktif['tujuh_hari_terakhir']['pengguna_baru']);
        $this->assertSame(1, $aktif['tujuh_hari_terakhir']['pengumuman_dibuat']); // yang berumur 10 hari tidak dihitung
        $this->assertSame(6, $aktif['tujuh_hari_terakhir']['presensi_dicatat']);
        $this->assertSame(['log_login', 'audit_perubahan'], $aktif['tidak_tersedia']);
    }

    public function test_periode_presensi_admin_dapat_diatur(): void
    {
        $admin = Pengguna::factory()->admin()->create();
        $guru = Pengguna::factory()->guru()->create();
        $s = Pengguna::factory()->create();
        $kelas = Kelas::factory()->create(['id_wali' => $guru->id_pengguna]);
        $kelas->siswa()->attach($s->id_pengguna);
        $mapel = MataPelajaran::factory()->create(['id_guru' => $guru->id_pengguna]);
        $lama = $this->buatJadwal($mapel, $kelas, $guru, $this->kemarin(60));
        Presensi::factory()->create(['id_siswa' => $s->id_pengguna, 'id_jadwal' => $lama->id_jadwal]);

        $dari = $this->kemarin(61)->format('Y-m-d');
        $sampai = $this->kemarin(59)->format('Y-m-d');

        $this->sebagai($admin)->getJson('/api/v1/dashboard')->assertOk()->assertJsonPath('data.presensi.total_presensi', 0);
        $this->sebagai($admin)->getJson("/api/v1/dashboard?dari=$dari&sampai=$sampai")->assertOk()
            ->assertJsonPath('data.presensi.total_presensi', 1)
            ->assertJsonPath('data.presensi.jumlah_sesi', 1)
            ->assertJsonPath('data.presensi.periode.dari', $dari);
    }

    // ------------------------------------------------------------- otorisasi

    public function test_isi_dashboard_ditentukan_peran_server_bukan_input_klien(): void
    {
        $siswa = Pengguna::factory()->create();
        $guru = Pengguna::factory()->guru()->create();

        foreach ([$siswa, $guru] as $pelaku) {
            $r = $this->sebagai($pelaku)->getJson('/api/v1/dashboard?peran=admin&role=admin&id_pengguna=1')->assertOk();
            $this->assertSame($pelaku->peran->value, $r->json('data.peran'));
            $this->assertArrayNotHasKey('pengguna', $r->json('data'));
            $this->assertArrayNotHasKey('aktivitas_sistem', $r->json('data'));
        }
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $nonaktif = Pengguna::factory()->nonaktif()->create();

        $this->sebagai($nonaktif)->getJson('/api/v1/dashboard')->assertUnauthorized();
    }
}
