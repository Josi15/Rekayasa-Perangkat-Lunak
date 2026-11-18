<?php

namespace App\Http\Requests\Api\Pengumuman;

use App\Enums\CakupanPengumuman;
use App\Http\Requests\Api\DaftarRequest;
use App\Models\Pengumuman;
use Illuminate\Validation\Rule;

/**
 * GET /pengumuman?cakupan=global|mapel&id_mapel=&cari=&urut=&arah=
 * Isi dibatasi PengumumanPolicy::scope() (global untuk semua; mapel sesuai hak akses). Urutan bawaan: terbaru dulu.
 */
class DaftarPengumumanRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Pengumuman::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['created_at', 'id_pengumuman', 'judul'];
    }

    protected function statusValid(): array
    {
        return ['semua']; // pengumuman tidak punya status/arsip
    }

    protected function statusBawaan(): string
    {
        return 'semua';
    }

    public function arah(): string
    {
        return $this->string('arah', 'desc')->toString();
    }

    public function rules(): array
    {
        return parent::rules() + [
            'cakupan' => ['sometimes', 'string', Rule::in(CakupanPengumuman::values())],
            'id_mapel' => ['sometimes', 'bail', 'integer', 'min:1'],
        ];
    }
}
