<?php

namespace App\Http\Requests\Api\Master;

use App\Enums\Peran;
use App\Models\Kelas;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /kelas/{kelas}/anggota {id_siswa: [..]} — hanya siswa AKTIF. Keanggotaan ganda ditolak 409
 * oleh KeanggotaanKelasService (PK komposit siswa_kelas), bukan 422.
 */
class TambahAnggotaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $kelas = $this->route('kelas');

        return $kelas instanceof Kelas && ($this->user()?->can('kelolaAnggota', $kelas) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'id_siswa' => ['required', 'array', 'min:1', 'max:100'],
            'id_siswa.*' => ['bail', 'integer', 'distinct', AturanPengguna::aktifSebagai(Peran::Siswa)],
        ];
    }
}
