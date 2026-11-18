<?php

namespace Tests\Feature\Auth;

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
use App\Models\Jadwal;
use App\Policies\KelasPolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

class PolicyTest extends DatabaseTestCase
{
    use MembuatDuniaAkses;

    private function bolehkah(Pengguna $user, string $aksi, mixed $argumen): bool
    {
        return Gate::forUser($user)->allows($aksi, $argumen);
    }

    public function test_kelas(): void
    {
        $d = $this->buatDunia();

        // Siswa hanya kelas yang diikuti; guru hanya yang terkait; admin semua.
        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->kelasA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'view', $d->kelasB));
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->kelasA));
        $this->assertFalse($this->bolehkah($d->guruA, 'view', $d->kelasB));
        $this->assertFalse($this->bolehkah($d->guruC, 'view', $d->kelasA));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->kelasA));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->kelasB));

        // Pengajar pada jadwal (bukan wali) juga terkait.
        Jadwal::factory()->create(['id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasB->id_kelas, 'id_guru' => $d->guruA->id_pengguna]);
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->kelasB));

        // Hanya admin yang mengelola kelas.
        foreach ([$d->siswa1, $d->guruA, $d->guruC] as $bukanAdmin) {
            $this->assertFalse($this->bolehkah($bukanAdmin, 'create', Kelas::class));
            $this->assertFalse($this->bolehkah($bukanAdmin, 'update', $d->kelasA));
            $this->assertFalse($this->bolehkah($bukanAdmin, 'delete', $d->kelasA));
        }
        $this->assertTrue($this->bolehkah($d->admin, 'create', Kelas::class));
        $this->assertTrue($this->bolehkah($d->admin, 'update', $d->kelasA));
    }

    public function test_scope_daftar_kelas_konsisten_dengan_view(): void
    {
        $d = $this->buatDunia();

        foreach ([$d->admin, $d->guruA, $d->guruB, $d->guruC, $d->siswa1, $d->siswa2] as $pengguna) {
            $terlihat = KelasPolicy::scope(Kelas::query(), $pengguna)->pluck('id_kelas')->all();

            foreach (Kelas::all() as $kelas) {
                $this->assertSame(
                    $this->bolehkah($pengguna, 'view', $kelas),
                    in_array($kelas->id_kelas, $terlihat, true),
                    "scope dan view tidak konsisten untuk pengguna {$pengguna->id_pengguna} / kelas {$kelas->id_kelas}"
                );
            }
        }
    }

    public function test_mata_pelajaran_dan_jadwal(): void
    {
        $d = $this->buatDunia();

        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->mapelA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'view', $d->mapelB));
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->mapelA));
        $this->assertFalse($this->bolehkah($d->guruA, 'view', $d->mapelB));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->mapelB));
        $this->assertFalse($this->bolehkah($d->guruA, 'update', $d->mapelA)); // mapel = sumber daya administratif
        $this->assertTrue($this->bolehkah($d->admin, 'update', $d->mapelA));

        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->jadwalA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'view', $d->jadwalB));
        $this->assertTrue($this->bolehkah($d->guruB, 'view', $d->jadwalB));
        $this->assertFalse($this->bolehkah($d->guruB, 'view', $d->jadwalA));
        $this->assertFalse($this->bolehkah($d->guruA, 'create', Jadwal::class));
        $this->assertTrue($this->bolehkah($d->admin, 'create', Jadwal::class));
    }

    public function test_materi_tugas_kuis_dikelola_hanya_guru_pengampu(): void
    {
        $d = $this->buatDunia();

        foreach ([[Materi::class, $d->materiA, $d->materiB], [Tugas::class, $d->tugasA, $d->tugasB], [Kuis::class, $d->kuisA, $d->kuisB]] as [$kelas, $milikA, $milikB]) {
            // Lihat: siswa pengikut, guru pengampu, admin.
            $this->assertTrue($this->bolehkah($d->siswa1, 'view', $milikA));
            $this->assertFalse($this->bolehkah($d->siswa1, 'view', $milikB));
            $this->assertTrue($this->bolehkah($d->guruA, 'view', $milikA));
            $this->assertFalse($this->bolehkah($d->guruA, 'view', $milikB));
            $this->assertTrue($this->bolehkah($d->admin, 'view', $milikB));

            // Kelola: hanya guru pengampu mapel tsb.
            $this->assertTrue($this->bolehkah($d->guruA, 'create', [$kelas, $d->mapelA]));
            $this->assertFalse($this->bolehkah($d->guruA, 'create', [$kelas, $d->mapelB]));
            $this->assertTrue($this->bolehkah($d->guruA, 'update', $milikA));
            $this->assertFalse($this->bolehkah($d->guruA, 'update', $milikB));
            $this->assertTrue($this->bolehkah($d->guruA, 'delete', $milikA));
            $this->assertFalse($this->bolehkah($d->siswa1, 'update', $milikA));
            $this->assertFalse($this->bolehkah($d->siswa1, 'create', [$kelas, $d->mapelA]));
            $this->assertFalse($this->bolehkah($d->admin, 'update', $milikA));
            $this->assertFalse($this->bolehkah($d->admin, 'create', [$kelas, $d->mapelA]));
        }
    }

    public function test_presensi(): void
    {
        $d = $this->buatDunia();

        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->presensiA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'view', $d->presensiB));   // data siswa lain
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->presensiA));
        $this->assertFalse($this->bolehkah($d->guruA, 'view', $d->presensiB));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->presensiB));

        // Check-in hanya siswa pada jadwal kelasnya.
        $this->assertTrue($this->bolehkah($d->siswa1, 'create', [Presensi::class, $d->jadwalA]));
        $this->assertFalse($this->bolehkah($d->siswa1, 'create', [Presensi::class, $d->jadwalB]));
        $this->assertFalse($this->bolehkah($d->guruA, 'create', [Presensi::class, $d->jadwalA]));

        // Koreksi: guru jadwal tsb saja. Hapus: admin.
        $this->assertTrue($this->bolehkah($d->guruA, 'update', $d->presensiA));
        $this->assertFalse($this->bolehkah($d->guruB, 'update', $d->presensiA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'update', $d->presensiA));
        $this->assertTrue($this->bolehkah($d->admin, 'delete', $d->presensiA));
        $this->assertFalse($this->bolehkah($d->guruA, 'delete', $d->presensiA));
    }

    public function test_pengumpulan_tugas(): void
    {
        $d = $this->buatDunia();

        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->pengumpulanA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'view', $d->pengumpulanB));
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->pengumpulanA));
        $this->assertFalse($this->bolehkah($d->guruA, 'view', $d->pengumpulanB));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->pengumpulanB));

        $this->assertTrue($this->bolehkah($d->siswa1, 'create', [PengumpulanTugas::class, $d->tugasA]));
        $this->assertFalse($this->bolehkah($d->siswa1, 'create', [PengumpulanTugas::class, $d->tugasB])); // mapel tidak diikuti
        $this->assertFalse($this->bolehkah($d->guruA, 'create', [PengumpulanTugas::class, $d->tugasA]));

        $this->assertTrue($this->bolehkah($d->siswa1, 'update', $d->pengumpulanA));
        $this->assertFalse($this->bolehkah($d->siswa2, 'update', $d->pengumpulanA));
        $this->assertFalse($this->bolehkah($d->guruA, 'update', $d->pengumpulanA));
    }

    public function test_nilai(): void
    {
        $d = $this->buatDunia();

        // Lihat: pemilik, guru pengampu mapel sumber, admin.
        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->nilaiTugasA));
        $this->assertFalse($this->bolehkah($d->siswa2, 'view', $d->nilaiTugasA));
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->nilaiTugasA));
        $this->assertFalse($this->bolehkah($d->guruB, 'view', $d->nilaiTugasA));
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->nilaiKuisA));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->nilaiTugasB));

        // Beri / ubah / hapus: hanya guru pengampu mapel sumber.
        $this->assertTrue($this->bolehkah($d->guruA, 'beri', [Nilai::class, $d->pengumpulanA]));
        $this->assertFalse($this->bolehkah($d->guruB, 'beri', [Nilai::class, $d->pengumpulanA]));
        $this->assertTrue($this->bolehkah($d->guruA, 'beri', [Nilai::class, $d->kuisA]));
        $this->assertFalse($this->bolehkah($d->guruB, 'beri', [Nilai::class, $d->kuisA]));
        $this->assertFalse($this->bolehkah($d->siswa1, 'beri', [Nilai::class, $d->pengumpulanA]));
        $this->assertFalse($this->bolehkah($d->admin, 'beri', [Nilai::class, $d->pengumpulanA]));
        $this->assertTrue($this->bolehkah($d->guruA, 'update', $d->nilaiTugasA));
        $this->assertFalse($this->bolehkah($d->guruB, 'update', $d->nilaiTugasA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'update', $d->nilaiTugasA)); // siswa tidak mengubah nilainya sendiri
        $this->assertFalse($this->bolehkah($d->siswa1, 'delete', $d->nilaiKuisA));
    }

    public function test_pengumuman(): void
    {
        $d = $this->buatDunia();

        // Global: semua orang. Mapel: pengikut, pengampu, admin.
        foreach ([$d->siswa2, $d->guruC, $d->admin] as $pengguna) {
            $this->assertTrue($this->bolehkah($pengguna, 'view', $d->pengumumanGlobal));
        }
        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->pengumumanA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'view', $d->pengumumanB));
        $this->assertTrue($this->bolehkah($d->guruA, 'view', $d->pengumumanA));
        $this->assertFalse($this->bolehkah($d->guruA, 'view', $d->pengumumanB));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->pengumumanB));

        // Buat: global hanya admin; mapel oleh admin atau guru pengampu.
        $this->assertTrue($this->bolehkah($d->admin, 'create', Pengumuman::class));
        $this->assertFalse($this->bolehkah($d->guruA, 'create', Pengumuman::class));
        $this->assertFalse($this->bolehkah($d->siswa1, 'create', Pengumuman::class));
        $this->assertTrue($this->bolehkah($d->guruA, 'create', [Pengumuman::class, $d->mapelA]));
        $this->assertFalse($this->bolehkah($d->guruA, 'create', [Pengumuman::class, $d->mapelB]));
        $this->assertFalse($this->bolehkah($d->siswa1, 'create', [Pengumuman::class, $d->mapelA]));

        // Ubah/hapus: admin, atau guru penulisnya.
        $this->assertTrue($this->bolehkah($d->guruA, 'update', $d->pengumumanA));
        $this->assertFalse($this->bolehkah($d->guruB, 'update', $d->pengumumanA));
        $this->assertFalse($this->bolehkah($d->guruA, 'update', $d->pengumumanGlobal));
        $this->assertTrue($this->bolehkah($d->admin, 'delete', $d->pengumumanA));
        $this->assertFalse($this->bolehkah($d->siswa1, 'delete', $d->pengumumanA));
    }

    public function test_pengguna(): void
    {
        $d = $this->buatDunia();

        $this->assertTrue($this->bolehkah($d->admin, 'viewAny', Pengguna::class));
        $this->assertFalse($this->bolehkah($d->guruA, 'viewAny', Pengguna::class));
        $this->assertFalse($this->bolehkah($d->siswa1, 'viewAny', Pengguna::class));

        $this->assertTrue($this->bolehkah($d->siswa1, 'view', $d->siswa1));
        $this->assertFalse($this->bolehkah($d->siswa1, 'view', $d->siswa2));
        $this->assertTrue($this->bolehkah($d->admin, 'view', $d->siswa2));

        // Mengubah akun (termasuk peran) hanya admin; siswa tidak bisa menaikkan perannya sendiri.
        $this->assertFalse($this->bolehkah($d->siswa1, 'update', $d->siswa1));
        $this->assertTrue($this->bolehkah($d->siswa1, 'updateProfil', $d->siswa1));
        $this->assertFalse($this->bolehkah($d->siswa1, 'updateProfil', $d->siswa2));
        $this->assertTrue($this->bolehkah($d->admin, 'update', $d->siswa1));

        // Admin tidak bisa menghapus dirinya sendiri.
        $this->assertFalse($this->bolehkah($d->admin, 'delete', $d->admin));
        $this->assertTrue($this->bolehkah($d->admin, 'delete', $d->siswa1));
        $this->assertFalse($this->bolehkah($d->guruA, 'delete', $d->siswa1));
    }
}
