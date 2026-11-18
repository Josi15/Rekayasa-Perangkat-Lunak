<?php

namespace App\Http\Requests\Api\Master;

use App\Models\MataPelajaran;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PATCH /mapel/{mapel} — hanya nama. Guru pengampu diganti lewat PUT /mapel/{mapel}/guru. */
class UbahMapelRequest extends FormRequest
{
    private function mapel(): MataPelajaran
    {
        /** @var MataPelajaran */
        return $this->route('mapel');
    }

    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->mapel()) ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $mapel = $this->mapel();

        return [
            'id_guru' => ['prohibited'],
            'nama_mapel' => [
                'required', 'string', 'max:100',
                Rule::unique('mata_pelajaran', 'nama_mapel')->where('id_guru', $mapel->id_guru)->ignore($mapel->id_mapel, 'id_mapel'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['nama_mapel.unique' => 'Guru pengampu sudah memiliki mata pelajaran dengan nama yang sama.'];
    }
}
