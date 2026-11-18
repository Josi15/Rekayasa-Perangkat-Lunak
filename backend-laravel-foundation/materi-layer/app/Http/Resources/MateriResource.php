<?php

namespace App\Http\Resources;

use App\Models\Materi;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Path penyimpanan (kolom "file") bersifat internal dan TIDAK pernah dikirim ke klien;
 * klien mengunduh lewat url_file yang memeriksa izin.
 *
 * @mixin Materi
 */
class MateriResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $ekstensi = strtolower(pathinfo((string) $this->file, PATHINFO_EXTENSION));

        return [
            'id_materi' => $this->id_materi,
            'judul' => $this->judul,
            'id_mapel' => $this->id_mapel,
            'mapel' => $this->whenLoaded('mataPelajaran', fn () => [
                'id_mapel' => $this->mataPelajaran->id_mapel,
                'nama_mapel' => $this->mataPelajaran->nama_mapel,
            ]),
            'ekstensi' => $ekstensi,
            'tipe' => array_search($ekstensi, (array) config('materi.jenis'), true) ?: null,
            'url_file' => route('api.v1.materi.file', ['materi' => $this->id_materi], false),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
