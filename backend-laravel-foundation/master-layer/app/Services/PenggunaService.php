<?php

namespace App\Services;

use App\Enums\Peran;
use App\Exceptions\KonflikBisnisException;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Pengguna;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PenggunaService
{
    public function __construct(private readonly SesiPengguna $sesi) {}

    /**
     * @param  array{peran: string, nisn?: ?string, nip?: ?string, username?: ?string, email?: ?string, password: string}  $data
     */
    public function buat(array $data): Pengguna
    {
        $pengguna = new Pengguna(Arr::only($data, ['nisn', 'nip', 'username', 'email', 'password']));
        $pengguna->peran = Peran::from($data['peran']); // peran tidak mass-assignable; diset eksplisit
        $pengguna->save();

        return $pengguna->refresh();
    }

    /**
     * Perubahan oleh admin. Mengganti password mencabut seluruh sesi pengguna tersebut.
     *
     * @param  array<string, mixed>  $data
     */
    public function ubah(Pengguna $pengguna, array $data): Pengguna
    {
        return DB::transaction(function () use ($pengguna, $data): Pengguna {
            foreach (['nisn', 'nip', 'username', 'email'] as $kolom) {
                if (array_key_exists($kolom, $data)) {
                    $pengguna->{$kolom} = $data[$kolom];
                }
            }

            $passwordBerubah = array_key_exists('password', $data);

            if ($passwordBerubah) {
                $pengguna->password = $data['password']; // di-hash oleh cast "hashed"
                $pengguna->remember_token = Str::random(60);
            }

            $pengguna->save();

            if ($passwordBerubah) {
                $this->sesi->cabutSemua($pengguna);
            }

            return $pengguna->refresh();
        });
    }

    /**
     * Pengguna mengubah akunnya sendiri (email/password). Ganti password mencabut sesi LAIN
     * (sesi yang sedang dipakai dipertahankan).
     *
     * @param  array<string, mixed>  $data
     */
    public function ubahProfil(Pengguna $pengguna, array $data, ?string $sesiSaatIni = null): Pengguna
    {
        return DB::transaction(function () use ($pengguna, $data, $sesiSaatIni): Pengguna {
            if (array_key_exists('email', $data)) {
                $pengguna->email = $data['email'];
            }

            $passwordBerubah = ! empty($data['password']);

            if ($passwordBerubah) {
                $pengguna->password = $data['password'];
                $pengguna->remember_token = Str::random(60);
            }

            $pengguna->save();

            if ($passwordBerubah) {
                $this->sesi->cabutSemua($pengguna, $sesiSaatIni);
            }

            return $pengguna->refresh();
        });
    }

    /**
     * Menonaktifkan akun (idempotent). Aturan:
     *  - guru tidak boleh dinonaktifkan selama masih wali kelas aktif, pengampu mata pelajaran aktif,
     *    atau memiliki jadwal mendatang (pindahkan tugasnya dulu) -> 409;
     *  - seluruh sesi akun dicabut dan akun tidak dapat login lagi.
     */
    public function nonaktifkan(Pengguna $pengguna): Pengguna
    {
        return DB::transaction(function () use ($pengguna): Pengguna {
            $pengguna = Pengguna::query()->lockForUpdate()->findOrFail($pengguna->getKey());

            if (! $pengguna->aktif()) {
                return $pengguna;
            }

            if ($pengguna->peran === Peran::Guru) {
                $id = $pengguna->getKey();

                if (Kelas::query()->aktif()->where('id_wali', $id)->exists()) {
                    throw new KonflikBisnisException('Guru masih menjadi wali kelas aktif. Ganti wali kelas terlebih dahulu.', 'teacher_is_active_homeroom');
                }
                if (MataPelajaran::query()->aktif()->where('id_guru', $id)->exists()) {
                    throw new KonflikBisnisException('Guru masih mengampu mata pelajaran aktif. Ganti guru pengampu terlebih dahulu.', 'teacher_has_active_subjects');
                }
                if (Jadwal::query()->where('id_guru', $id)->where('waktu_mulai', '>', now())->exists()) {
                    throw new KonflikBisnisException('Guru masih memiliki jadwal mendatang.', 'teacher_has_upcoming_schedule');
                }
            }

            $pengguna->forceFill(['nonaktif_pada' => now(), 'remember_token' => Str::random(60)])->save();
            $this->sesi->cabutSemua($pengguna);

            return $pengguna;
        });
    }

    public function aktifkan(Pengguna $pengguna): Pengguna
    {
        if (! $pengguna->aktif()) {
            $pengguna->forceFill(['nonaktif_pada' => null])->save();
        }

        return $pengguna;
    }
}
