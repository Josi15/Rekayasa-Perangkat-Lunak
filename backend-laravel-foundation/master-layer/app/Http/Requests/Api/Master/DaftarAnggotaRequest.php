<?php

namespace App\Http\Requests\Api\Master;

use App\Http\Requests\Api\DaftarRequest;
use App\Models\Kelas;

/** GET /kelas/{kelas}/anggota?cari=&status=&urut=&arah= — status = status AKUN siswa; bawaan: semua. */
class DaftarAnggotaRequest extends DaftarRequest
{
    public function authorize(): bool
    {
        $kelas = $this->route('kelas');

        return $kelas instanceof Kelas && ($this->user()?->can('viewAnggota', $kelas) ?? false);
    }

    protected function kolomUrut(): array
    {
        return ['id_pengguna', 'username', 'nisn'];
    }

    protected function statusValid(): array
    {
        return ['aktif', 'nonaktif', 'semua'];
    }

    protected function statusBawaan(): string
    {
        return 'semua';
    }
}
