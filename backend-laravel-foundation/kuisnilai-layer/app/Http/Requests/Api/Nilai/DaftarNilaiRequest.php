<?php

namespace App\Http\Requests\Api\Nilai;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\Nilai;
use Illuminate\Validation\Rule;

/**
 * GET /nilai?id_mapel=&id_siswa=&sumber=tugas|kuis&id_tugas=&id_kuis=&urut=&arah=
 * Isi dibatasi NilaiPolicy::scope() (siswa: miliknya; guru: mapel yang diampu; admin: semua, hanya baca).
 */
class DaftarNilaiRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Nilai::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['id_nilai', 'nilai', 'created_at', 'updated_at'];
    }

    protected function statusValid(): array
    {
        return ['semua'];
    }

    protected function statusBawaan(): string
    {
        return 'semua';
    }

    public function rules(): array
    {
        return parent::rules() + [
            'id_mapel' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_siswa' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_tugas' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_kuis' => ['sometimes', 'bail', 'integer', 'min:1'],
            'sumber' => ['sometimes', 'string', Rule::in(['tugas', 'kuis'])],
        ];
    }
}
