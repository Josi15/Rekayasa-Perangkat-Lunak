<?php

namespace App\Http\Requests\Api\Tugas;

use App\Models\Tugas;
use App\Rules\JenisFileTugas;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /mapel/{mapel}/tugas (multipart bila ada lampiran). Hanya guru pengampu mapel itu.
 * batas_waktu: ISO-8601 (mis. 2026-11-01T23:59:00+07:00) dan harus di masa depan.
 */
class BuatTugasRequest extends FormRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel !== null && ($this->user()?->can('create', [Tugas::class, $mapel]) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'instruksi' => ['required', 'string', 'max:20000'],
            'batas_waktu' => ['required', 'date', 'after:now'],
            'lampiran' => JenisFileTugas::aturan('maks_kb_lampiran', false),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['batas_waktu.after' => 'Batas waktu harus di masa depan.'];
    }
}
