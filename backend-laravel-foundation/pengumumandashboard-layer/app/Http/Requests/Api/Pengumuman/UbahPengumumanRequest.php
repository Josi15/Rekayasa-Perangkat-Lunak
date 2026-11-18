<?php

namespace App\Http\Requests\Api\Pengumuman;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/** PATCH /pengumuman/{pengumuman} — admin, atau guru penulis yang masih mengampu mapelnya. Hanya judul/isi. */
class UbahPengumumanRequest extends FormRequest
{
    public function authorize(): bool
    {
        $p = $this->route('pengumuman');

        return $p !== null && ($this->user()?->can('update', $p) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'judul' => ['sometimes', 'required', 'string', 'max:255'],
            'isi' => ['sometimes', 'required', 'string', 'max:10000', 'regex:/^[^\x00]*$/u'],
            'cakupan' => ['prohibited'],
            'id_mapel' => ['prohibited'],
            'id_penulis' => ['prohibited'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->hasAny(['judul', 'isi'])) {
                $v->errors()->add('judul', 'Kirim minimal satu dari: judul, isi.');
            }
        });
    }
}
