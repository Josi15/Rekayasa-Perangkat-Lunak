<?php

namespace App\Http\Requests\Api\Materi;

use Illuminate\Foundation\Http\FormRequest;

/** PATCH /materi/{materi} (JSON) — hanya judul. File diganti lewat POST /materi/{materi}/file. */
class UbahMateriRequest extends FormRequest
{
    public function authorize(): bool
    {
        $materi = $this->route('materi');

        return $materi !== null && ($this->user()?->can('update', $materi) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'file' => ['prohibited'],
            'id_mapel' => ['prohibited'],
        ];
    }
}
