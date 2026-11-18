<?php

namespace App\Http\Requests\Api\Jadwal;

use App\Enums\Peran;
use App\Support\AturanPengguna;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/** PATCH /jadwal/{jadwal} — admin; hanya jadwal mendatang tanpa presensi (selain itu 409). */
class UbahJadwalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $jadwal = $this->route('jadwal');

        return $jadwal !== null && ($this->user()?->can('update', $jadwal) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_mapel' => ['sometimes', 'bail', 'integer', 'min:1', 'exists:mata_pelajaran,id_mapel'],
            'id_kelas' => ['sometimes', 'bail', 'integer', 'min:1', 'exists:kelas,id_kelas'],
            'id_guru' => ['sometimes', 'bail', 'integer', 'min:1', AturanPengguna::aktifSebagai(Peran::Guru)],
            'waktu_mulai' => ['sometimes', 'bail', 'string', 'regex:'.BuatJadwalRequest::ISO, 'date', 'after:now'],
            'waktu_selesai' => ['sometimes', 'bail', 'string', 'regex:'.BuatJadwalRequest::ISO, 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->hasAny(['id_mapel', 'id_kelas', 'id_guru', 'waktu_mulai', 'waktu_selesai'])) {
                $v->errors()->add('waktu_mulai', 'Kirim minimal satu field yang diubah.');
            }
        });
    }
}
