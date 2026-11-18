<?php

namespace App\Http\Requests\Api\Master;

use App\Rules\UnikTanpaHurufBesarKecil;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * PATCH /profil — pengguna mengubah AKUN SENDIRI: hanya email dan password.
 * Identitas (username/NISN/NIP) dan peran hanya dapat diubah admin. Mengubah email atau password
 * mewajibkan password saat ini, agar sesi yang dibajak tidak dapat mengambil alih akun.
 */
class UbahProfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('updateProfil', $user);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $id = $this->user()?->getKey();

        return [
            'peran' => ['prohibited'],
            'nisn' => ['prohibited'],
            'nip' => ['prohibited'],
            'username' => ['prohibited'],
            'email' => ['sometimes', 'nullable', 'string', 'email:rfc', 'max:255', new UnikTanpaHurufBesarKecil('pengguna', 'email', $id, 'id_pengguna')],
            'password' => ['sometimes', 'required', 'string', 'confirmed', Password::defaults()],
            'password_saat_ini' => ['required_with:password,email', 'string', 'current_password:web'],
        ];
    }
}
