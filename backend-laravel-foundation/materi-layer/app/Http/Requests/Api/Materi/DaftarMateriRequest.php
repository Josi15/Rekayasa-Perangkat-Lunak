<?php

namespace App\Http\Requests\Api\Materi;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\MataPelajaran;

/** GET /mapel/{mapel}/materi?cari=&urut=&arah=&page=&per_page= — hanya yang berhak melihat mapel. */
class DaftarMateriRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel instanceof MataPelajaran && ($this->user()?->can('view', $mapel) ?? false);
    }

    protected function kolomUrut(): array
    {
        return ['id_materi', 'judul', 'created_at'];
    }

    // Materi tidak memiliki status; parameter status hanya diterima dengan nilai "semua".
    protected function statusValid(): array
    {
        return ['semua'];
    }

    protected function statusBawaan(): string
    {
        return 'semua';
    }
}
