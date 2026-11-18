<?php

namespace App\Services;

use App\Models\Pengguna;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Verifikasi kredensial. Identitas login ("login") boleh berupa username, NISN, atau NIP.
 */
class AuthService
{
    private static ?string $hashPalsu = null;

    /**
     * Mengembalikan pengguna bila kredensial benar, selain itu null.
     *
     * - Bila "login" cocok dengan lebih dari satu akun (mis. username seseorang sama dengan
     *   NISN orang lain), login DITOLAK: lebih aman daripada menebak akun yang dimaksud.
     * - Pengecekan hash selalu dijalankan (memakai hash palsu bila akun tidak ada) agar waktu
     *   respons tidak membedakan "akun tidak ada" dan "password salah".
     */
    public function verifikasi(string $login, string $password): ?Pengguna
    {
        $pengguna = $this->cariBerdasarkanLogin($login);

        $hash = $pengguna?->getAuthPassword() ?? (self::$hashPalsu ??= Hash::make(Str::random(40)));
        $cocok = Hash::check($password, $hash);

        if ($pengguna === null || ! $cocok) {
            return null;
        }

        if (Hash::needsRehash($hash)) {
            $pengguna->forceFill(['password' => $password])->save(); // cast "hashed" menghitung ulang
        }

        return $pengguna;
    }

    public function cariBerdasarkanLogin(string $login): ?Pengguna
    {
        $kandidat = Pengguna::query()
            ->whereNull('nonaktif_pada') // akun nonaktif tidak dapat login
            ->where(function ($q) use ($login): void {
                $q->where('username', $login)->orWhere('nisn', $login)->orWhere('nip', $login);
            })
            ->limit(2)
            ->get();

        return $kandidat->count() === 1 ? $kandidat->first() : null;
    }
}
