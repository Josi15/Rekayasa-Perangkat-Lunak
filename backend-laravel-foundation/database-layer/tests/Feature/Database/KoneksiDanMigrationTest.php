<?php

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\DatabaseTestCase;

class KoneksiDanMigrationTest extends DatabaseTestCase
{
    private const TABEL = [
        'pengguna', 'kelas', 'siswa_kelas', 'jadwal', 'presensi', 'mata_pelajaran',
        'materi', 'tugas', 'pengumpulan_tugas', 'kuis', 'nilai', 'pengumuman',
    ];

    public function test_terhubung_ke_postgresql(): void
    {
        $this->assertSame('pgsql', DB::connection()->getDriverName());
        $this->assertSame(1, (int) DB::selectOne('select 1 as ok')->ok);
        $this->assertStringContainsString('PostgreSQL', DB::selectOne('select version() as v')->v);
        $this->assertStringEndsWith('_test', DB::connection()->getDatabaseName());
    }

    public function test_dua_belas_tabel_erd_ada_dan_tabel_users_bawaan_tidak_ada(): void
    {
        foreach (self::TABEL as $tabel) {
            $this->assertTrue(Schema::hasTable($tabel), "Tabel {$tabel} tidak ada");
        }
        $this->assertFalse(Schema::hasTable('users'));
    }

    public function test_primary_key_sesuai_erd(): void
    {
        $diharapkan = [
            'pengguna' => ['id_pengguna'], 'kelas' => ['id_kelas'],
            'siswa_kelas' => ['id_siswa', 'id_kelas'], 'jadwal' => ['id_jadwal'],
            'presensi' => ['id_presensi'], 'mata_pelajaran' => ['id_mapel'],
            'materi' => ['id_materi'], 'tugas' => ['id_tugas'],
            'pengumpulan_tugas' => ['id_pengumpulan'], 'kuis' => ['id_kuis'],
            'nilai' => ['id_nilai'], 'pengumuman' => ['id_pengumuman'],
        ];

        foreach ($diharapkan as $tabel => $kolom) {
            $this->assertSame($kolom, $this->kolomPrimaryKey($tabel), "PK {$tabel}");
        }
    }

    public function test_foreign_key_sesuai_erd(): void
    {
        $ada = collect(DB::select(<<<'SQL'
            select conrelid::regclass::text as tabel, confrelid::regclass::text as ref
            from pg_constraint
            where contype = 'f' and connamespace = current_schema()::regnamespace
        SQL))->map(fn ($r) => "{$r->tabel}>{$r->ref}")->unique()->all();

        $diharapkan = [
            'kelas>pengguna', 'siswa_kelas>pengguna', 'siswa_kelas>kelas',
            'mata_pelajaran>pengguna', 'jadwal>mata_pelajaran', 'jadwal>kelas', 'jadwal>pengguna',
            'presensi>pengguna', 'presensi>jadwal', 'materi>mata_pelajaran', 'tugas>mata_pelajaran',
            'pengumpulan_tugas>pengguna', 'pengumpulan_tugas>tugas', 'kuis>mata_pelajaran',
            'nilai>pengguna', 'nilai>pengumpulan_tugas', 'nilai>kuis',
            'pengumuman>pengguna', 'pengumuman>mata_pelajaran',
        ];

        foreach ($diharapkan as $fk) {
            $this->assertContains($fk, $ada, "FK {$fk} tidak ditemukan");
        }
    }

    public function test_kolom_nullable_sesuai_erd(): void
    {
        $nullable = [
            'pengguna' => ['nisn', 'nip', 'username'],
            'nilai' => ['id_pengumpulan', 'id_kuis', 'umpan_balik'],
            'pengumuman' => ['id_mapel'],
            'presensi' => ['waktu_checkin', 'lokasi_lat', 'lokasi_lng'],
            'tugas' => ['lampiran'],
        ];
        $wajib = [
            'pengguna' => ['password', 'peran'], 'kelas' => ['nama_kelas', 'id_wali'],
            'nilai' => ['id_siswa', 'nilai'], 'pengumuman' => ['judul', 'isi', 'cakupan', 'id_penulis'],
            'jadwal' => ['id_mapel', 'id_kelas', 'id_guru', 'waktu_mulai', 'waktu_selesai'],
        ];

        foreach ($nullable as $tabel => $kolom) {
            foreach ($kolom as $k) {
                $this->assertSame('YES', $this->isNullable($tabel, $k), "{$tabel}.{$k} harus nullable");
            }
        }
        foreach ($wajib as $tabel => $kolom) {
            foreach ($kolom as $k) {
                $this->assertSame('NO', $this->isNullable($tabel, $k), "{$tabel}.{$k} harus NOT NULL");
            }
        }
    }

    public function test_migration_bisa_di_rollback_dan_diulang(): void
    {
        // Aman: hanya berjalan di database *_test (dijaga DatabaseTestCase).
        $this->artisan('migrate:rollback')->assertSuccessful(); // seluruh batch migrate:fresh
        $this->assertFalse(Schema::hasTable('pengguna'));
        $this->assertFalse(Schema::hasTable('nilai'));

        $this->artisan('migrate')->assertSuccessful();
        $this->assertTrue(Schema::hasTable('pengguna'));
        $this->assertTrue(Schema::hasTable('nilai'));
    }

    /** @return list<string> */
    private function kolomPrimaryKey(string $tabel): array
    {
        return collect(DB::select(<<<'SQL'
            select kcu.column_name
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
              on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
            where tc.constraint_type = 'PRIMARY KEY' and tc.table_name = ? and tc.table_schema = current_schema()
            order by kcu.ordinal_position
        SQL, [$tabel]))->pluck('column_name')->all();
    }

    private function isNullable(string $tabel, string $kolom): string
    {
        return DB::selectOne(
            'select is_nullable from information_schema.columns where table_schema = current_schema() and table_name = ? and column_name = ?',
            [$tabel, $kolom]
        )->is_nullable;
    }
}
