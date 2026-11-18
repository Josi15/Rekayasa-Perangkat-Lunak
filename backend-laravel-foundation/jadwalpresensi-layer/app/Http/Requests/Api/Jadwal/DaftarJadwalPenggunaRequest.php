<?php

namespace App\Http\Requests\Api\Jadwal;

use App\Models\Pengguna;

/** GET /siswa/{siswa}/jadwal dan GET /guru/{guru}/jadwal — izin per PenggunaPolicy::viewJadwal. */
class DaftarJadwalPenggunaRequest extends DaftarJadwalRequest
{
    public function authorize(): bool
    {
        $target = $this->route('siswa') ?? $this->route('guru');

        return $target instanceof Pengguna && ($this->user()?->can('viewJadwal', $target) ?? false);
    }
}
