<?php

namespace App\Services;

use App\Enums\Peran;
use App\Exceptions\KonflikBisnisException;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;

class KelasService
{
    /**
     * @param  array{nama_kelas: string, id_wali: int}  $data
     */
    public function buat(array $data): Kelas
    {
        return Kelas::query()
            ->create(['nama_kelas' => $data['nama_kelas'], 'id_wali' => $data['id_wali']])
            ->refresh();
    }

    /**
     * @param  array{nama_kelas: string}  $data
     */
    public function ubah(Kelas $kelas, array $data): Kelas
    {
        return DB::transaction(function () use ($kelas, $data): Kelas {
            $kelas = $this->kunci($kelas);
            $this->pastikanAktif($kelas);

            $kelas->fill(['nama_kelas' => $data['nama_kelas']])->save();

            return $kelas;
        });
    }

    /** Mengganti wali kelas. Diizinkan juga pada kelas yang diarsipkan (administratif). */
    public function gantiWali(Kelas $kelas, int $idWali): Kelas
    {
        return DB::transaction(function () use ($kelas, $idWali): Kelas {
            $kelas = $this->kunci($kelas);

            if ((int) $kelas->id_wali !== $idWali) {
                $kelas->id_wali = $idWali;
                $kelas->save();
            }

            return $kelas;
        });
    }

    /** Mengarsipkan kelas (idempotent). Ditolak bila masih ada jadwal mendatang. */
    public function arsipkan(Kelas $kelas): Kelas
    {
        return DB::transaction(function () use ($kelas): Kelas {
            $kelas = $this->kunci($kelas);

            if (! $kelas->aktif()) {
                return $kelas;
            }

            if (Jadwal::query()->where('id_kelas', $kelas->id_kelas)->where('waktu_mulai', '>', now())->exists()) {
                throw new KonflikBisnisException('Kelas masih memiliki jadwal mendatang; hapus atau selesaikan jadwal terlebih dahulu.', 'class_has_upcoming_schedule');
            }

            $kelas->forceFill(['diarsipkan_pada' => now()])->save();

            return $kelas;
        });
    }

    /** Memulihkan kelas (idempotent). Wali harus masih guru aktif. */
    public function pulihkan(Kelas $kelas): Kelas
    {
        return DB::transaction(function () use ($kelas): Kelas {
            $kelas = $this->kunci($kelas);

            if ($kelas->aktif()) {
                return $kelas;
            }

            $waliAktif = Pengguna::query()->aktif()
                ->whereKey($kelas->id_wali)->where('peran', Peran::Guru->value)->exists();

            if (! $waliAktif) {
                throw new KonflikBisnisException('Wali kelas tidak aktif. Ganti wali kelas sebelum memulihkan.', 'homeroom_teacher_inactive');
            }

            $kelas->forceFill(['diarsipkan_pada' => null])->save();

            return $kelas;
        });
    }

    private function kunci(Kelas $kelas): Kelas
    {
        return Kelas::query()->lockForUpdate()->findOrFail($kelas->getKey());
    }

    private function pastikanAktif(Kelas $kelas): void
    {
        if (! $kelas->aktif()) {
            throw new KonflikBisnisException('Kelas sudah diarsipkan; pulihkan terlebih dahulu.', 'class_archived');
        }
    }
}
