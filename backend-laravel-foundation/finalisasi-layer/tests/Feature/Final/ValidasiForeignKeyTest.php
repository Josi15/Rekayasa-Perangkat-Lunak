<?php

namespace Tests\Feature\Final;

use App\Models\Kuis;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MasterApi;
use Tests\Concerns\MembuatDuniaAkses;
use Tests\DatabaseTestCase;

/**
 * Matriks: setiap endpoint yang menerima id relasi harus menjawab 422 (bukan 500) untuk id yang tidak ada,
 * bukan bilangan bulat, melebihi batas bigint, atau menunjuk peran yang salah.
 */
class ValidasiForeignKeyTest extends DatabaseTestCase
{
    use MasterApi, MembuatDuniaAkses;

    /** @return array<string, array{0: string}> */
    public static function idBuruk(): array
    {
        return ['tidak ada' => ['999999'], 'huruf' => ['abc'], 'melebihi bigint' => ['99999999999999999999'], 'negatif' => ['-5'], 'nol' => ['0'], 'desimal' => ['1.5']];
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: array<string, mixed>, 3: string, 4: string}>
     */
    private function skenario(object $d, string $idBuruk): array
    {
        $besok = now()->addDays(2)->setTime(9, 0);
        $kuisBaru = Kuis::factory()->create(['id_mapel' => $d->mapelA->id_mapel]);

        // [pelaku, url, payload valid kecuali field FK, field FK yang diuji, kunci errors]
        return [
            'kelas.id_wali' => ['admin', '/api/v1/kelas', ['nama_kelas' => 'Kelas Uji FK'], 'id_wali', 'id_wali'],
            'mapel.id_guru' => ['admin', '/api/v1/mapel', ['nama_mapel' => 'Mapel Uji FK'], 'id_guru', 'id_guru'],
            'anggota.id_siswa' => ['admin', '/api/v1/kelas/'.$d->kelasA->id_kelas.'/anggota', [], 'id_siswa.0', 'id_siswa.0'],
            'jadwal.id_mapel' => ['admin', '/api/v1/jadwal', ['id_kelas' => $d->kelasA->id_kelas, 'waktu_mulai' => $besok->toIso8601String(), 'waktu_selesai' => $besok->copy()->addHour()->toIso8601String()], 'id_mapel', 'id_mapel'],
            'jadwal.id_kelas' => ['admin', '/api/v1/jadwal', ['id_mapel' => $d->mapelA->id_mapel, 'waktu_mulai' => $besok->toIso8601String(), 'waktu_selesai' => $besok->copy()->addHour()->toIso8601String()], 'id_kelas', 'id_kelas'],
            'jadwal.id_guru' => ['admin', '/api/v1/jadwal', ['id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasA->id_kelas, 'waktu_mulai' => $besok->toIso8601String(), 'waktu_selesai' => $besok->copy()->addHour()->toIso8601String()], 'id_guru', 'id_guru'],
            'nilai kuis.id_siswa' => ['guruA', '/api/v1/kuis/'.$kuisBaru->id_kuis.'/nilai', ['nilai' => 80], 'id_siswa', 'id_siswa'],
            'presensi manual.id_siswa' => ['guruA', '/api/v1/jadwal/'.$d->jadwalA->id_jadwal.'/presensi', ['status_kehadiran' => 'izin'], 'id_siswa', 'id_siswa'],
            'pengumuman.id_mapel' => ['admin', '/api/v1/pengumuman', ['judul' => 'J', 'isi' => 'I', 'cakupan' => 'mapel'], 'id_mapel', 'id_mapel'],
        ];
    }

    #[DataProvider('idBuruk')]
    public function test_id_relasi_buruk_selalu_422_tanpa_error_server(string $idBuruk): void
    {
        $d = $this->buatDunia();
        $sebelum = $this->hitungBaris();

        foreach ($this->skenario($d, $idBuruk) as $nama => [$pelaku, $url, $dasar, $field]) {
            $payload = $dasar;
            $nilai = ctype_digit(ltrim($idBuruk, '-')) || $idBuruk === '1.5' ? (is_numeric($idBuruk) ? $idBuruk + 0 : $idBuruk) : $idBuruk;

            if (str_contains($field, '.')) {
                [$induk] = explode('.', $field);
                $payload[$induk] = [$nilai];
            } else {
                $payload[$field] = $nilai;
            }

            $res = $this->sebagai($d->{$pelaku})->postJson($url, $payload);

            $this->assertSame(422, $res->status(), "$nama dengan '$idBuruk' memberi {$res->status()}");
            $res->assertJsonValidationErrors([$field]);
        }

        $this->assertSame($sebelum, $this->hitungBaris(), 'Ada baris yang tersimpan walau FK tidak valid.');
    }

    public function test_id_relasi_menunjuk_peran_yang_salah_422(): void
    {
        $d = $this->buatDunia();
        $besok = now()->addDays(2)->setTime(9, 0);

        // siswa sebagai wali / guru pengampu / guru jadwal
        $this->sebagai($d->admin)->postJson('/api/v1/kelas', ['nama_kelas' => 'K FK', 'id_wali' => $d->siswa1->id_pengguna])->assertUnprocessable()->assertJsonValidationErrors(['id_wali']);
        $this->sebagai($d->admin)->postJson('/api/v1/mapel', ['nama_mapel' => 'M FK', 'id_guru' => $d->siswa1->id_pengguna])->assertUnprocessable()->assertJsonValidationErrors(['id_guru']);
        $this->sebagai($d->admin)->postJson('/api/v1/jadwal', ['id_mapel' => $d->mapelA->id_mapel, 'id_kelas' => $d->kelasA->id_kelas, 'id_guru' => $d->siswa1->id_pengguna,
            'waktu_mulai' => $besok->toIso8601String(), 'waktu_selesai' => $besok->copy()->addHour()->toIso8601String()])->assertUnprocessable()->assertJsonValidationErrors(['id_guru']);
        // guru/admin sebagai siswa pada anggota kelas, nilai kuis, dan presensi manual
        $this->sebagai($d->admin)->postJson('/api/v1/kelas/'.$d->kelasA->id_kelas.'/anggota', ['id_siswa' => [$d->guruA->id_pengguna]])->assertUnprocessable();
        $this->sebagai($d->guruA)->postJson('/api/v1/kuis/'.$d->kuisA->id_kuis.'/nilai', ['id_siswa' => $d->admin->id_pengguna, 'nilai' => 50])->assertUnprocessable()->assertJsonValidationErrors(['id_siswa']);
        $this->sebagai($d->guruA)->postJson('/api/v1/jadwal/'.$d->jadwalA->id_jadwal.'/presensi', ['id_siswa' => $d->guruB->id_pengguna, 'status_kehadiran' => 'izin'])->assertUnprocessable()->assertJsonValidationErrors(['id_siswa']);
    }

    public function test_id_pengguna_nonaktif_tidak_dapat_dijadikan_relasi(): void
    {
        $d = $this->buatDunia();
        $d->guruC->forceFill(['nonaktif_pada' => now()])->save();

        $this->sebagai($d->admin)->postJson('/api/v1/kelas', ['nama_kelas' => 'K Nonaktif', 'id_wali' => $d->guruC->id_pengguna])->assertUnprocessable()->assertJsonValidationErrors(['id_wali']);
        $this->sebagai($d->admin)->postJson('/api/v1/mapel', ['nama_mapel' => 'M Nonaktif', 'id_guru' => $d->guruC->id_pengguna])->assertUnprocessable()->assertJsonValidationErrors(['id_guru']);
    }

    /** @return array<string, int> */
    private function hitungBaris(): array
    {
        $hasil = [];
        foreach (['kelas', 'mata_pelajaran', 'siswa_kelas', 'jadwal', 'nilai', 'presensi', 'pengumuman'] as $t) {
            $hasil[$t] = DB::table($t)->count();
        }

        return $hasil;
    }
}
