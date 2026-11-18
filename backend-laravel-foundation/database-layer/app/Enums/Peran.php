<?php

namespace App\Enums;

enum Peran: string
{
    case Siswa = 'siswa';
    case Guru = 'guru';
    case Admin = 'admin';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
