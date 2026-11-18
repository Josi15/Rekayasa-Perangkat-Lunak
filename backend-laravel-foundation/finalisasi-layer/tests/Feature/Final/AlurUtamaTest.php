<?php

namespace Tests\Feature\Final;

use App\Models\Pengguna;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\MasterApi;
use Tests\DatabaseTestCase;

/**
 * Alur utama LMS dari awal sampai akhir MELALUI API (bukan factory): admin menyiapkan data master, guru membuat tugas,
 * siswa mengumpulkan & presensi, guru menilai, lalu dashboard ketiga peran dibandingkan dengan angka yang diketahui.
 * Menangkap kegagalan integrasi antar-modul yang tidak terlihat pada test per-modul.
 */
class AlurUtamaTest extends DatabaseTestCase
{
    use MasterApi;

    private const REF_LAT = -6.2000000;

    private const REF_LNG = 106.8166667;

    public function test_alur_sekolah_dari_pembuatan_data_sampai_dashboard(): void
    {
        Storage::fake((string) config('tugas.disk'));
        config(['presensi.lokasi.lat' => self::REF_LAT, 'presensi.lokasi.lng' => self::REF_LNG, 'presensi.lokasi.radius_meter' => 100,
            'presensi.lokasi.wajib' => true, 'presensi.lokasi.luar_radius' => 'tolak']);

        $admin = Pengguna::factory()->admin()->create();

        // 1. Admin membuat guru & siswa lewat API
        $idGuru = $this->sebagai($admin)->postJson('/api/v1/admin/pengguna', ['peran' => 'guru', 'nip' => '198001012005011001', 'password' => self::PASSWORD_UJI])
            ->assertCreated()->json('data.id_pengguna');
        $idSiswa = $this->sebagai($admin)->postJson('/api/v1/admin/pengguna', ['peran' => 'siswa', 'nisn' => '0012345678', 'password' => self::PASSWORD_UJI])
            ->assertCreated()->json('data.id_pengguna');

        // 2. Login siswa dengan NISN berhasil
        $this->postJson('/api/v1/auth/login', ['login' => '0012345678', 'password' => self::PASSWORD_UJI])->assertOk();

        $guru = Pengguna::query()->findOrFail($idGuru);
        $siswa = Pengguna::query()->findOrFail($idSiswa);

        // 3. Kelas, anggota, mapel, jadwal
        $idKelas = $this->sebagai($admin)->postJson('/api/v1/kelas', ['nama_kelas' => 'X IPA 1', 'id_wali' => $idGuru])->assertCreated()->json('data.id_kelas');
        $this->sebagai($admin)->postJson("/api/v1/kelas/$idKelas/anggota", ['id_siswa' => [$idSiswa]])->assertCreated();
        $idMapel = $this->sebagai($admin)->postJson('/api/v1/mapel', ['nama_mapel' => 'Matematika', 'id_guru' => $idGuru])->assertCreated()->json('data.id_mapel');

        $mulai = now()->addDay()->setTime(9, 0);
        $idJadwal = $this->sebagai($admin)->postJson('/api/v1/jadwal', [
            'id_mapel' => $idMapel, 'id_kelas' => $idKelas, 'waktu_mulai' => $mulai->toIso8601String(), 'waktu_selesai' => $mulai->copy()->addMinutes(90)->toIso8601String(),
        ])->assertCreated()->json('data.id_jadwal');

        // jadwal bentrok untuk kelas yang sama ditolak
        $this->sebagai($admin)->postJson('/api/v1/jadwal', [
            'id_mapel' => $idMapel, 'id_kelas' => $idKelas, 'waktu_mulai' => $mulai->copy()->addMinutes(30)->toIso8601String(), 'waktu_selesai' => $mulai->copy()->addMinutes(120)->toIso8601String(),
        ])->assertStatus(409);

        // 4. Guru membuat tugas; siswa melihat dan mengumpulkan
        $idTugas = $this->sebagai($guru)->postJson("/api/v1/mapel/$idMapel/tugas", [
            'judul' => 'Latihan Aljabar', 'instruksi' => 'Kerjakan soal 1-10.', 'batas_waktu' => now()->addDays(10)->toIso8601String(),
        ])->assertCreated()->json('data.id_tugas');

        $this->sebagai($siswa)->getJson('/api/v1/dashboard')->assertOk()->assertJsonPath('data.tugas_belum_dikumpulkan.total', 1);

        $idPengumpulan = $this->sebagai($siswa)->post("/api/v1/tugas/$idTugas/pengumpulan", ['file' => UploadedFile::fake()->create('jawaban.pdf', 40, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertCreated()->json('data.id_pengumpulan');

        // 5. Guru menilai; siswa melihat; siswa tidak dapat mengubah
        $idNilai = $this->sebagai($guru)->postJson("/api/v1/pengumpulan/$idPengumpulan/nilai", ['nilai' => 88, 'umpan_balik' => 'Baik.'])->assertCreated()->json('data.id_nilai');

        $this->sebagai($siswa)->getJson('/api/v1/nilai/saya')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nilai', 88.0);
        $this->sebagai($siswa)->patchJson("/api/v1/nilai/$idNilai", ['nilai' => 100])->assertForbidden();

        // 6. Pengumuman: global oleh admin, mapel oleh guru; siswa melihat keduanya
        $this->sebagai($admin)->postJson('/api/v1/pengumuman', ['judul' => 'Libur', 'isi' => 'Besok libur.', 'cakupan' => 'global'])->assertCreated();
        $this->sebagai($guru)->postJson('/api/v1/pengumuman', ['judul' => 'PR', 'isi' => 'Kerjakan hal 20.', 'cakupan' => 'mapel', 'id_mapel' => $idMapel])->assertCreated();
        $this->sebagai($siswa)->getJson('/api/v1/pengumuman')->assertOk()->assertJsonCount(2, 'data');

        // 7. Presensi: check-in di titik referensi pada jendela waktu jadwal
        $this->travelTo($mulai->copy()->addMinutes(5));

        $this->sebagai($siswa)->postJson("/api/v1/jadwal/$idJadwal/checkin", ['lokasi_lat' => self::REF_LAT, 'lokasi_lng' => self::REF_LNG])
            ->assertCreated()->assertJsonPath('data.status_kehadiran', 'hadir')->assertJsonPath('data.status_validasi_lokasi', 'valid');
        $this->sebagai($siswa)->postJson("/api/v1/jadwal/$idJadwal/checkin", ['lokasi_lat' => self::REF_LAT, 'lokasi_lng' => self::REF_LNG])->assertStatus(409);
        $this->sebagai($guru)->getJson("/api/v1/jadwal/$idJadwal/presensi")->assertOk()->assertJsonCount(1, 'data');

        // 8. Dashboard tiga peran sesuai angka yang diketahui
        $s = $this->sebagai($siswa)->getJson('/api/v1/dashboard')->assertOk()->json('data');
        $this->assertSame(1, $s['jumlah_kelas']);
        $this->assertSame(0, $s['tugas_belum_dikumpulkan']['total']);
        $this->assertSame(1, $s['ringkasan_nilai']['jumlah_nilai']);
        $this->assertEquals(88, $s['ringkasan_nilai']['tertinggi']);
        $this->assertSame($idJadwal, $s['jadwal_terdekat'][0]['id_jadwal']);
        $this->assertCount(2, $s['pengumuman_terbaru']);

        $g = $this->sebagai($guru)->getJson('/api/v1/dashboard')->assertOk()->json('data');
        $this->assertSame(1, $g['jumlah_kelas_diajar']);
        $this->assertSame(1, $g['jumlah_siswa']);
        $this->assertSame(0, $g['tugas_perlu_dinilai']);
        $this->assertSame(1, $g['ringkasan_pengumpulan']['per_status']['dinilai']);

        $a = $this->sebagai($admin)->getJson('/api/v1/dashboard')->assertOk()->json('data');
        $this->assertSame(['total' => 1, 'aktif' => 1, 'nonaktif' => 0], $a['pengguna']['per_peran']['siswa']);
        $this->assertSame(1, $a['kelas']['aktif']);
        $this->assertSame(1, $a['mata_pelajaran']['aktif']);
        $this->assertSame(1, $a['presensi']['total_presensi']);
        $this->assertSame(1, $a['presensi']['per_status_kehadiran']['hadir']);

        // 9. Rekap presensi periode ini
        $tgl = $mulai->format('Y-m-d');
        $this->sebagai($guru)->getJson("/api/v1/rekap/presensi?dari=$tgl&sampai=$tgl")->assertOk()->assertJsonPath('data.0.hadir', 1);
    }

    public function test_siswa_di_luar_radius_ditolak_dan_koordinat_klien_tidak_menentukan_status(): void
    {
        config(['presensi.lokasi.lat' => self::REF_LAT, 'presensi.lokasi.lng' => self::REF_LNG, 'presensi.lokasi.radius_meter' => 100, 'presensi.lokasi.luar_radius' => 'tolak']);
        $admin = Pengguna::factory()->admin()->create();
        $guru = Pengguna::factory()->guru()->create();
        $siswa = Pengguna::factory()->create();
        $idKelas = $this->sebagai($admin)->postJson('/api/v1/kelas', ['nama_kelas' => 'X IPA 2', 'id_wali' => $guru->id_pengguna])->assertCreated()->json('data.id_kelas');
        $this->sebagai($admin)->postJson("/api/v1/kelas/$idKelas/anggota", ['id_siswa' => [$siswa->id_pengguna]])->assertCreated();
        $idMapel = $this->sebagai($admin)->postJson('/api/v1/mapel', ['nama_mapel' => 'Fisika', 'id_guru' => $guru->id_pengguna])->assertCreated()->json('data.id_mapel');
        $mulai = now()->addDay()->setTime(10, 0);
        $idJadwal = $this->sebagai($admin)->postJson('/api/v1/jadwal', ['id_mapel' => $idMapel, 'id_kelas' => $idKelas,
            'waktu_mulai' => $mulai->toIso8601String(), 'waktu_selesai' => $mulai->copy()->addHour()->toIso8601String()])->assertCreated()->json('data.id_jadwal');

        $this->travelTo($mulai);

        // klien mencoba memaksakan status valid: ditolak (422) dan tidak tersimpan
        $this->sebagai($siswa)->postJson("/api/v1/jadwal/$idJadwal/checkin", ['lokasi_lat' => -6.2, 'lokasi_lng' => 106.8166667, 'status_validasi_lokasi' => 'valid'])->assertUnprocessable();
        // ±5 km dari titik referensi: ditolak server walau koordinat sah
        $this->sebagai($siswa)->postJson("/api/v1/jadwal/$idJadwal/checkin", ['lokasi_lat' => -6.245, 'lokasi_lng' => 106.8166667])->assertStatus(409)->assertJsonPath('code', 'outside_radius');
        $this->assertDatabaseMissing('presensi', ['id_siswa' => $siswa->id_pengguna, 'id_jadwal' => $idJadwal]);
    }
}
