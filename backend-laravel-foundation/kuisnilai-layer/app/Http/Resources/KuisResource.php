<?php

namespace App\Http\Resources;

use App\Models\Kuis;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Kuis */
class KuisResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id_kuis' => $this->id_kuis,
            'judul' => $this->judul,
            'tautan_google_form' => $this->tautan_google_form,
            'id_mapel' => $this->id_mapel,
            'mapel' => $this->whenLoaded('mataPelajaran', fn () => [
                'id_mapel' => $this->mataPelajaran->id_mapel,
                'nama_mapel' => $this->mataPelajaran->nama_mapel,
            ]),
            'jumlah_nilai' => $this->whenCounted('nilai'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
