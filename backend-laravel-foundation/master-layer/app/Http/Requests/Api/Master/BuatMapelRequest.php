<?php

namespace App\Http\Requests\Api\Master;

use App\Enums\Peran;
use App\Models\MataPelajaran;
use App\Support\AturanPengguna;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /mapel — unik per (nama_mapel, id_guru) sesuai constraint database. */
class BuatMapelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', MataPelajaran::class) ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // Klausa unik per guru hanya dipakai bila id_guru berupa bilangan bulat (hindari error tipe di PostgreSQL);
        // id_guru yang tidak valid sudah ditolak oleh aturannya sendiri di bawah.
        $guru = $this->input('id_guru');
        $unik = Rule::unique('mata_pelajaran', 'nama_mapel');

        if (filter_var($guru, FILTER_VALIDATE_INT) !== false) {
            $unik = $unik->where('id_guru', (int) $guru);
        }

        return [
            'nama_mapel' => ['required', 'string', 'max:100', $unik],
            'id_guru' => ['bail', 'required', 'integer', AturanPengguna::aktifSebagai(Peran::Guru)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['nama_mapel.unique' => 'Guru tersebut sudah mengampu mata pelajaran dengan nama yang sama.'];
    }
}
