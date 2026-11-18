<?php

namespace App\Http\Resources;

use App\Models\Nilai;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Nilai */
class NilaiResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $dariTugas = $this->id_pengumpulan !== null;

        return [
            'id_nilai' => $this->id_nilai,
            'id_siswa' => $this->id_siswa,
            'siswa' => $this->whenLoaded('siswa', fn () => [
                'id_pengguna' => $this->siswa->id_pengguna,
                'nisn' => $this->siswa->nisn,
                'username' => $this->siswa->username,
            ]),
            'sumber' => $dariTugas ? 'tugas' : 'kuis',
            'id_pengumpulan' => $this->id_pengumpulan,
            'id_kuis' => $this->id_kuis,
            'rujukan' => $this->when(
                $this->relationLoaded('pengumpulanTugas') && $this->relationLoaded('kuis'),
                fn () => $dariTugas
                    ? ['id_tugas' => $this->pengumpulanTugas?->id_tugas, 'judul' => $this->pengumpulanTugas?->tugas?->judul, 'id_mapel' => $this->pengumpulanTugas?->tugas?->id_mapel]
                    : ['id_kuis' => $this->kuis?->id_kuis, 'judul' => $this->kuis?->judul, 'id_mapel' => $this->kuis?->id_mapel],
            ),
            'nilai' => (float) $this->nilai,
            'skala' => ['min' => 0, 'maks' => 100],
            'umpan_balik' => $this->umpan_balik,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
