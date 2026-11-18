<?php

namespace App\Http\Requests\Api\Master;

use App\Enums\Peran;
use App\Models\Kelas;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;

/** PUT /kelas/{kelas}/wali {id_wali} */
class GantiWaliRequest extends FormRequest
{
    public function authorize(): bool
    {
        $kelas = $this->route('kelas');

        return $kelas instanceof Kelas && ($this->user()?->can('gantiWali', $kelas) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'id_wali' => ['bail', 'required', 'integer', AturanPengguna::aktifSebagai(Peran::Guru)],
        ];
    }
}
