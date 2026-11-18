<?php

namespace App\Http\Resources;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representasi pengguna untuk API. Tidak pernah memuat password / remember_token.
 *
 * @mixin Pengguna
 */
class PenggunaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_pengguna' => $this->id_pengguna,
            'nisn' => $this->nisn,
            'nip' => $this->nip,
            'username' => $this->username,
            'email' => $this->email,
            'peran' => $this->peran->value,
            'aktif' => $this->aktif(),
            'nonaktif_pada' => $this->nonaktif_pada,
        ];
    }
}
