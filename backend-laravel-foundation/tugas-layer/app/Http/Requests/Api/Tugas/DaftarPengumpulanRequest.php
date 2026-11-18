<?php

namespace App\Http\Requests\Api\Tugas;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\Tugas;

/** GET /tugas/{tugas}/pengumpulan?cari=&status=&urut=&arah= — guru pengampu dan admin. */
class DaftarPengumpulanRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        $tugas = $this->route('tugas');

        return $tugas instanceof Tugas && ($this->user()?->can('lihatPengumpulan', $tugas) ?? false);
    }

    protected function kolomUrut(): array
    {
        return ['waktu_kumpul', 'id_pengumpulan', 'created_at'];
    }

    protected function statusValid(): array
    {
        return ['dikumpulkan', 'terlambat', 'dinilai', 'semua'];
    }

    protected function statusBawaan(): string
    {
        return 'semua';
    }
}
