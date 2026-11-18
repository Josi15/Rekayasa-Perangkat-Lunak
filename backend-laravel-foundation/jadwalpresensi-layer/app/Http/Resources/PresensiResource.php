<?php

namespace App\Http\Resources;

use App\Models\Presensi;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Koordinat ditampilkan kepada yang berhak melihat presensi (siswa pemilik, guru pada jadwal, admin).
 * jarak_meter/radius_meter hanya ada pada respons check-in (dihitung server, tidak disimpan).
 *
 * @mixin Presensi
 */
class PresensiResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $atribut = $this->resource->getAttributes();

        return [
            'id_presensi' => $this->id_presensi,
            'id_siswa' => $this->id_siswa,
            'id_jadwal' => $this->id_jadwal,
            'siswa' => $this->whenLoaded('siswa', fn () => [
                'id_pengguna' => $this->siswa->id_pengguna,
                'nisn' => $this->siswa->nisn,
                'username' => $this->siswa->username,
            ]),
            'jadwal' => $this->whenLoaded('jadwal', fn () => [
                'id_jadwal' => $this->jadwal->id_jadwal,
                'id_mapel' => $this->jadwal->id_mapel,
                'id_kelas' => $this->jadwal->id_kelas,
                'waktu_mulai' => $this->jadwal->waktu_mulai,
                'waktu_selesai' => $this->jadwal->waktu_selesai,
            ]),
            'waktu_checkin' => $this->waktu_checkin,
            'status_kehadiran' => $this->status_kehadiran->value,
            'lokasi_lat' => $this->lokasi_lat !== null ? (float) $this->lokasi_lat : null,
            'lokasi_lng' => $this->lokasi_lng !== null ? (float) $this->lokasi_lng : null,
            'status_validasi_lokasi' => $this->status_validasi_lokasi->value,
            'jarak_meter' => $this->when(array_key_exists('jarak_meter', $atribut), fn () => $atribut['jarak_meter']),
            'radius_meter' => $this->when(array_key_exists('radius_meter', $atribut), fn () => $atribut['radius_meter']),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
