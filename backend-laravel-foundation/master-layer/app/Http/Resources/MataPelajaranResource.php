<?php

namespace App\Http\Resources;

use App\Models\MataPelajaran;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MataPelajaran
 */
class MataPelajaranResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id_mapel' => $this->id_mapel,
            'nama_mapel' => $this->nama_mapel,
            'id_guru' => $this->id_guru,
            'guru' => new PenggunaPublikResource($this->whenLoaded('guru')),
            'aktif' => $this->aktif(),
            'diarsipkan_pada' => $this->diarsipkan_pada,
        ];
    }
}
