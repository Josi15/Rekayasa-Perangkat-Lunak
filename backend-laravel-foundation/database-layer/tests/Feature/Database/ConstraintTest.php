<?php

namespace Tests\Feature\Database;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Presensi;
use App\Models\SiswaKelas;
use App\Models\Tugas;
use Illuminate\Support\Facades\DB;
use Tests\DatabaseTestCase;

class ConstraintTest extends DatabaseTestCase
{
    public function test_nisn_nip_username_unik(): void
    {
        $siswa = Pengguna::factory()->create();
        $guru = Pengguna::factory()->guru()->create();

        $this->assertDatabaseRejects(fn () => Pengguna::factory()->create(['nisn' => $siswa->nisn]), 'NISN ganda');
        $this->assertDatabaseRejects(fn () => Pengguna::factory()->guru()->create(['nip' => $guru->nip]), 'NIP ganda');
        $this->assertDatabaseRejects(fn () => Pengguna::factory()->guru()->create(['username' => $guru->username]), 'username ganda');
    }

    public function test_banyak_pengguna_boleh_punya_nisn_nip_username_null(): void
    {
        Pengguna::factory()->admin()->count(2)->create(['username' => null]);

        $this->assertSame(2, Pengguna::query()->whereNull('nisn')->whereNull('nip')->whereNull('username')->count());
    }

    public function test_peran_di_luar_enum_ditolak(): void
    {
        $this->assertDatabaseRejects(function () {
            DB::table('pengguna')->insert([
                'password' => 'x', 'peran' => 'kepala_sekolah', 'created_at' => now(), 'updated_at' => now(),
            ]);
        });
    }

    public function test_pasangan_siswa_kelas_tidak_boleh_duplikat(): void
    {
        $siswa = Pengguna::factory()->create();
        $kelas = Kelas::factory()->create();

        SiswaKelas::factory()->create(['id_siswa' => $siswa->id_pengguna, 'id_kelas' => $kelas->id_kelas]);

        $this->assertDatabaseRejects(
            fn () => SiswaKelas::factory()->create(['id_siswa' => $siswa->id_pengguna, 'id_kelas' => $kelas->id_kelas]),
            'Pasangan siswa-kelas ganda harus ditolak'
        );

        // Siswa yang sama di kelas lain, atau kelas yang sama dengan siswa lain, tetap boleh.
        $kelasLain = Kelas::factory()->create();
        SiswaKelas::factory()->create(['id_siswa' => $siswa->id_pengguna, 'id_kelas' => $kelasLain->id_kelas]);
        SiswaKelas::factory()->create(['id_siswa' => Pengguna::factory()->create()->id_pengguna, 'id_kelas' => $kelas->id_kelas]);

        $this->assertSame(3, SiswaKelas::query()->count());
    }

    public function test_presensi_satu_per_siswa_per_jadwal(): void
    {
        $presensi = Presensi::factory()->create();

        $this->assertDatabaseRejects(fn () => Presensi::factory()->create([
            'id_siswa' => $presensi->id_siswa, 'id_jadwal' => $presensi->id_jadwal,
        ]));
    }

    public function test_pengumpulan_satu_per_siswa_per_tugas(): void
    {
        $p = PengumpulanTugas::factory()->create();

        $this->assertDatabaseRejects(fn () => PengumpulanTugas::factory()->create([
            'id_siswa' => $p->id_siswa, 'id_tugas' => $p->id_tugas,
        ]));
    }

    public function test_jadwal_waktu_selesai_harus_setelah_mulai_dan_slot_tidak_bentrok(): void
    {
        $jadwal = Jadwal::factory()->create();

        $this->assertDatabaseRejects(fn () => Jadwal::factory()->create([
            'waktu_selesai' => $jadwal->waktu_mulai->copy()->subMinute(),
        ]), 'waktu_selesai sebelum waktu_mulai harus ditolak');

        $this->assertDatabaseRejects(fn () => Jadwal::factory()->create([
            'id_kelas' => $jadwal->id_kelas, 'waktu_mulai' => $jadwal->waktu_mulai,
            'waktu_selesai' => $jadwal->waktu_selesai,
        ]), 'kelas yang sama tidak boleh punya dua sesi mulai bersamaan');
    }

    public function test_mapel_nama_dan_guru_unik(): void
    {
        $mapel = MataPelajaran::factory()->create(['nama_mapel' => 'Matematika']);

        $this->assertDatabaseRejects(fn () => MataPelajaran::factory()->create([
            'nama_mapel' => 'Matematika', 'id_guru' => $mapel->id_guru,
        ]));
        // Guru lain boleh mengampu nama mapel yang sama.
        MataPelajaran::factory()->create(['nama_mapel' => 'Matematika']);
        $this->assertSame(2, MataPelajaran::query()->count());
    }

    public function test_foreign_key_menolak_referensi_yatim_dan_hapus_terreferensi(): void
    {
        $this->assertDatabaseRejects(fn () => Kelas::factory()->create(['id_wali' => 999999]));

        $kelas = Kelas::factory()->create();
        $this->assertDatabaseRejects(fn () => $kelas->wali()->delete(), 'wali yang masih dipakai tidak boleh terhapus');
    }

    public function test_presensi_validasi_koordinat_dan_nullable(): void
    {
        $this->assertDatabaseRejects(fn () => Presensi::factory()->create(['lokasi_lat' => 95]), 'lat di luar -90..90');
        $this->assertDatabaseRejects(fn () => Presensi::factory()->create(['lokasi_lng' => 190]), 'lng di luar -180..180');
        $this->assertDatabaseRejects(fn () => Presensi::factory()->create(['lokasi_lng' => null]), 'lat/lng harus berpasangan');

        $izin = Presensi::factory()->tanpaCheckin()->create()->fresh();
        $this->assertNull($izin->waktu_checkin);
        $this->assertNull($izin->lokasi_lat);
        $this->assertSame('belum_divalidasi', $izin->status_validasi_lokasi->value);
    }

    public function test_pengumuman_cakupan_global_tanpa_mapel_dan_mapel_wajib_mapel(): void
    {
        $admin = Pengguna::factory()->admin()->create();
        $mapel = MataPelajaran::factory()->create();
        $dasar = ['judul' => 'J', 'isi' => 'I', 'id_penulis' => $admin->id_pengguna, 'created_at' => now(), 'updated_at' => now()];

        DB::table('pengumuman')->insert($dasar + ['cakupan' => 'global', 'id_mapel' => null]);
        DB::table('pengumuman')->insert($dasar + ['cakupan' => 'mapel', 'id_mapel' => $mapel->id_mapel]);

        $this->assertDatabaseRejects(fn () => DB::table('pengumuman')->insert($dasar + ['cakupan' => 'global', 'id_mapel' => $mapel->id_mapel]));
        $this->assertDatabaseRejects(fn () => DB::table('pengumuman')->insert($dasar + ['cakupan' => 'mapel', 'id_mapel' => null]));
        $this->assertDatabaseRejects(fn () => DB::table('pengumuman')->insert($dasar + ['cakupan' => 'lainnya', 'id_mapel' => null]));
    }

    public function test_enum_peran_dipakai_pada_model(): void
    {
        $this->assertSame(Peran::Guru, Pengguna::factory()->guru()->create()->fresh()->peran);
    }
}
