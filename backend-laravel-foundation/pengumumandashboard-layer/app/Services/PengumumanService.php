<?php

namespace App\Services;

use App\Enums\CakupanPengumuman;
use App\Exceptions\KonflikBisnisException;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use App\Models\Pengumuman;
use Illuminate\Support\Facades\DB;

/**
 * Konsistensi cakupan <-> id_mapel (juga dijaga CHECK pengumuman_cakupan_mapel_check):
 *  global => id_mapel NULL (hanya admin); mapel => id_mapel wajib (guru pengampu mapel itu atau admin).
 * id_penulis selalu pengguna yang login. cakupan & id_mapel tidak dapat diubah setelah dibuat.
 * Tabel pengumuman tidak punya kolom arsip/status, jadi penghapusan bersifat permanen.
 */
class PengumumanService
{
    /** @param array{judul: string, isi: string, cakupan: string, id_mapel?: int|string|null} $data */
    public function buat(Pengguna $penulis, array $data): Pengumuman
    {
        return DB::transaction(function () use ($penulis, $data): Pengumuman {
            $global = $data['cakupan'] === CakupanPengumuman::Umum->value;

            if (! $global) {
                $this->pastikanMapelAktif((int) $data['id_mapel']);
            }

            return Pengumuman::query()->create([
                'judul' => $data['judul'],
                'isi' => $data['isi'],
                'cakupan' => $data['cakupan'],
                'id_penulis' => $penulis->getKey(),
                'id_mapel' => $global ? null : (int) $data['id_mapel'],
            ])->refresh();
        });
    }

    /** @param array<string, mixed> $data hanya judul dan/atau isi */
    public function ubah(Pengumuman $pengumuman, array $data): Pengumuman
    {
        return DB::transaction(function () use ($pengumuman, $data): Pengumuman {
            $pengumuman = Pengumuman::query()->lockForUpdate()->findOrFail($pengumuman->getKey());

            if ($pengumuman->cakupan === CakupanPengumuman::Mapel) {
                $this->pastikanMapelAktif((int) $pengumuman->id_mapel);
            }

            $pengumuman->fill(array_intersect_key($data, array_flip(['judul', 'isi'])))->save();

            return $pengumuman;
        });
    }

    public function hapus(Pengumuman $pengumuman): void
    {
        $pengumuman->delete();
    }

    private function pastikanMapelAktif(int $idMapel): void
    {
        $mapel = MataPelajaran::query()->lockForUpdate()->findOrFail($idMapel);

        if (! $mapel->aktif()) {
            throw new KonflikBisnisException('Mata pelajaran sudah diarsipkan; pengumuman tidak dapat ditambah atau diubah.', 'subject_archived');
        }
    }
}
