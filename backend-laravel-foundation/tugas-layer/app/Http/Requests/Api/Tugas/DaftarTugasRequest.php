<?php

namespace App\Http\Requests\Api\Tugas;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\Tugas;

/**
 * GET /tugas?status=terbuka|tertutup|semua&id_mapel=&cari=&urut=&arah= — isi dibatasi TugasPolicy::scope()
 * (siswa: tugas pada mapel yang diikutinya; guru: mapel yang diampu; admin: semua).
 */
class DaftarTugasRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Tugas::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['batas_waktu', 'judul', 'id_tugas', 'created_at'];
    }

    protected function statusValid(): array
    {
        return ['terbuka', 'tertutup', 'semua'];
    }

    protected function statusBawaan(): string
    {
        return 'semua';
    }

    public function rules(): array
    {
        return parent::rules() + [
            'id_mapel' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
