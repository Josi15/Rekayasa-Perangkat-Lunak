<?php

namespace App\Http\Requests\Api\Kuis;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\Kuis;

/** GET /kuis?id_mapel=&cari=&urut=&arah= — isi dibatasi KuisPolicy::scope() (siswa: mapel yang diikuti; guru: yang diampu; admin: semua). */
class DaftarKuisRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Kuis::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['id_kuis', 'judul', 'created_at'];
    }

    protected function statusValid(): array
    {
        return ['semua']; // kuis tidak punya status/arsip
    }

    protected function statusBawaan(): string
    {
        return 'semua';
    }

    public function rules(): array
    {
        return parent::rules() + ['id_mapel' => ['sometimes', 'bail', 'integer', 'min:1']];
    }
}
