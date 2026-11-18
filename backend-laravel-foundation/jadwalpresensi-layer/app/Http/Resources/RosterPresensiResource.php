<?php

namespace App\Http\Resources;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Satu baris roster: siswa kelas + presensinya pada satu jadwal (status "belum_tercatat" bila belum ada).
 * Harus dimuat dengan relasi presensi yang sudah difilter ke jadwal tersebut.
 *
 * @mixin Pengguna
 */
class RosterPresensiResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $p = $this->presensi->first();

        return [
            'id_siswa' => $this->id_pengguna,
            'nisn' => $this->nisn,
            'username' => $this->username,
            'akun_aktif' => $this->aktif(),
            'status_kehadiran' => $p?->status_kehadiran->value ?? 'belum_tercatat',
            'presensi' => $p ? PresensiResource::make($p) : null,
        ];
    }
}
