<?php

namespace App\Enums;

enum CakupanPengumuman: string
{
    case Umum = 'global';
    case Mapel = 'mapel';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
