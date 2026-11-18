<?php

namespace App\Http\Requests\Api\Jadwal;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\Jadwal;

/**
 * GET /jadwal?tanggal=Y-m-d | dari=&sampai=&id_kelas=&id_guru=&id_mapel=&urut=&arah=
 * Isi dibatasi JadwalPolicy::scope(). Tanggal dihitung pada zona waktu sekolah (config presensi.zona_waktu).
 */
class DaftarJadwalRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Jadwal::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['waktu_mulai', 'id_jadwal', 'created_at'];
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
            'tanggal' => ['sometimes', 'date_format:Y-m-d', 'prohibits:dari,sampai'],
            'dari' => ['sometimes', 'date_format:Y-m-d'],
            'sampai' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:dari'],
            'id_kelas' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_guru' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_mapel' => ['sometimes', 'bail', 'integer', 'min:1'],
        ];
    }
}
