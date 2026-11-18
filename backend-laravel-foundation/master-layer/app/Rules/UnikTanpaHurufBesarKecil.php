<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/** Keunikan tanpa membedakan huruf besar/kecil (lower(kolom) = lower(nilai)), mengabaikan satu baris. */
class UnikTanpaHurufBesarKecil implements ValidationRule
{
    public function __construct(
        private readonly string $tabel,
        private readonly string $kolom,
        private readonly mixed $abaikanId = null,
        private readonly string $kolomKunci = 'id',
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $ada = DB::table($this->tabel)
            ->whereRaw("lower({$this->kolom}) = ?", [mb_strtolower((string) $value)])
            ->when($this->abaikanId !== null, fn ($q) => $q->where($this->kolomKunci, '<>', $this->abaikanId))
            ->exists();

        if ($ada) {
            $fail(':attribute sudah digunakan.');
        }
    }
}
