<?php

namespace App\Http\Requests\Api\Presensi;

use App\Enums\StatusKehadiran;
use App\Enums\StatusValidasiLokasi;
use App\Http\Requests\Api\DaftarRequest;
use App\Models\Presensi;
use Illuminate\Validation\Rule;

/**
 * GET /presensi?dari=&sampai=&id_kelas=&id_mapel=&id_siswa=&id_jadwal=&status_kehadiran=&status_validasi_lokasi=
 * dari/sampai menyaring waktu_mulai jadwal. Isi dibatasi PresensiPolicy::scope(). Terbaru lebih dulu.
 */
class DaftarPresensiRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Presensi::class) ?? false;
    }

    protected function kolomUrut(): array
    {
        return ['id_presensi', 'waktu_checkin', 'created_at'];
    }

    protected function statusValid(): array
    {
        return ['semua'];
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
            'dari' => ['sometimes', 'date_format:Y-m-d'],
            'sampai' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:dari'],
            'id_kelas' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_mapel' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_siswa' => ['sometimes', 'bail', 'integer', 'min:1'],
            'id_jadwal' => ['sometimes', 'bail', 'integer', 'min:1'],
            'status_kehadiran' => ['sometimes', 'string', Rule::in(StatusKehadiran::values())],
            'status_validasi_lokasi' => ['sometimes', 'string', Rule::in(StatusValidasiLokasi::values())],
        ];
    }
}
