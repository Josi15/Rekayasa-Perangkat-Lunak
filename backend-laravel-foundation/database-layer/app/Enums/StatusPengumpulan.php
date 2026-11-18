<?php

namespace App\Enums;

enum StatusPengumpulan: string
{
    case Dikumpulkan = 'dikumpulkan';
    case Terlambat = 'terlambat';
    case Dinilai = 'dinilai';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
