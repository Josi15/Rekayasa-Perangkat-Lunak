<?php

namespace App\Http\Requests\Api\Master;

use App\Enums\Peran;
use App\Models\Kelas;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /kelas — wali kelas harus guru AKTIF (FK + peran + status). */
class BuatKelasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Kelas::class) ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'nama_kelas' => ['required', 'string', 'max:100', Rule::unique('kelas', 'nama_kelas')],
            'id_wali' => ['bail', 'required', 'integer', AturanPengguna::aktifSebagai(Peran::Guru)],
        ];
    }
}
