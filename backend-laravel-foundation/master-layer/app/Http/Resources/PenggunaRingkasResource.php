<?php

namespace App\Http\Resources;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Baris daftar anggota kelas (untuk admin, wali, guru terkait). Tanpa email.
 *
 * @mixin Pengguna
 */
class PenggunaRingkasResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id_pengguna' => $this->id_pengguna,
            'nisn' => $this->nisn,
            'nip' => $this->nip,
            'username' => $this->username,
            'peran' => $this->peran->value,
            'aktif' => $this->aktif(),
        ];
    }
}
