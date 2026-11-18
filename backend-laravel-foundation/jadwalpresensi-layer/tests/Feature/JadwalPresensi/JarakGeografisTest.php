<?php

namespace Tests\Feature\JadwalPresensi;

use App\Support\JarakGeografis;
use PHPUnit\Framework\TestCase;

class JarakGeografisTest extends TestCase
{
    public function test_titik_sama_berjarak_nol(): void
    {
        $this->assertEqualsWithDelta(0.0, JarakGeografis::meter(-6.2, 106.8166, -6.2, 106.8166), 0.001);
    }

    public function test_satu_derajat_lintang_sekitar_111_km(): void
    {
        $this->assertEqualsWithDelta(111195, JarakGeografis::meter(0, 0, 1, 0), 50);
        $this->assertEqualsWithDelta(111195, JarakGeografis::meter(-7, 110, -6, 110), 50);
    }

    public function test_satu_derajat_bujur_mengecil_menjauhi_khatulistiwa(): void
    {
        $this->assertEqualsWithDelta(111195, JarakGeografis::meter(0, 100, 0, 101), 50);
        $this->assertEqualsWithDelta(111195 / 2, JarakGeografis::meter(60, 100, 60, 101), 100);
    }

    public function test_simetris_dan_lintas_bujur_180(): void
    {
        $a = JarakGeografis::meter(-6.2, 106.8, 3.5, 98.6);
        $b = JarakGeografis::meter(3.5, 98.6, -6.2, 106.8);
        $this->assertEqualsWithDelta($a, $b, 0.001);
        $this->assertEqualsWithDelta(111195, JarakGeografis::meter(0, 179.5, 0, -179.5), 50);
    }

    public function test_titik_berlawanan_setengah_keliling_bumi(): void
    {
        $this->assertEqualsWithDelta(20015087, JarakGeografis::meter(0, 0, 0, 180), 100);
        $this->assertEqualsWithDelta(20015087, JarakGeografis::meter(90, 0, -90, 0), 100);
    }

    public function test_jarak_kecil_akurat_dalam_meter(): void
    {
        // 0,00045 derajat lintang ~ 50 m
        $this->assertEqualsWithDelta(50.0, JarakGeografis::meter(-6.2, 106.8, -6.2 + 0.00044966, 106.8), 0.5);
    }
}
