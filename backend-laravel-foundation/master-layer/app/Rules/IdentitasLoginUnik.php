<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Login boleh berupa username, NISN, atau NIP. Agar login tidak ambigu, sebuah nilai tidak boleh
 * dipakai pada KOLOM IDENTITAS MANA PUN milik akun lain (mis. username seseorang = NISN orang lain).
 * Keunikan per kolom tetap dijaga oleh unique constraint database.
 */
class IdentitasLoginUnik implements ValidationRule
{
    public function __construct(private readonly ?int $abaikanId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $dipakai = DB::table('pengguna')
            ->where(fn ($q) => $q->where('username', $value)->orWhere('nisn', $value)->orWhere('nip', $value))
            ->when($this->abaikanId !== null, fn ($q) => $q->where('id_pengguna', '<>', $this->abaikanId))
            ->exists();

        if ($dipakai) {
            $fail('Nilai :attribute sudah dipakai sebagai identitas login akun lain.');
        }
    }
}
