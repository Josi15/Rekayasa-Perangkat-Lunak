<?php

namespace App\Http\Requests\Api\Pengumuman;

use App\Models\MataPelajaran;

/** GET /mapel/{mapel}/pengumuman — hanya yang berhak melihat mapel itu. */
class DaftarPengumumanMapelRequest extends DaftarPengumumanRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel instanceof MataPelajaran && ($this->user()?->can('view', $mapel) ?? false);
    }
}
