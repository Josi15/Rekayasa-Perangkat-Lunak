<?php

namespace App\Http\Requests\Api\Tugas;

use App\Enums\Peran;

/** GET /pengumpulan/saya?status=&urut=&arah= — pengumpulan milik siswa yang login. */
class DaftarPengumpulanSayaRequest extends DaftarPengumpulanRequest
{
    public function authorize(): bool
    {
        return $this->user()?->peran === Peran::Siswa;
    }
}
