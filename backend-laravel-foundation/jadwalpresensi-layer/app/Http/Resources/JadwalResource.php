<?php

namespace App\Http\Resources;

use App\Enums\Peran;
use App\Models\Jadwal;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Jadwal */
class JadwalResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $sekarang = now();

        return [
            'id_jadwal' => $this->id_jadwal,
            'id_mapel' => $this->id_mapel,
            'id_kelas' => $this->id_kelas,
            'id_guru' => $this->id_guru,
            'mapel' => $this->whenLoaded('mataPelajaran', fn () => [
                'id_mapel' => $this->mataPelajaran->id_mapel,
                'nama_mapel' => $this->mataPelajaran->nama_mapel,
            ]),
            'kelas' => $this->whenLoaded('kelas', fn () => [
                'id_kelas' => $this->kelas->id_kelas,
                'nama_kelas' => $this->kelas->nama_kelas,
            ]),
            'guru' => $this->whenLoaded('guru', fn () => [
                'id_pengguna' => $this->guru->id_pengguna,
                // NIP adalah identitas pribadi: hanya admin yang membutuhkannya; siswa/guru lain cukup username.
                'nip' => $this->when($request->user()?->peran === Peran::Admin, fn () => $this->guru->nip),
                'username' => $this->guru->username,
            ]),
            'waktu_mulai' => $this->waktu_mulai,
            'waktu_selesai' => $this->waktu_selesai,
            'durasi_menit' => (int) $this->waktu_mulai->diffInMinutes($this->waktu_selesai),
            'status' => match (true) {
                $sekarang->lessThan($this->waktu_mulai) => 'akan_datang',
                $sekarang->lessThanOrEqualTo($this->waktu_selesai) => 'berlangsung',
                default => 'selesai',
            },
            'jumlah_presensi' => $this->whenCounted('presensi'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
