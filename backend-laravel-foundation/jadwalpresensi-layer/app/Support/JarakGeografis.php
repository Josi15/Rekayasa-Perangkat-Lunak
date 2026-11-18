<?php

namespace App\Support;

/** Jarak permukaan bumi (lingkaran besar) antara dua koordinat, rumus haversine, hasil dalam meter. */
final class JarakGeografis
{
    private const RADIUS_BUMI_METER = 6371008.8;

    public static function meter(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $p1 = deg2rad($lat1);
        $p2 = deg2rad($lat2);
        $dp = $p2 - $p1;
        $dl = deg2rad($lng2 - $lng1);

        $a = sin($dp / 2) ** 2 + cos($p1) * cos($p2) * sin($dl / 2) ** 2;

        return 2 * self::RADIUS_BUMI_METER * asin(min(1.0, sqrt($a)));
    }
}
