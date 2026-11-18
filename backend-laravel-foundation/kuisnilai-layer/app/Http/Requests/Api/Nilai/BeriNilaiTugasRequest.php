<?php

namespace App\Http\Requests\Api\Nilai;

use App\Models\Nilai;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /pengumpulan/{pengumpulan}/nilai — guru pengampu mapel tugas itu. id_siswa/id_pengumpulan/id_kuis
 * tidak diterima dari klien (siswa diturunkan dari pengumpulan).
 */
class BeriNilaiTugasRequest extends FormRequest
{
    public function authorize(): bool
    {
        $p = $this->route('pengumpulan');

        return $p !== null && ($this->user()?->can('beri', [Nilai::class, $p]) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'nilai' => AturanNilai::nilai(),
            'umpan_balik' => AturanNilai::umpanBalik(),
            'id_siswa' => ['prohibited'],
            'id_pengumpulan' => ['prohibited'],
            'id_kuis' => ['prohibited'],
        ];
    }
}
