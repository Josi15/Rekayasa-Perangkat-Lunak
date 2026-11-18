<?php

namespace App\Http\Requests\Api\Master;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\Kelas;

/** GET /kelas?cari=&status=&id_wali=&urut=&arah= — isi tetap dibatasi KelasPolicy::scope(). */
class DaftarKelasRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Kelas::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['nama_kelas', 'id_kelas', 'created_at'];
    }

    public function rules(): array
    {
        return parent::rules() + [
            'id_wali' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
