<?php

namespace App\Http\Requests\Api\Nilai;

use App\Models\MataPelajaran;

/** GET /mapel/{mapel}/nilai — rekap nilai satu mapel: guru pengampu atau admin. */
class DaftarNilaiMapelRequest extends DaftarNilaiRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel instanceof MataPelajaran && ($this->user()?->can('lihatNilai', $mapel) ?? false);
    }
}
