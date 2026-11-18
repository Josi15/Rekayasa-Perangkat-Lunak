<?php

namespace App\Http\Resources;

use App\Models\Kelas;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Relasi (wali) dan jumlah_siswa hanya muncul bila dimuat controller (with / withCount).
 *
 * @mixin Kelas
 */
class KelasResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_kelas' => $this->id_kelas,
            'nama_kelas' => $this->nama_kelas,
            'id_wali' => $this->id_wali,
            'wali' => new PenggunaPublikResource($this->whenLoaded('wali')),
            'jumlah_siswa' => $this->whenCounted('siswa'),
            'aktif' => $this->aktif(),
            'diarsipkan_pada' => $this->diarsipkan_pada,
        ];
    }
}
