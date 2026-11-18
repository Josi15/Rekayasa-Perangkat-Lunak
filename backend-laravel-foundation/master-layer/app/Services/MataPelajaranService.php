<?php

namespace App\Services;

use App\Enums\Peran;
use App\Exceptions\KonflikBisnisException;
use App\Models\Jadwal;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class MataPelajaranService
{
    /**
     * @param  array{nama_mapel: string, id_guru: int}  $data
     */
    public function buat(array $data): MataPelajaran
    {
        return MataPelajaran::query()
            ->create(['nama_mapel' => $data['nama_mapel'], 'id_guru' => $data['id_guru']])
            ->refresh();
    }

    /**
     * @param  array{nama_mapel: string}  $data
     */
    public function ubah(MataPelajaran $mapel, array $data): MataPelajaran
    {
        return DB::transaction(function () use ($mapel, $data): MataPelajaran {
            $mapel = $this->kunci($mapel);

            if (! $mapel->aktif()) {
                throw new KonflikBisnisException('Mata pelajaran sudah diarsipkan; pulihkan terlebih dahulu.', 'subject_archived');
            }

            $mapel->fill(['nama_mapel' => $data['nama_mapel']])->save();

            return $mapel;
        });
    }

    /**
     * Mengganti guru pengampu (ERD: MATA_PELAJARAN.id_guru). Dalam satu transaksi, jadwal MENDATANG
     * mapel ini ikut dialihkan ke guru baru; jadwal yang sudah lewat tidak diubah (riwayat).
     * Bentrok waktu dengan jadwal guru baru (unique id_guru+waktu_mulai) -> 409 dan semuanya dibatalkan.
     */
    public function gantiGuru(MataPelajaran $mapel, int $idGuru): MataPelajaran
    {
        return DB::transaction(function () use ($mapel, $idGuru): MataPelajaran {
            $mapel = $this->kunci($mapel);

            if ((int) $mapel->id_guru === $idGuru) {
                return $mapel;
            }

            $mapel->id_guru = $idGuru;
            $mapel->save();

            try {
                Jadwal::query()
                    ->where('id_mapel', $mapel->id_mapel)
                    ->where('waktu_mulai', '>', now())
                    ->update(['id_guru' => $idGuru, 'updated_at' => now()]);
            } catch (UniqueConstraintViolationException) {
                throw new KonflikBisnisException('Guru baru sudah memiliki jadwal pada waktu yang sama dengan jadwal mata pelajaran ini.', 'schedule_conflict');
            }

            return $mapel;
        });
    }

    /** Mengarsipkan (idempotent). Ditolak bila masih ada jadwal mendatang. */
    public function arsipkan(MataPelajaran $mapel): MataPelajaran
    {
        return DB::transaction(function () use ($mapel): MataPelajaran {
            $mapel = $this->kunci($mapel);

            if (! $mapel->aktif()) {
                return $mapel;
            }

            if (Jadwal::query()->where('id_mapel', $mapel->id_mapel)->where('waktu_mulai', '>', now())->exists()) {
                throw new KonflikBisnisException('Mata pelajaran masih memiliki jadwal mendatang.', 'subject_has_upcoming_schedule');
            }

            $mapel->forceFill(['diarsipkan_pada' => now()])->save();

            return $mapel;
        });
    }

    /** Memulihkan (idempotent). Guru pengampu harus masih guru aktif. */
    public function pulihkan(MataPelajaran $mapel): MataPelajaran
    {
        return DB::transaction(function () use ($mapel): MataPelajaran {
            $mapel = $this->kunci($mapel);

            if ($mapel->aktif()) {
                return $mapel;
            }

            $guruAktif = Pengguna::query()->aktif()
                ->whereKey($mapel->id_guru)->where('peran', Peran::Guru->value)->exists();

            if (! $guruAktif) {
                throw new KonflikBisnisException('Guru pengampu tidak aktif. Ganti guru sebelum memulihkan.', 'teacher_inactive');
            }

            $mapel->forceFill(['diarsipkan_pada' => null])->save();

            return $mapel;
        });
    }

    private function kunci(MataPelajaran $mapel): MataPelajaran
    {
        return MataPelajaran::query()->lockForUpdate()->findOrFail($mapel->getKey());
    }
}
