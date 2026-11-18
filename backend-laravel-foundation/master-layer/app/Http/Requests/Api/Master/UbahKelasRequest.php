<?php

namespace App\Http\Requests\Api\Master;

use App\Models\Kelas;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PATCH /kelas/{kelas} — hanya nama. Wali diganti lewat PUT /kelas/{kelas}/wali. */
class UbahKelasRequest extends FormRequest
{
    private function kelas(): Kelas
    {
        /** @var Kelas */
        return $this->route('kelas');
    }

    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->kelas()) ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'id_wali' => ['prohibited'],
            'nama_kelas' => ['required', 'string', 'max:100', Rule::unique('kelas', 'nama_kelas')->ignore($this->kelas()->id_kelas, 'id_kelas')],
        ];
    }
}
