<?php

namespace Tests\Feature\KuisNilai;

use App\Rules\TautanGoogleForm;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class TautanGoogleFormTest extends TestCase
{
    /** @return array<string, array{0: mixed}> */
    public static function valid(): array
    {
        return [
            'viewform' => ['https://docs.google.com/forms/d/e/1FAIpQLSdAbCdEfGhIjKl_mn-123/viewform'],
            'dengan query' => ['https://docs.google.com/forms/d/e/1FAIpQLSdAbCdEfGhIjKl_mn-123/viewform?usp=sf_link'],
            'akun ganda' => ['https://docs.google.com/forms/u/1/d/1AbCdEfGhIjKlMnOp/viewform'],
            'forms.gle' => ['https://forms.gle/AbCdEf123456'],
            'huruf besar host' => ['https://DOCS.GOOGLE.COM/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
        ];
    }

    /** @return array<string, array{0: mixed}> */
    public static function tidakValid(): array
    {
        return [
            'http' => ['http://docs.google.com/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
            'host mirip' => ['https://docs.google.com.evil.test/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
            'subdomain palsu' => ['https://evildocs.google.com/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
            'userinfo' => ['https://docs.google.com@evil.test/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
            'port lain' => ['https://docs.google.com:8443/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
            'tautan editor' => ['https://docs.google.com/forms/d/1AbCdEfGhIjKlMnOp/edit'],
            'bukan form' => ['https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/viewform'],
            'fragment' => ['https://forms.gle/AbCdEf123456#x'],
            'forms.gle pendek' => ['https://forms.gle/ab'],
            'javascript' => ['javascript:alert(1)'],
            'spasi' => ['https://forms.gle/AbCdEf 123456'],
            'backslash' => ['https://docs.google.com\\@evil.test/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
            'kosong' => [''],
            'bukan string' => [12345],
            'array' => [['https://forms.gle/AbCdEf123456']],
            'terlalu panjang' => ['https://forms.gle/'.str_repeat('a', 2100)],
            'host lain' => ['https://example.com/forms/d/e/1FAIpQLSdAbCdEfGh/viewform'],
        ];
    }

    #[DataProvider('valid')]
    public function test_tautan_valid(mixed $url): void
    {
        $this->assertTrue((new TautanGoogleForm)->valid($url));
    }

    #[DataProvider('tidakValid')]
    public function test_tautan_tidak_valid(mixed $url): void
    {
        $this->assertFalse((new TautanGoogleForm)->valid($url));
    }
}
