<?php

namespace App\Services;

use App\Exceptions\KonflikBisnisException;
use App\Models\Kuis;
use App\Models\MataPelajaran;
use Illuminate\Support\Facades\DB;

/**
 * Kuis hanya menyimpan judul + tautan Google Forms (tidak ada jawaban/penilaian otomatis).
 * Tabel kuis tidak punya kolom status, jadi tidak ada "arsip": kuis dihapus, dan hanya bila belum ada nilai
 * yang merujuknya (409 quiz_has_grades). Mapel yang diarsipkan menolak kuis baru/perubahan (409).
 */
class KuisService
{
    /** @param array{judul: string, tautan_google_form: string} $data */
    public function buat(MataPelajaran $mapel, array $data): Kuis
    {
        return DB::transaction(function () use ($mapel, $data): Kuis {
            $this->kunciMapelAktif($mapel->getKey());

            return Kuis::query()->create([
                'judul' => $data['judul'],
                'tautan_google_form' => $data['tautan_google_form'],
                'id_mapel' => $mapel->getKey(),
            ])->refresh();
        });
    }

    /** @param array<string, mixed> $data */
    public function ubah(Kuis $kuis, array $data): Kuis
    {
        return DB::transaction(function () use ($kuis, $data): Kuis {
            $kuis = Kuis::query()->lockForUpdate()->findOrFail($kuis->getKey());
            $this->kunciMapelAktif($kuis->id_mapel);

            $kuis->fill(array_intersect_key($data, array_flip(['judul', 'tautan_google_form'])))->save();

            return $kuis;
        });
    }

    public function hapus(Kuis $kuis): void
    {
        DB::transaction(function () use ($kuis): void {
            $kuis = Kuis::query()->lockForUpdate()->findOrFail($kuis->getKey());

            if ($kuis->nilai()->exists()) {
                throw new KonflikBisnisException('Kuis sudah memiliki nilai dan tidak dapat dihapus.', 'quiz_has_grades');
            }

            $kuis->delete();
        });
    }

    private function kunciMapelAktif(int|string $idMapel): void
    {
        $mapel = MataPelajaran::query()->lockForUpdate()->findOrFail($idMapel);

        if (! $mapel->aktif()) {
            throw new KonflikBisnisException('Mata pelajaran sudah diarsipkan; kuis tidak dapat ditambah atau diubah.', 'subject_archived');
        }
    }
}
