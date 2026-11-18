<?php

namespace App\Http\Resources;

use App\Models\Pengumuman;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * "isi" adalah teks polos; klien harus menampilkannya sebagai teks (bukan HTML) agar aman dari XSS.
 *
 * @mixin Pengumuman
 */
class PengumumanResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id_pengumuman' => $this->id_pengumuman,
            'judul' => $this->judul,
            'isi' => $this->isi,
            'cakupan' => $this->cakupan->value,
            'id_penulis' => $this->id_penulis,
            'penulis' => $this->whenLoaded('penulis', fn () => [
                'id_pengguna' => $this->penulis->id_pengguna,
                'username' => $this->penulis->username,
            ]),
            'id_mapel' => $this->id_mapel,
            'mapel' => $this->whenLoaded('mataPelajaran', fn () => $this->mataPelajaran === null ? null : [
                'id_mapel' => $this->mataPelajaran->id_mapel,
                'nama_mapel' => $this->mataPelajaran->nama_mapel,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
