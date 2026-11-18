<?php

namespace App\Http\Requests\Api\Kuis;

use App\Rules\TautanGoogleForm;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/** PATCH /kuis/{kuis} — guru pengampu. id_mapel tidak dapat dipindah. */
class UbahKuisRequest extends FormRequest
{
    public function authorize(): bool
    {
        $kuis = $this->route('kuis');

        return $kuis !== null && ($this->user()?->can('update', $kuis) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'judul' => ['sometimes', 'required', 'string', 'max:255'],
            'tautan_google_form' => ['sometimes', 'required', 'string', 'max:2048', new TautanGoogleForm],
            'id_mapel' => ['prohibited'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->hasAny(['judul', 'tautan_google_form'])) {
                $v->errors()->add('judul', 'Kirim minimal satu dari: judul, tautan_google_form.');
            }
        });
    }
}
