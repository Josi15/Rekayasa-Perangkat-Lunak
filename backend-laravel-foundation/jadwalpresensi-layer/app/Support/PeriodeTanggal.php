<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Mengubah tanggal kalender (Y-m-d) menjadi batas waktu pada zona waktu sekolah (config presensi.zona_waktu).
 * Rentang bersifat [awal, akhir) sehingga "sampai" ikut seluruh harinya.
 */
final class PeriodeTanggal
{
    /** @return array{0: ?CarbonImmutable, 1: ?CarbonImmutable} [awal, akhir-eksklusif] */
    public static function batas(?string $dari, ?string $sampai): array
    {
        $zona = (string) config('presensi.zona_waktu', 'UTC');

        return [
            $dari !== null ? CarbonImmutable::createFromFormat('!Y-m-d', $dari, $zona) : null,
            $sampai !== null ? CarbonImmutable::createFromFormat('!Y-m-d', $sampai, $zona)->addDay() : null,
        ];
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable} satu hari penuh */
    public static function hari(string $tanggal): array
    {
        [$awal] = self::batas($tanggal, null);

        return [$awal, $awal->addDay()];
    }
}
