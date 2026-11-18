<?php

namespace App\Services;

use App\Enums\Peran;
use App\Exceptions\KonflikBisnisException;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Aturan jadwal:
 *  - Mapel & kelas harus aktif (tidak diarsipkan); guru harus guru aktif. id_guru bawaan = guru pengampu mapel.
 *  - Durasi dalam batas config; waktu_selesai > waktu_mulai.
 *  - TIDAK boleh tumpang tindih (interval), bukan hanya waktu mulai yang sama, untuk kelas yang sama maupun guru
 *    yang sama (409 class_schedule_conflict / teacher_schedule_conflict). Baris mapel, kelas, dan guru dikunci
 *    dengan urutan tetap; UNIQUE di database menjadi jaring pengaman terakhir.
 *  - Jadwal yang sudah dimulai bersifat riwayat (tidak diubah/dihapus); yang sudah punya presensi juga terkunci.
 *  - Tabel jadwal tidak punya kolom status, jadi tidak ada "nonaktif": jadwal mendatang tanpa presensi dihapus permanen.
 */
class JadwalService
{
    /** @param array<string, mixed> $data id_mapel, id_kelas, id_guru?, waktu_mulai, waktu_selesai */
    public function buat(array $data): Jadwal
    {
        try {
            return DB::transaction(function () use ($data): Jadwal {
                $mapel = $this->kunciMapel((int) $data['id_mapel']);
                $this->kunciKelas((int) $data['id_kelas']);
                $idGuru = (int) ($data['id_guru'] ?? $mapel->id_guru);
                $this->kunciGuru($idGuru);

                [$mulai, $selesai] = $this->waktu($data['waktu_mulai'], $data['waktu_selesai']);
                $this->pastikanTanpaBentrok((int) $data['id_kelas'], $idGuru, $mulai, $selesai, null);

                return Jadwal::query()->create([
                    'id_mapel' => $mapel->id_mapel,
                    'id_kelas' => (int) $data['id_kelas'],
                    'id_guru' => $idGuru,
                    'waktu_mulai' => $mulai,
                    'waktu_selesai' => $selesai,
                ])->refresh();
            });
        } catch (UniqueConstraintViolationException) {
            throw new KonflikBisnisException('Jadwal bertabrakan dengan jadwal lain pada waktu mulai yang sama.', 'schedule_conflict');
        }
    }

    /** @param array<string, mixed> $data subset dari id_mapel, id_kelas, id_guru, waktu_mulai, waktu_selesai */
    public function ubah(Jadwal $jadwal, array $data): Jadwal
    {
        try {
            return DB::transaction(function () use ($jadwal, $data): Jadwal {
                $j = $this->kunciJadwalDapatDiubah($jadwal);

                $idMapel = (int) ($data['id_mapel'] ?? $j->id_mapel);
                $idKelas = (int) ($data['id_kelas'] ?? $j->id_kelas);
                $idGuru = (int) ($data['id_guru'] ?? $j->id_guru);

                if ($idMapel !== (int) $j->id_mapel) {
                    $mapel = $this->kunciMapel($idMapel);
                    if (! array_key_exists('id_guru', $data)) {
                        $idGuru = (int) $mapel->id_guru; // pindah mapel tanpa menyebut guru -> ikut guru pengampu mapel baru
                    }
                }
                if ($idKelas !== (int) $j->id_kelas) {
                    $this->kunciKelas($idKelas);
                }
                if ($idGuru !== (int) $j->id_guru) {
                    $this->kunciGuru($idGuru);
                }

                [$mulai, $selesai] = $this->waktu($data['waktu_mulai'] ?? $j->waktu_mulai, $data['waktu_selesai'] ?? $j->waktu_selesai);

                if ($mulai->isPast()) {
                    throw ValidationException::withMessages(['waktu_mulai' => 'Waktu mulai harus di masa depan.']);
                }

                $this->pastikanTanpaBentrok($idKelas, $idGuru, $mulai, $selesai, $j->id_jadwal);

                $j->forceFill([
                    'id_mapel' => $idMapel, 'id_kelas' => $idKelas, 'id_guru' => $idGuru,
                    'waktu_mulai' => $mulai, 'waktu_selesai' => $selesai,
                ])->save();

                return $j->refresh();
            });
        } catch (UniqueConstraintViolationException) {
            throw new KonflikBisnisException('Jadwal bertabrakan dengan jadwal lain pada waktu mulai yang sama.', 'schedule_conflict');
        }
    }

