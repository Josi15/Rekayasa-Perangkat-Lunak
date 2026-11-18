<?php

namespace Tests\Feature\Database;

use App\Models\Pengguna;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\DatabaseTestCase;

class SeederDanPasswordTest extends DatabaseTestCase
{
    private const TABEL = [
        'pengguna', 'kelas', 'siswa_kelas', 'jadwal', 'presensi', 'mata_pelajaran',
        'materi', 'tugas', 'pengumpulan_tugas', 'kuis', 'nilai', 'pengumuman',
    ];

    public function test_password_disimpan_ter_hash_bukan_plaintext(): void
    {
        $pengguna = Pengguna::factory()->withPassword('RahasiaKuat123')->create();

        $mentah = DB::table('pengguna')->where('id_pengguna', $pengguna->id_pengguna)->value('password');

        $this->assertNotSame('RahasiaKuat123', $mentah);
        $this->assertStringStartsWith('$2y$', $mentah);
        $this->assertTrue(Hash::check('RahasiaKuat123', $mentah));
        $this->assertFalse(Hash::check('salah', $mentah));
        $this->assertArrayNotHasKey('password', $pengguna->toArray());
        $this->assertArrayNotHasKey('remember_token', $pengguna->toArray());
    }

    public function test_mengubah_password_juga_di_hash(): void
    {
        $pengguna = Pengguna::factory()->create();
        $pengguna->password = 'PasswordBaru456';
        $pengguna->save();

        $this->assertNotSame('PasswordBaru456', $pengguna->fresh()->getRawOriginal('password'));
        $this->assertTrue(Hash::check('PasswordBaru456', $pengguna->fresh()->password));
    }

    public function test_pengguna_terhubung_ke_autentikasi_laravel(): void
    {
        $this->assertSame(Pengguna::class, config('auth.providers.users.model'));

        $guru = Pengguna::factory()->guru()->withPassword('RahasiaKuat123')->create();

        $this->assertTrue(Auth::validate(['username' => $guru->username, 'password' => 'RahasiaKuat123']));
        $this->assertFalse(Auth::validate(['username' => $guru->username, 'password' => 'salah']));
        $this->assertSame('id_pengguna', $guru->getAuthIdentifierName());
    }

    public function test_peran_tidak_bisa_di_mass_assign(): void
    {
        $pengguna = new Pengguna(['username' => 'x', 'password' => 'y', 'peran' => 'admin']);

        $this->assertNull($pengguna->peran);
    }

    public function test_seeder_mengisi_semua_tabel_dengan_data_konsisten(): void
    {
        config(['simba.seed_password' => 'demo-test-pass']);

        $this->seed(DatabaseSeeder::class);

        foreach (self::TABEL as $tabel) {
            $this->assertGreaterThan(0, DB::table($tabel)->count(), "Tabel {$tabel} kosong setelah seeding");
        }

        // Wali kelas, guru mapel, guru jadwal harus berperan guru.
        $this->assertSame(0, DB::table('kelas')->join('pengguna', 'pengguna.id_pengguna', '=', 'kelas.id_wali')->where('peran', '<>', 'guru')->count());
        $this->assertSame(0, DB::table('mata_pelajaran')->join('pengguna', 'pengguna.id_pengguna', '=', 'mata_pelajaran.id_guru')->where('peran', '<>', 'guru')->count());
        $this->assertSame(0, DB::table('jadwal')->join('mata_pelajaran', 'mata_pelajaran.id_mapel', '=', 'jadwal.id_mapel')->whereColumn('jadwal.id_guru', '<>', 'mata_pelajaran.id_guru')->count());

        // Presensi hanya untuk siswa yang terdaftar di kelas jadwalnya.
        $presensiYatim = DB::table('presensi')
            ->join('jadwal', 'jadwal.id_jadwal', '=', 'presensi.id_jadwal')
            ->leftJoin('siswa_kelas', fn ($j) => $j->on('siswa_kelas.id_siswa', '=', 'presensi.id_siswa')->on('siswa_kelas.id_kelas', '=', 'jadwal.id_kelas'))
            ->whereNull('siswa_kelas.id_siswa')->count();
        $this->assertSame(0, $presensiYatim);

        // Semua nilai punya tepat satu sumber; pengumuman global admin, mapel oleh guru mapel.
        $this->assertSame(DB::table('nilai')->count(), DB::table('nilai')->whereRaw('(id_pengumpulan is null) <> (id_kuis is null)')->count());
        $this->assertSame(0, DB::table('pengumuman')->where('cakupan', 'global')->whereNotNull('id_mapel')->count());
        $this->assertSame(0, DB::table('pengumuman')->join('mata_pelajaran', 'mata_pelajaran.id_mapel', '=', 'pengumuman.id_mapel')->whereColumn('pengumuman.id_penulis', '<>', 'mata_pelajaran.id_guru')->count());

        // Akun demo bisa login dengan password dari config, dan hash-nya bukan plaintext.
        $admin = Pengguna::query()->where('username', 'admin')->firstOrFail();
        $this->assertNotSame('demo-test-pass', $admin->getRawOriginal('password'));
        $this->assertTrue(Auth::validate(['username' => 'admin', 'password' => 'demo-test-pass']));
    }

    public function test_seeder_tidak_menimpa_atau_menggandakan_data_yang_sudah_ada(): void
    {
        config(['simba.seed_password' => 'demo-test-pass']);

        $this->seed(DatabaseSeeder::class);
        $sebelum = collect(self::TABEL)->mapWithKeys(fn ($t) => [$t => DB::table($t)->count()]);

        $this->seed(DatabaseSeeder::class); // kedua: harus dilewati

        foreach (self::TABEL as $tabel) {
            $this->assertSame($sebelum[$tabel], DB::table($tabel)->count(), "{$tabel} berubah pada seeding kedua");
        }
    }
}
