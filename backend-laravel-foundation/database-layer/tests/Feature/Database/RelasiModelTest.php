<?php

namespace Tests\Feature\Database;

use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\Kuis;
use App\Models\MataPelajaran;
use App\Models\Materi;
use App\Models\Nilai;
use App\Models\Pengguna;
use App\Models\PengumpulanTugas;
use App\Models\Pengumuman;
use App\Models\Presensi;
use App\Models\Tugas;
use Tests\DatabaseTestCase;

class RelasiModelTest extends DatabaseTestCase
{
    public function test_pengguna_kelas_dan_keanggotaan_siswa(): void
    {
        $wali = Pengguna::factory()->guru()->create();
        $kelas = Kelas::factory()->create(['id_wali' => $wali->id_pengguna]);
        $siswa = Pengguna::factory()->count(2)->create();

        $kelas->siswa()->attach($siswa->pluck('id_pengguna'));

        $this->assertTrue($kelas->wali->is($wali));
        $this->assertTrue($wali->kelasWali->first()->is($kelas));
        $this->assertCount(2, $kelas->siswa);
        $this->assertTrue($siswa[0]->kelas()->first()->is($kelas));
        $this->assertNotNull($kelas->siswa()->first()->pivot->created_at);
    }

    public function test_mapel_jadwal_presensi(): void
    {
        $mapel = MataPelajaran::factory()->create();
        $jadwal = Jadwal::factory()->create(['id_mapel' => $mapel->id_mapel]);
        $siswa = Pengguna::factory()->create();
        $presensi = Presensi::factory()->create(['id_siswa' => $siswa->id_pengguna, 'id_jadwal' => $jadwal->id_jadwal]);

        $this->assertTrue($jadwal->mataPelajaran->is($mapel));
        $this->assertTrue($jadwal->guru->is($mapel->guru));
        $this->assertTrue($jadwal->kelas->jadwal->first()->is($jadwal));
        $this->assertTrue($mapel->jadwal->first()->is($jadwal));
        $this->assertTrue($jadwal->presensi->first()->is($presensi));
        $this->assertTrue($presensi->siswa->is($siswa));
        $this->assertTrue($presensi->jadwal->is($jadwal));
        $this->assertTrue($siswa->presensi->first()->is($presensi));
        $this->assertTrue($mapel->guru->mataPelajaran->first()->is($mapel));
        $this->assertTrue($mapel->guru->jadwalMengajar->first()->is($jadwal));
    }

    public function test_materi_tugas_pengumpulan_kuis_nilai_pengumuman(): void
    {
        $mapel = MataPelajaran::factory()->create();
        $siswa = Pengguna::factory()->create();

        $materi = Materi::factory()->create(['id_mapel' => $mapel->id_mapel]);
        $tugas = Tugas::factory()->create(['id_mapel' => $mapel->id_mapel]);
        $kuis = Kuis::factory()->create(['id_mapel' => $mapel->id_mapel]);
        $kumpul = PengumpulanTugas::factory()->create(['id_siswa' => $siswa->id_pengguna, 'id_tugas' => $tugas->id_tugas]);
        $nilaiTugas = Nilai::factory()->dariPengumpulan($kumpul)->create();
        $nilaiKuis = Nilai::factory()->create(['id_siswa' => $siswa->id_pengguna, 'id_kuis' => $kuis->id_kuis]);
        $info = Pengumuman::factory()->untukMapel($mapel)->create();

        $this->assertTrue($mapel->materi->first()->is($materi));
        $this->assertTrue($materi->mataPelajaran->is($mapel));
        $this->assertTrue($mapel->tugas->first()->is($tugas));
        $this->assertTrue($tugas->pengumpulan->first()->is($kumpul));
        $this->assertTrue($kumpul->tugas->is($tugas));
        $this->assertTrue($kumpul->siswa->is($siswa));
        $this->assertTrue($kumpul->nilai->is($nilaiTugas));
        $this->assertTrue($nilaiTugas->pengumpulanTugas->is($kumpul));
        $this->assertTrue($mapel->kuis->first()->is($kuis));
        $this->assertTrue($kuis->nilai->first()->is($nilaiKuis));
        $this->assertTrue($nilaiKuis->kuis->is($kuis));
        $this->assertTrue($siswa->nilai->contains($nilaiKuis));
        $this->assertTrue($siswa->pengumpulanTugas->first()->is($kumpul));
        $this->assertTrue($mapel->pengumuman->first()->is($info));
        $this->assertTrue($info->mataPelajaran->is($mapel));
        $this->assertTrue($info->penulis->is($mapel->guru));
        $this->assertTrue($mapel->guru->pengumuman->first()->is($info));
    }

    public function test_cast_tanggal_dan_angka(): void
    {
        $jadwal = Jadwal::factory()->create()->fresh();
        $nilai = Nilai::factory()->create(['nilai' => 87.5])->fresh();

        $this->assertInstanceOf(\Carbon\CarbonInterface::class, $jadwal->waktu_mulai);
        $this->assertTrue($jadwal->waktu_selesai->greaterThan($jadwal->waktu_mulai));
        $this->assertSame('87.50', $nilai->nilai);
    }
}
