<?php

namespace App\Http\Requests\Api\Tugas;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * PATCH /tugas/{tugas} (JSON). batas_waktu baru harus di masa depan (untuk menutup tugas pakai POST /tugas/{id}/tutup).
 * Lampiran diganti lewat endpoint lampiran; id_mapel tidak dapat dipindah.
 */
class UbahTugasRequest extends FormRequest
{
    public function authorize(): bool
    {
        $tugas = $this->route('tugas');

        return $tugas !== null && ($this->user()?->can('update', $tugas) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'judul' => ['sometimes', 'required', 'string', 'max:255'],
            'instruksi' => ['sometimes', 'required', 'string', 'max:20000'],
            'batas_waktu' => ['sometimes', 'required', 'date', 'after:now'],
            'lampiran' => ['prohibited'],
            'id_mapel' => ['prohibited'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['batas_waktu.after' => 'Batas waktu harus di masa depan. Untuk menutup tugas gunakan endpoint tutup.'];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->hasAny(['judul', 'instruksi', 'batas_waktu'])) {
                $v->errors()->add('judul', 'Kirim minimal satu dari: judul, instruksi, batas_waktu.');
            }
        });
    }
}
