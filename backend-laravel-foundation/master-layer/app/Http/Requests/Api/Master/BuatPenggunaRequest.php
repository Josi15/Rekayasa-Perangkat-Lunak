<?php

namespace App\Http\Requests\Api\Master;

use App\Enums\Peran;
use App\Models\Pengguna;
use App\Rules\IdentitasLoginUnik;
use App\Rules\UnikTanpaHurufBesarKecil;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * POST /admin/pengguna. Identitas mengikuti peran: siswa=NISN, guru=NIP, admin=username.
 * Peran hanya ditentukan di sini (admin) dan tidak dapat diubah sesudahnya.
 */
class BuatPenggunaRequest extends FormRequest
{
    public const POLA_USERNAME = '/^[A-Za-z][A-Za-z0-9._-]{2,49}$/';

    public function authorize(): bool
    {
        return $this->user()?->can('create', Pengguna::class) ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'peran' => ['required', 'string', Rule::in(Peran::values())],
            'nisn' => ['required_if:peran,siswa', 'prohibited_unless:peran,siswa', 'nullable', 'string', 'regex:/^\d{10}$/', new IdentitasLoginUnik],
            'nip' => ['required_if:peran,guru', 'prohibited_unless:peran,guru', 'nullable', 'string', 'regex:/^\d{18}$/', new IdentitasLoginUnik],
            'username' => ['required_if:peran,admin', 'nullable', 'string', 'regex:'.self::POLA_USERNAME, new IdentitasLoginUnik],
            'email' => ['nullable', 'string', 'email:rfc', 'max:255', new UnikTanpaHurufBesarKecil('pengguna', 'email', null, 'id_pengguna')],
            'password' => ['required', 'string', Password::defaults()],
        ];
    }
}
