<?php

namespace App\Http\Requests\Api\Materi;

use App\Rules\JenisFileMateri;
use Illuminate\Foundation\Http\FormRequest;

/** POST /materi/{materi}/file (multipart/form-data: file). Hanya guru pengampu. */
class GantiFileMateriRequest extends FormRequest
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
            'file' => JenisFileMateri::aturan(),
        ];
    }
}
