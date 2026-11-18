<?php

namespace App\Http\Requests\Api\Materi;

use App\Models\Materi;
use App\Rules\JenisFileMateri;
use Illuminate\Foundation\Http\FormRequest;

/** POST /mapel/{mapel}/materi (multipart/form-data: judul, file). Hanya guru pengampu mapel itu. */
class BuatMateriRequest extends FormRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel !== null && ($this->user()?->can('create', [Materi::class, $mapel]) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'file' => JenisFileMateri::aturan(),
        ];
    }
}
