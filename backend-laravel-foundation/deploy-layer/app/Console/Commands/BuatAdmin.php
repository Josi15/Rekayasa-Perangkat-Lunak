<?php

namespace App\Console\Commands;

use App\Enums\Peran;
use App\Models\Pengguna;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/**
 * php artisan simba:buat-admin --username=admin --email=admin@sekolah.id
 *
 * Membuat akun admin secara terkontrol (tanpa db:seed demo). Password TIDAK diterima lewat argumen:
 *  - dibaca dari env ADMIN_PASSWORD (hapus variabel itu sesudah dipakai), atau
 *  - ditanyakan interaktif (input tersembunyi, diminta dua kali).
 * Menolak bila sudah ada admin, kecuali --tambahan. Tidak pernah mencetak password.
 */
class BuatAdmin extends Command
{
    protected $signature = 'simba:buat-admin
        {--username= : Username login admin (wajib)}
        {--email= : Email admin (wajib; dipakai untuk reset password)}
        {--tambahan : Izinkan membuat admin tambahan bila sudah ada admin}';

    protected $description = 'Buat akun admin (password dari env ADMIN_PASSWORD atau input tersembunyi; tidak pernah dicetak).';

    public function handle(): int
    {
        if (! $this->option('tambahan') && Pengguna::where('peran', Peran::Admin->value)->exists()) {
            $this->error('Sudah ada akun admin. Gunakan --tambahan bila memang ingin menambah admin lain.');

            return self::FAILURE;
        }

        $password = (string) (getenv('ADMIN_PASSWORD') ?: '');
        if ($password === '') {
            $password = (string) $this->secret('Password admin (min. 12 karakter)');
            if ($password !== (string) $this->secret('Ulangi password')) {
                $this->error('Password tidak sama.');

                return self::FAILURE;
            }
        }

        $v = Validator::make(
            ['username' => $this->option('username'), 'email' => $this->option('email'), 'password' => $password],
            [
                'username' => ['required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9._-]+$/', 'unique:pengguna,username'],
                'email' => ['required', 'email:rfc', 'max:255', 'unique:pengguna,email'],
                'password' => ['required', 'string', 'min:12', 'max:128'],
            ],
        );

        if ($v->fails()) {
            foreach ($v->errors()->all() as $pesan) {
                $this->error($pesan);
            }

            return self::FAILURE;
        }

        $admin = new Pengguna(['username' => $this->option('username'), 'email' => $this->option('email'), 'password' => $password]);
        $admin->peran = Peran::Admin; // "peran" sengaja tidak mass-assignable
        $admin->save();

        $this->info("Admin dibuat: username={$admin->username} (id {$admin->id_pengguna}). Jika memakai ADMIN_PASSWORD, hapus variabel itu sekarang.");

        return self::SUCCESS;
    }
}
