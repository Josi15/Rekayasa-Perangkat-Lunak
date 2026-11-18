<?php

namespace App\Http\Requests\Api\Master;

use App\Enums\Peran;
use App\Models\Pengguna;
use App\Rules\IdentitasLoginUnik;
use App\Rules\UnikTanpaHurufBesarKecil;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * PATCH /admin/pengguna/{pengguna}. "peran" dilarang (immutable). Identitas yang sah mengikuti
 * peran akun target: siswa=NISN, guru=NIP, admin=username; kolom milik peran lain dilarang.
 */
class UbahPenggunaRequest extends FormRequest
{
    private function target(): Pengguna
    {
        /** @var Pengguna */
        return $this->route('pengguna');
    }

    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->target()) ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $target = $this->target();
        $id = $target->getKey();

        return [
            'peran' => ['prohibited'],
            'nisn' => $target->peran === Peran::Siswa
                ? ['sometimes', 'required', 'string', 'regex:/^\d{10}$/', new IdentitasLoginUnik($id)]
                : ['prohibited'],
            'nip' => $target->peran === Peran::Guru
                ? ['sometimes', 'required', 'string', 'regex:/^\d{18}$/', new IdentitasLoginUnik($id)]
                : ['prohibited'],
            'username' => [
                'sometimes', $target->peran === Peran::Admin ? 'required' : 'nullable',
                'string', 'regex:'.BuatPenggunaRequest::POLA_USERNAME, new IdentitasLoginUnik($id),
            ],
            'email' => ['sometimes', 'nullable', 'string', 'email:rfc', 'max:255', new UnikTanpaHurufBesarKecil('pengguna', 'email', $id, 'id_pengguna')],
            'password' => ['sometimes', 'required', 'string', Password::defaults()],
        ];
    }
}
