<?php

namespace App\Http\Requests\Api\Master;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\MataPelajaran;

/** GET /mapel?cari=&status=&id_guru=&urut=&arah= — isi tetap dibatasi MataPelajaranPolicy::scope(). */
class DaftarMapelRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', MataPelajaran::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['nama_mapel', 'id_mapel', 'created_at'];
    }

    public function rules(): array
    {
        return parent::rules() + [
            'id_guru' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
