<?php

namespace App\Http\Requests\Api\Nilai;

use App\Models\Pengguna;

/** GET /siswa/{siswa}/nilai — admin, siswa itu sendiri, atau guru (hanya nilai pada mapel yang diampunya). */
class DaftarNilaiSiswaRequest extends DaftarNilaiRequest
{
    public function authorize(): bool
    {
        $siswa = $this->route('siswa');

        return $siswa instanceof Pengguna && ($this->user()?->can('viewNilai', $siswa) ?? false);
    }
}
