<?php

namespace App\Http\Requests\Api\Tugas;

use App\Models\PengumpulanTugas;
use App\Rules\JenisFileTugas;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /tugas/{tugas}/pengumpulan dan /pengumpulan/revisi (multipart: file).
 * Hanya siswa yang mengikuti mapel tugas ini (PengumpulanTugasPolicy::create). id_siswa/status/waktu_kumpul
 * dari klien diabaikan: ditentukan server.
 */
class KumpulTugasRequest extends FormRequest
{
    public function authorize(): bool
    {
        $tugas = $this->route('tugas');

        return $tugas !== null && ($this->user()?->can('create', [PengumpulanTugas::class, $tugas]) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return ['file' => JenisFileTugas::aturan('maks_kb_jawaban', true)];
    }
}
