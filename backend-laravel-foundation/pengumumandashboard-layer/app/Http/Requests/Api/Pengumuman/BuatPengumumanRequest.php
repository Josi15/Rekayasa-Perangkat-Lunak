<?php

namespace App\Http\Requests\Api\Pengumuman;

use App\Enums\CakupanPengumuman;
use App\Enums\Peran;
use App\Models\MataPelajaran;
use App\Models\Pengumuman;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /pengumuman
 *  - cakupan=global : hanya admin; id_mapel dilarang.
 *  - cakupan=mapel  : admin atau guru pengampu id_mapel; id_mapel wajib dan harus mapel yang ada.
 * id_penulis tidak diterima dari klien (selalu pengguna yang login).
 */
class BuatPengumumanRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || $user->peran === Peran::Siswa) {
            return false;
        }

        $cakupan = $this->input('cakupan');

        if ($cakupan === CakupanPengumuman::Umum->value) {
            return $user->can('create', Pengumuman::class);
        }

        if ($cakupan === CakupanPengumuman::Mapel->value) {
            $id = $this->input('id_mapel');
            $mapel = is_scalar($id) && ctype_digit((string) $id) && strlen((string) $id) <= 18
                ? MataPelajaran::query()->find((int) $id) : null;

            // mapel tak ditemukan/tak valid: biarkan validasi menjawab 422 (tidak ada data yang bocor)
            return $mapel === null || $user->can('create', [Pengumuman::class, $mapel]);
        }

        return true; // cakupan kosong/salah: 422 dari validasi
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'isi' => ['required', 'string', 'max:10000', 'regex:/^[^\x00]*$/u'],
            'cakupan' => ['required', 'string', Rule::in(CakupanPengumuman::values())],
            'id_mapel' => [
                Rule::requiredIf(fn () => $this->input('cakupan') === CakupanPengumuman::Mapel->value),
                Rule::prohibitedIf(fn () => $this->input('cakupan') === CakupanPengumuman::Umum->value),
                'bail', 'integer', 'min:1', Rule::exists('mata_pelajaran', 'id_mapel'),
            ],
            'id_penulis' => ['prohibited'],
        ];
    }
}
