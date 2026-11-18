<?php

namespace Tests\Feature\Auth;

use App\Providers\AuthServiceProvider;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

/**
 * Pengaman "gagal tertutup": produksi menolak konfigurasi sesi yang lemah.
 * Tidak menyentuh database.
 */
class KonfigurasiSesiProduksiTest extends TestCase
{
    /** @var array<string, mixed> */
    private const AMAN = [
        'session.secure' => true,
        'session.http_only' => true,
        'session.same_site' => 'lax',
        'session.encrypt' => true,
        'app.debug' => false,
    ];

    private function periksa(string $environment, array $konfigurasi): void
    {
        $this->app['env'] = $environment;
        config($konfigurasi);

        (new AuthServiceProvider($this->app))->pastikanSesiAmanDiProduksi();
    }

    public function test_konfigurasi_aman_di_produksi_diterima(): void
    {
        $this->periksa('production', self::AMAN);

        $this->addToAssertionCount(1); // tidak melempar exception
    }

    /** @return array<string, array{0: array<string, mixed>}> */
    public static function konfigurasiLemah(): array
    {
        return [
            'cookie tidak secure' => [['session.secure' => false]],
            'secure tidak diatur' => [['session.secure' => null]],
            'bukan httponly' => [['session.http_only' => false]],
            'samesite none' => [['session.same_site' => 'none']],
            'samesite kosong' => [['session.same_site' => null]],
            'sesi tidak terenkripsi' => [['session.encrypt' => false]],
            'debug menyala' => [['app.debug' => true]],
        ];
    }

    /** @param array<string, mixed> $lemah */
    #[DataProvider('konfigurasiLemah')]
    public function test_konfigurasi_lemah_di_produksi_ditolak(array $lemah): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Konfigurasi sesi produksi tidak aman');

        $this->periksa('production', array_merge(self::AMAN, $lemah));
    }

    public function test_environment_lokal_tidak_dibatasi(): void
    {
        $this->periksa('local', ['session.secure' => false, 'session.http_only' => true, 'session.same_site' => 'lax', 'session.encrypt' => false, 'app.debug' => true]);

        $this->addToAssertionCount(1);
    }
}
