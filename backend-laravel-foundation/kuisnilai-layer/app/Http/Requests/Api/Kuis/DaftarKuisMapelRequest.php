<?php

namespace App\Http\Requests\Api\Kuis;

use App\Models\MataPelajaran;

/** GET /mapel/{mapel}/kuis — hanya yang berhak melihat mapel itu. */
class DaftarKuisMapelRequest extends DaftarKuisRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel instanceof MataPelajaran && ($this->user()?->can('view', $mapel) ?? false);
    }
}
