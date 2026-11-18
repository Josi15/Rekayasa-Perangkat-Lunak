<?php

namespace App\Http\Requests\Api\Tugas;

use App\Rules\JenisFileTugas;
use Illuminate\Foundation\Http\FormRequest;

/** POST /tugas/{tugas}/lampiran (multipart: lampiran). Hanya guru pengampu. */
class GantiLampiranTugasRequest extends FormRequest
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
        return ['lampiran' => JenisFileTugas::aturan('maks_kb_lampiran', true)];
    }
}
