<?php

namespace App\Http\Requests\Api\Nilai;

use App\Enums\Peran;
use App\Models\Nilai;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;

/** POST /kuis/{kuis}/nilai — guru pengampu mapel kuis itu; id_siswa = siswa aktif yang mengikuti mapel (dicek di service). */
class CatatNilaiKuisRequest extends FormRequest
{
    public function authorize(): bool
    {
        $kuis = $this->route('kuis');

        return $kuis !== null && ($this->user()?->can('beri', [Nilai::class, $kuis]) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_siswa' => ['required', 'bail', 'integer', 'min:1', AturanPengguna::aktifSebagai(Peran::Siswa)],
            'nilai' => AturanNilai::nilai(),
            'umpan_balik' => AturanNilai::umpanBalik(),
            'id_pengumpulan' => ['prohibited'],
            'id_kuis' => ['prohibited'],
        ];
    }
}
