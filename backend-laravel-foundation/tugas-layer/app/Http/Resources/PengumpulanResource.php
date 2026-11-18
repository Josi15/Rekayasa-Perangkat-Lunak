<?php

namespace App\Http\Resources;

use App\Enums\StatusPengumpulan;
use App\Models\PengumpulanTugas;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * jawaban_file (path internal) tidak dikirim; unduh lewat url_file yang memeriksa izin.
 *
 * @mixin PengumpulanTugas
 */
class PengumpulanResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id_pengumpulan' => $this->id_pengumpulan,
            'id_tugas' => $this->id_tugas,
            'id_siswa' => $this->id_siswa,
            'siswa' => $this->whenLoaded('siswa', fn () => [
                'id_pengguna' => $this->siswa->id_pengguna,
                'nisn' => $this->siswa->nisn,
                'username' => $this->siswa->username,
            ]),
            'tugas' => $this->whenLoaded('tugas', fn () => [
                'id_tugas' => $this->tugas->id_tugas,
                'judul' => $this->tugas->judul,
                'batas_waktu' => $this->tugas->batas_waktu,
            ]),
            'status' => $this->status->value,
            // setelah dinilai status berubah menjadi "dinilai"; keterlambatan tetap dihitung dari waktu kumpul vs batas waktu
            'terlambat' => $this->status === StatusPengumpulan::Terlambat
                || ($this->relationLoaded('tugas') && $this->waktu_kumpul->greaterThan($this->tugas->batas_waktu)),
            'waktu_kumpul' => $this->waktu_kumpul,
            'url_file' => route('api.v1.pengumpulan.file', ['pengumpulan' => $this->id_pengumpulan], false),
        ];
    }
}
