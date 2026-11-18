<?php

namespace App\Http\Requests\Api\Tugas;

use App\Models\MataPelajaran;

/** GET /mapel/{mapel}/tugas — hanya yang berhak melihat mapel itu. */
class DaftarTugasMapelRequest extends DaftarTugasRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel instanceof MataPelajaran && ($this->user()?->can('view', $mapel) ?? false);
    }
}
