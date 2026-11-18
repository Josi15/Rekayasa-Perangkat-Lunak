<?php

namespace Tests\Feature\Database;

use App\Models\Kuis;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\DatabaseTestCase;

class AturanNilaiTest extends DatabaseTestCase
{
    public function test_nilai_dari_pengumpulan_saja_diterima(): void
    {
        $nilai = Nilai::factory()->dariPengumpulan()->create()->fresh();

        $this->assertNotNull($nilai->id_pengumpulan);
        $this->assertNull($nilai->id_kuis);
    }

    public function test_nilai_dari_kuis_saja_diterima(): void
    {
        $nilai = Nilai::factory()->create()->fresh();

        $this->assertNull($nilai->id_pengumpulan);
        $this->assertNotNull($nilai->id_kuis);
    }

    public function test_umpan_balik_boleh_kosong(): void
    {
        $nilai = Nilai::factory()->create(['umpan_balik' => null])->fresh();

        $this->assertNull($nilai->umpan_balik);
    }

    public function test_model_menolak_nilai_tanpa_sumber(): void
    {
        $siswa = Pengguna::factory()->create();

        $this->expectException(ValidationException::class);
        Nilai::query()->create(['id_siswa' => $siswa->id_pengguna, 'nilai' => 80]);
    }

    public function test_model_menolak_nilai_dengan_dua_sumber(): void
    {
        $pengumpulan = PengumpulanTugas::factory()->create();
        $kuis = Kuis::factory()->create();

        $this->expectException(ValidationException::class);
        Nilai::query()->create([
            'id_siswa' => $pengumpulan->id_siswa,
            'id_pengumpulan' => $pengumpulan->id_pengumpulan,
            'id_kuis' => $kuis->id_kuis,
            'nilai' => 80,
        ]);
    }

    public function test_model_menolak_siswa_yang_bukan_pemilik_pengumpulan(): void
    {
        $pengumpulan = PengumpulanTugas::factory()->create();
        $lain = Pengguna::factory()->create();

        $this->expectException(ValidationException::class);
        Nilai::query()->create([
            'id_siswa' => $lain->id_pengguna, 'id_pengumpulan' => $pengumpulan->id_pengumpulan, 'nilai' => 80,
        ]);
    }

    public function test_database_menolak_tanpa_sumber_dan_dua_sumber_meski_model_dilewati(): void
    {
        $pengumpulan = PengumpulanTugas::factory()->create();
        $kuis = Kuis::factory()->create();
        $dasar = ['id_siswa' => $pengumpulan->id_siswa, 'nilai' => 80, 'created_at' => now(), 'updated_at' => now()];

        $this->assertDatabaseRejects(fn () => DB::table('nilai')->insert($dasar), 'tanpa sumber');
        $this->assertDatabaseRejects(fn () => DB::table('nilai')->insert($dasar + [
            'id_pengumpulan' => $pengumpulan->id_pengumpulan, 'id_kuis' => $kuis->id_kuis,
        ]), 'dua sumber');
    }

    public function test_database_menolak_siswa_tidak_cocok_dengan_pemilik_pengumpulan(): void
    {
        $pengumpulan = PengumpulanTugas::factory()->create();
        $lain = Pengguna::factory()->create();

        $this->assertDatabaseRejects(fn () => DB::table('nilai')->insert([
            'id_siswa' => $lain->id_pengguna, 'id_pengumpulan' => $pengumpulan->id_pengumpulan,
            'nilai' => 80, 'created_at' => now(), 'updated_at' => now(),
        ]));
    }

    public function test_satu_nilai_per_pengumpulan_dan_per_siswa_per_kuis(): void
    {
        $pengumpulan = PengumpulanTugas::factory()->create();
        Nilai::factory()->dariPengumpulan($pengumpulan)->create();
        $this->assertDatabaseRejects(fn () => Nilai::factory()->dariPengumpulan($pengumpulan)->create());

        $nilaiKuis = Nilai::factory()->create();
        $this->assertDatabaseRejects(fn () => Nilai::factory()->create([
            'id_siswa' => $nilaiKuis->id_siswa, 'id_kuis' => $nilaiKuis->id_kuis,
        ]));
    }

    public function test_rentang_nilai_0_sampai_100(): void
    {
        $this->assertDatabaseRejects(fn () => Nilai::factory()->create(['nilai' => 100.5]));
        $this->assertDatabaseRejects(fn () => Nilai::factory()->create(['nilai' => -1]));
        Nilai::factory()->create(['nilai' => 0]);
        Nilai::factory()->create(['nilai' => 100]);
        $this->assertSame(2, Nilai::query()->count());
    }
}
