<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Satu baris rekap (objek hasil query agregat). Hanya hitungan; tidak ada persentase atau nilai akhir.
 *
 * @property-read object $resource
 */
class RekapPresensiResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $r = $this->resource;

        return [
            'id_siswa' => (int) $r->id_siswa,
            'nisn' => $r->nisn,
            'username' => $r->username,
            'total_sesi' => (int) $r->total_sesi,
            'tercatat' => (int) $r->tercatat,
            'belum_tercatat' => (int) $r->total_sesi - (int) $r->tercatat,
            'hadir' => (int) $r->hadir,
            'terlambat' => (int) $r->terlambat,
            'izin' => (int) $r->izin,
            'sakit' => (int) $r->sakit,
            'alpa' => (int) $r->alpa,
        ];
    }
}
