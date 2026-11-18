<?php

namespace App\Http\Requests\Api\Nilai;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/** PATCH /nilai/{nilai} — guru pengampu. Hanya nilai & umpan_balik; siswa dan sumber tidak dapat diubah. */
class UbahNilaiRequest extends FormRequest
{
    public function authorize(): bool
    {
        $nilai = $this->route('nilai');

        return $nilai !== null && ($this->user()?->can('update', $nilai) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'nilai' => AturanNilai::nilai(false),
            'umpan_balik' => AturanNilai::umpanBalik(),
            'id_siswa' => ['prohibited'],
            'id_pengumpulan' => ['prohibited'],
            'id_kuis' => ['prohibited'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->hasAny(['nilai', 'umpan_balik'])) {
                $v->errors()->add('nilai', 'Kirim minimal satu dari: nilai, umpan_balik.');
            }
        });
    }
}
