<?php

namespace App\Http\Requests\Api\Presensi;

use App\Models\Presensi;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /jadwal/{jadwal}/checkin — siswa pada kelas jadwal itu. Hanya koordinat yang diterima dari klien.
 * id_siswa, waktu_checkin, status_kehadiran, dan status_validasi_lokasi DITENTUKAN SERVER (input ditolak).
 */
class CheckinRequest extends FormRequest
{
    public function authorize(): bool
    {
        $jadwal = $this->route('jadwal');

        return $jadwal !== null && ($this->user()?->can('create', [Presensi::class, $jadwal]) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'lokasi_lat' => ['nullable', 'bail', 'numeric', 'between:-90,90', 'required_with:lokasi_lng'],
            'lokasi_lng' => ['nullable', 'bail', 'numeric', 'between:-180,180', 'required_with:lokasi_lat'],
            'id_siswa' => ['prohibited'],
            'id_jadwal' => ['prohibited'],
            'waktu_checkin' => ['prohibited'],
            'status_kehadiran' => ['prohibited'],
            'status_validasi_lokasi' => ['prohibited'],
        ];
    }

    public function lat(): ?float
    {
        return $this->filled('lokasi_lat') ? (float) $this->input('lokasi_lat') : null;
    }

    public function lng(): ?float
    {
        return $this->filled('lokasi_lng') ? (float) $this->input('lokasi_lng') : null;
    }
}
