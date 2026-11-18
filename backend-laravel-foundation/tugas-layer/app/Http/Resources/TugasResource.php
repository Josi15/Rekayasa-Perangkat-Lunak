<?php

namespace App\Http\Resources;

use App\Enums\Peran;
use App\Models\Tugas;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Path lampiran bersifat internal dan tidak dikirim. Untuk siswa disertakan pengumpulan_saya
 * (miliknya saja); untuk guru/admin jumlah_pengumpulan.
 *
 * @mixin Tugas
 */
class TugasResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $ini = $request->user();
        $menerima = $this->menerimaPengumpulan();

        return [
            'id_tugas' => $this->id_tugas,
            'judul' => $this->judul,
            'instruksi' => $this->instruksi,
            'batas_waktu' => $this->batas_waktu,
            'id_mapel' => $this->id_mapel,
            'mapel' => $this->whenLoaded('mataPelajaran', fn () => [
                'id_mapel' => $this->mataPelajaran->id_mapel,
                'nama_mapel' => $this->mataPelajaran->nama_mapel,
            ]),
            'status' => $menerima ? 'terbuka' : 'tertutup',
            'menerima_pengumpulan' => $menerima,
            'punya_lampiran' => $this->lampiran !== null,
            'url_lampiran' => $this->lampiran !== null ? route('api.v1.tugas.lampiran', ['tugas' => $this->id_tugas], false) : null,
            'jumlah_pengumpulan' => $this->whenCounted('pengumpulan'),
            'pengumpulan_saya' => $this->when(
                $ini?->peran === Peran::Siswa && $this->relationLoaded('pengumpulan'),
                fn () => ($p = $this->pengumpulan->firstWhere('id_siswa', $ini->getKey())) ? [
                    'id_pengumpulan' => $p->id_pengumpulan,
                    'status' => $p->status->value,
                    'waktu_kumpul' => $p->waktu_kumpul,
                ] : null,
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
