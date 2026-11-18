<?php

namespace App\Http\Requests\Api\Presensi;

use App\Enums\StatusKehadiran;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PATCH /presensi/{presensi} — admin atau guru pada jadwal itu. Hanya status_kehadiran yang dapat dikoreksi. */
class KoreksiPresensiRequest extends FormRequest
{
    public function authorize(): bool
    {
        $presensi = $this->route('presensi');

        return $presensi !== null && ($this->user()?->can('update', $presensi) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'status_kehadiran' => ['required', 'string', Rule::in(StatusKehadiran::values())],
            'id_siswa' => ['prohibited'],
            'id_jadwal' => ['prohibited'],
            'waktu_checkin' => ['prohibited'],
            'lokasi_lat' => ['prohibited'],
            'lokasi_lng' => ['prohibited'],
            'status_validasi_lokasi' => ['prohibited'],
        ];
    }
}
