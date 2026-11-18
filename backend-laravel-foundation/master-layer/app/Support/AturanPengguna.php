<?php

namespace App\Support;

use App\Enums\Peran;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/** Aturan validasi "id menunjuk pengguna aktif dengan peran tertentu" (FK + peran + status). */
final class AturanPengguna
{
    public static function aktifSebagai(Peran $peran): Exists
    {
        return Rule::exists('pengguna', 'id_pengguna')->where(
            fn ($q) => $q->where('peran', $peran->value)->whereNull('nonaktif_pada')
        );
    }
}
