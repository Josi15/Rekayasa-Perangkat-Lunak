<?php

namespace Tests;

use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Dasar test yang menyentuh database. RefreshDatabase menjalankan migrate:fresh,
 * sehingga HANYA boleh dipakai pada database khusus test (nama berakhiran "_test").
 */
abstract class DatabaseTestCase extends TestCase
{
    use RefreshDatabase;

    protected function beforeRefreshingDatabase(): void
    {
        $koneksi = DB::connection();
        $nama = (string) $koneksi->getDatabaseName();

        if ($koneksi->getDriverName() !== 'pgsql' || ! str_ends_with($nama, '_test')) {
            throw new RuntimeException(
                "Test database ditolak: koneksi '{$koneksi->getDriverName()}' / database '{$nama}'. ".
                'Gunakan PostgreSQL dengan nama database berakhiran "_test" (mis. lms_simba_test).'
            );
        }
    }

    /**
     * Pastikan database menolak operasi. Dibungkus transaksi bersarang (SAVEPOINT)
     * supaya transaksi test PostgreSQL tidak "aborted" setelah error constraint.
     */
    protected function assertDatabaseRejects(Closure $operasi, string $pesan = 'Database seharusnya menolak operasi ini.'): void
    {
        try {
            DB::transaction($operasi);
        } catch (QueryException) {
            $this->addToAssertionCount(1);

            return;
        }

        $this->fail($pesan);
    }
}
