<?php

namespace Tests\Feature;

use App\Enums\Peran;
use App\Models\Pengguna;
use Illuminate\Support\Facades\Hash;
use Tests\DatabaseTestCase;

class BuatAdminTest extends DatabaseTestCase
{
    protected function tearDown(): void
    {
        putenv('ADMIN_PASSWORD');
        parent::tearDown();
    }

    public function test_membuat_admin_dari_env_password_dan_tidak_mencetaknya(): void
    {
        putenv('ADMIN_PASSWORD=KataSandiPanjang123');

        $this->artisan('simba:buat-admin', ['--username' => 'admin.utama', '--email' => 'Admin@Sekolah.id'])
            ->doesntExpectOutputToContain('KataSandiPanjang123')
            ->assertExitCode(0);

        $a = Pengguna::where('username', 'admin.utama')->firstOrFail();
        $this->assertSame(Peran::Admin, $a->peran);
        $this->assertSame('admin@sekolah.id', $a->email);
        $this->assertTrue(Hash::check('KataSandiPanjang123', $a->password));
        $this->assertNotSame('KataSandiPanjang123', $a->password);
    }

    public function test_menolak_bila_admin_sudah_ada_kecuali_tambahan(): void
    {
        Pengguna::factory()->admin()->create();
        putenv('ADMIN_PASSWORD=KataSandiPanjang123');

        $this->artisan('simba:buat-admin', ['--username' => 'admin2', '--email' => 'a2@sekolah.id'])->assertExitCode(1);
        $this->assertDatabaseMissing('pengguna', ['username' => 'admin2']);

        $this->artisan('simba:buat-admin', ['--username' => 'admin2', '--email' => 'a2@sekolah.id', '--tambahan' => true])->assertExitCode(0);
        $this->assertDatabaseHas('pengguna', ['username' => 'admin2', 'peran' => 'admin']);
    }

    public function test_password_pendek_ditolak(): void
    {
        putenv('ADMIN_PASSWORD=pendek');

        $this->artisan('simba:buat-admin', ['--username' => 'admin3', '--email' => 'a3@sekolah.id'])->assertExitCode(1);
        $this->assertDatabaseMissing('pengguna', ['username' => 'admin3']);
    }

    public function test_username_dan_email_wajib(): void
    {
        putenv('ADMIN_PASSWORD=KataSandiPanjang123');

        $this->artisan('simba:buat-admin')->assertExitCode(1);
        $this->assertSame(0, Pengguna::count());
    }
}
