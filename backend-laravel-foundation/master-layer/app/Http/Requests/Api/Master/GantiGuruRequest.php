<?php

namespace App\Http\Requests\Api\Master;

use App\Enums\Peran;
use App\Models\MataPelajaran;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PUT /mapel/{mapel}/guru {id_guru} — guru baru harus guru aktif dan belum mengampu nama mapel yang sama. */
class GantiGuruRequest extends FormRequest
{
    public function authorize(): bool
    {
        $mapel = $this->route('mapel');

        return $mapel instanceof MataPelajaran && ($this->user()?->can('gantiGuru', $mapel) ?? false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var MataPelajaran $mapel */
        $mapel = $this->route('mapel');

        return [
            'id_guru' => [
                'bail', 'required', 'integer', AturanPengguna::aktifSebagai(Peran::Guru),
                Rule::unique('mata_pelajaran', 'id_guru')->where('nama_mapel', $mapel->nama_mapel)->ignore($mapel->id_mapel, 'id_mapel'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['id_guru.unique' => 'Guru tersebut sudah mengampu mata pelajaran dengan nama yang sama.'];
    }
}
