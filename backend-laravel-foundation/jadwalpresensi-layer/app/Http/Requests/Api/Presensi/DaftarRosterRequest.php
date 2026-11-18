<?php

namespace App\Http\Requests\Api\Presensi;

use App\Enums\StatusKehadiran;
use App\Http\Requests\Api\DaftarRequest;
use Illuminate\Validation\Rule;

/** GET /jadwal/{jadwal}/presensi?status_kehadiran=hadir|...|belum_tercatat — admin atau guru pada jadwal itu. */
class DaftarRosterRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        $jadwal = $this->route('jadwal');

        return $jadwal !== null && ($this->user()?->can('lihatPresensi', $jadwal) ?? false);
    }

    protected function kolomUrut(): array
    {
        return ['username', 'nisn', 'id_pengguna'];
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
            'status_kehadiran' => ['sometimes', 'string', Rule::in([...StatusKehadiran::values(), 'belum_tercatat'])],
        ];
    }
}
