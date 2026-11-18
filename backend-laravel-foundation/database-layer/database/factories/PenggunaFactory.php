<?php

namespace Database\Factories;

use App\Enums\Peran;
use App\Models\Pengguna;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<Pengguna>
 */
class PenggunaFactory extends Factory
{
    protected $model = Pengguna::class;

    protected static ?string $hash = null;

    /** Default: siswa (login memakai NISN). */
    public function definition(): array
    {
        return [
            'nisn' => fake()->unique()->numerify('##########'),
            'nip' => null,
            'username' => null,
            'email' => null, // siswa boleh tanpa email
            // Hash acak yang tidak diketahui siapa pun; gunakan withPassword()/withHash() bila perlu login.
            'password' => static::$hash ??= Hash::make(Str::random(32)),
            'peran' => Peran::Siswa,
        ];
    }

    public function guru(): static
    {
        return $this->state(fn () => [
            'nisn' => null,
            'nip' => fake()->unique()->numerify('##################'),
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'peran' => Peran::Guru,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'nisn' => null,
            'nip' => null,
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'peran' => Peran::Admin,
        ]);
    }

    public function nonaktif(): static
    {
        return $this->state(fn () => ['nonaktif_pada' => now()]);
    }

    public function denganEmail(?string $email = null): static
    {
        return $this->state(fn () => ['email' => $email ?? fake()->unique()->safeEmail()]);
    }

    public function withPassword(string $plain): static
    {
        return $this->state(fn () => ['password' => $plain]); // di-hash oleh cast 'hashed'
    }

    /** Pakai hash yang sudah dihitung (efisien untuk banyak akun). */
    public function withHash(string $hash): static
    {
        return $this->state(fn () => ['password' => $hash]);
    }
}
