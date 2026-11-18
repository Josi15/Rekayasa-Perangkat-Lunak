<?php

namespace App\Http\Requests\Api\Jadwal;

use App\Enums\Peran;
use App\Models\Jadwal;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /jadwal — admin. Waktu wajib ISO-8601 DENGAN offset zona (mis. 2026-11-02T07:30:00+07:00 atau ...Z)
 * agar tidak ambigu. id_guru opsional (bawaan: guru pengampu mapel).
 */
class BuatJadwalRequest extends FormRequest
{
    public const ISO = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/';

    public function authorize(): bool
    {
        return $this->user()?->can('create', Jadwal::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        // 'after:waktu_mulai' memanggil Carbon::parse() pada waktu_mulai; bila bukan string (mis. array) itu 500, bukan 422.
        // waktu_mulai sendiri sudah ditolak 'string' di atas, jadi pembandingan cukup dilewati.
        $selesai = ['required', 'bail', 'string', 'regex:'.self::ISO, 'date'];
        if (is_string($this->input('waktu_mulai'))) {
            $selesai[] = 'after:waktu_mulai';
        }

        return [
            'id_mapel' => ['required', 'bail', 'integer', 'min:1', 'exists:mata_pelajaran,id_mapel'],
            'id_kelas' => ['required', 'bail', 'integer', 'min:1', 'exists:kelas,id_kelas'],
            'id_guru' => ['sometimes', 'bail', 'integer', 'min:1', AturanPengguna::aktifSebagai(Peran::Guru)],
            'waktu_mulai' => ['required', 'bail', 'string', 'regex:'.self::ISO, 'date', 'after:now'],
            'waktu_selesai' => $selesai,
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'waktu_mulai.regex' => 'Format waktu harus ISO-8601 dengan zona, mis. 2026-11-02T07:30:00+07:00.',
            'waktu_selesai.regex' => 'Format waktu harus ISO-8601 dengan zona, mis. 2026-11-02T09:00:00+07:00.',
            'waktu_mulai.after' => 'Waktu mulai harus di masa depan.',
            'waktu_selesai.after' => 'Waktu selesai harus setelah waktu mulai.',
        ];
    }
}