    public function hapus(Jadwal $jadwal): void
    {
        DB::transaction(function () use ($jadwal): void {
            $this->kunciJadwalDapatDiubah($jadwal)->delete();
        });
    }

    private function kunciJadwalDapatDiubah(Jadwal $jadwal): Jadwal
    {
        $j = Jadwal::query()->lockForUpdate()->findOrFail($jadwal->getKey());

        if ($j->presensi()->exists()) {
            throw new KonflikBisnisException('Jadwal sudah memiliki presensi dan tidak dapat diubah atau dihapus.', 'schedule_has_attendance');
        }

        if ($j->waktu_mulai->lessThanOrEqualTo(now())) {
            throw new KonflikBisnisException('Jadwal sudah dimulai/berlalu (riwayat) dan tidak dapat diubah atau dihapus.', 'schedule_started');
        }

        return $j;
    }

    private function kunciMapel(int $id): MataPelajaran
    {
        $mapel = MataPelajaran::query()->lockForUpdate()->findOrFail($id);

        if (! $mapel->aktif()) {
            throw new KonflikBisnisException('Mata pelajaran sudah diarsipkan; jadwal tidak dapat dibuat atau dipindahkan ke sana.', 'subject_archived');
        }

        return $mapel;
    }

    private function kunciKelas(int $id): Kelas
    {
        $kelas = Kelas::query()->lockForUpdate()->findOrFail($id);

        if (! $kelas->aktif()) {
            throw new KonflikBisnisException('Kelas sudah diarsipkan; jadwal tidak dapat dibuat atau dipindahkan ke sana.', 'class_archived');
        }

        return $kelas;
    }

    private function kunciGuru(int $id): Pengguna
    {
        $guru = Pengguna::query()->lockForUpdate()->findOrFail($id);

        if ($guru->peran !== Peran::Guru || ! $guru->aktif()) {
            throw new KonflikBisnisException('Guru tidak aktif atau bukan guru.', 'teacher_inactive');
        }

        return $guru;
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function waktu(mixed $mulai, mixed $selesai): array
    {
        $mulai = Carbon::parse($mulai)->utc();
        $selesai = Carbon::parse($selesai)->utc();

        $menit = $mulai->diffInMinutes($selesai, false);
        $min = (int) config('presensi.jadwal.durasi_min_menit', 10);
        $maks = (int) config('presensi.jadwal.durasi_maks_menit', 480);

        if ($menit <= 0) {
            throw ValidationException::withMessages(['waktu_selesai' => 'Waktu selesai harus setelah waktu mulai.']);
        }
        if ($menit < $min || $menit > $maks) {
            throw ValidationException::withMessages(['waktu_selesai' => "Durasi jadwal harus antara {$min} dan {$maks} menit."]);
        }

        return [$mulai, $selesai];
    }

    private function pastikanTanpaBentrok(int $idKelas, int $idGuru, Carbon $mulai, Carbon $selesai, ?int $kecuali): void
    {
        $tumpang = fn ($q) => $q->where('waktu_mulai', '<', $selesai)->where('waktu_selesai', '>', $mulai)
            ->when($kecuali !== null, fn ($w) => $w->where('id_jadwal', '!=', $kecuali));

        if (Jadwal::query()->where('id_kelas', $idKelas)->where($tumpang)->exists()) {
            throw new KonflikBisnisException('Kelas sudah memiliki jadwal yang bertabrakan pada waktu tersebut.', 'class_schedule_conflict');
        }

        if (Jadwal::query()->where('id_guru', $idGuru)->where($tumpang)->exists()) {
            throw new KonflikBisnisException('Guru sudah memiliki jadwal yang bertabrakan pada waktu tersebut.', 'teacher_schedule_conflict');
        }
    }
}
