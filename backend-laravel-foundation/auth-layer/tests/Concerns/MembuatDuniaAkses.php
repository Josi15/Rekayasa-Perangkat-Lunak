<?php

namespace Tests\Concerns;

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

/**
 * Dunia uji dua sisi: A dan B tidak saling terkait.
 *  Kelas A: wali guruA, siswa1, mapel A (guruA), jadwal A.
 *  Kelas B: wali guruB, siswa2, mapel B (guruB), jadwal B.
 *  guruC & admin tidak terkait kelas/mapel apa pun.
 */
trait MembuatDuniaAkses
{
    protected function buatDunia(): object
    {
        $d = new \stdClass;

        $d->admin = Pengguna::factory()->admin()->create();
        $d->guruA = Pengguna::factory()->guru()->create();
        $d->guruB = Pengguna::factory()->guru()->create();
        $d->guruC = Pengguna::factory()->guru()->create();
        $d->siswa1 = Pengguna::factory()->create();
        $d->siswa2 = Pengguna::factory()->create();

        $d->kelasA = Kelas::factory()->create(['id_wali' => $d->guruA->id_pengguna]);
        $d->kelasB = Kelas::factory()->create(['id_wali' => $d->guruB->id_pengguna]);
        $d->kelasA->siswa()->attach($d->siswa1->id_pengguna);
        $d->kelasB->siswa()->attach($d->siswa2->id_pengguna);

        $d->mapelA = MataPelajaran::factory()->create(['id_guru' => $d->guruA->id_pengguna]);
        $d->mapelB = MataPelajaran::factory()->create(['id_guru' => $d->guruB->id_pengguna]);

        $d->jadwalA = Jadwal::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasA->id_kelas]);
        $d->jadwalB = Jadwal::factory()->create(['id_mapel' => $d->mapelB->id_mapel, 'id_kelas' => $d->kelasB->id_kelas]);

        $d->materiA = Materi::factory()->create(['id_mapel' => $d->mapelA->id_mapel]);
        $d->materiB = Materi::factory()->create(['id_mapel' => $d->mapelB->id_mapel]);
        $d->tugasA = Tugas::factory()->create(['id_mapel' => $d->mapelA->id_mapel]);
        $d->tugasB = Tugas::factory()->create(['id_mapel' => $d->mapelB->id_mapel]);
        $d->kuisA = Kuis::factory()->create(['id_mapel' => $d->mapelA->id_mapel]);
        $d->kuisB = Kuis::factory()->create(['id_mapel' => $d->mapelB->id_mapel]);

        $d->presensiA = Presensi::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_jadwal' => $d->jadwalA->id_jadwal]);
        $d->presensiB = Presensi::factory()->create(['id_siswa' => $d->siswa2->id_pengguna, 'id_jadwal' => $d->jadwalB->id_jadwal]);

        $d->pengumpulanA = PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_tugas' => $d->tugasA->id_tugas]);
        $d->pengumpulanB = PengumpulanTugas::factory()->create(['id_siswa' => $d->siswa2->id_pengguna, 'id_tugas' => $d->tugasB->id_tugas]);

        $d->nilaiTugasA = Nilai::factory()->dariPengumpulan($d->pengumpulanA)->create();
        $d->nilaiTugasB = Nilai::factory()->dariPengumpulan($d->pengumpulanB)->create();
        $d->nilaiKuisA = Nilai::factory()->create(['id_siswa' => $d->siswa1->id_pengguna, 'id_kuis' => $d->kuisA->id_kuis]);

        $d->pengumumanGlobal = Pengumuman::factory()->create(['id_penulis' => $d->admin->id_pengguna]);
        $d->pengumumanA = Pengumuman::factory()->untukMapel($d->mapelA)->create();
        $d->pengumumanB = Pengumuman::factory()->untukMapel($d->mapelB)->create();

        return $d;
    }
}
