<?php

namespace App\Http\Requests\Api;

use App\Enums\Peran;
use App\Models\Pengguna;
use Illuminate\Validation\Rule;

/** GET /admin/pengguna?cari=&peran=&status=&urut=&arah=&page=&per_page= */
class DaftarPenggunaRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Pengguna::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['id_pengguna', 'username', 'peran', 'created_at'];
    }

    protected function statusValid(): array
    {
        return ['aktif', 'nonaktif', 'semua'];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return parent::rules() + [
            'peran' => ['sometimes', 'string', Rule::in(Peran::values())],
        ];
    }
}
