<?php

namespace App\Http\Requests\Api\Presensi;

use App\Enums\Peran;
use App\Enums\StatusKehadiran;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /jadwal/{jadwal}/presensi — admin atau guru pada jadwal itu mencatat presensi tanpa check-in
 * (izin, sakit, alpa, atau hadir/terlambat manual). Tanpa waktu_checkin/lokasi; validasi lokasi = belum_divalidasi.
 */
class CatatPresensiRequest extends FormRequest
{
    public function authorize(): bool
    {
        $jadwal = $this->route('jadwal');

        return $jadwal !== null && ($this->user()?->can('catatPresensi', $jadwal) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_siswa' => ['required', 'bail', 'integer', 'min:1', AturanPengguna::aktifSebagai(Peran::Siswa)],
            'status_kehadiran' => ['required', 'string', Rule::in(StatusKehadiran::values())],
            'waktu_checkin' => ['prohibited'],
            'lokasi_lat' => ['prohibited'],
            'lokasi_lng' => ['prohibited'],
            'status_validasi_lokasi' => ['prohibited'],
        ];
    }
}
