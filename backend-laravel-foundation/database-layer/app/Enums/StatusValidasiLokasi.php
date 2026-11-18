<?php

namespace App\Enums;

enum StatusValidasiLokasi: string
{
    case Valid = 'valid';
    case TidakValid = 'tidak_valid';
    case BelumDivalidasi = 'belum_divalidasi';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
