<?php

namespace App\Http\Resources;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Identitas minimal yang aman ditampilkan ke siapa pun yang boleh melihat kelas/mapel
 * (wali, guru pengampu). Tanpa email, NISN, NIP.
 *
 * @mixin Pengguna
 */
class PenggunaPublikResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id_pengguna' => $this->id_pengguna,
            'username' => $this->username,
            'peran' => $this->peran->value,
        ];
    }
}
