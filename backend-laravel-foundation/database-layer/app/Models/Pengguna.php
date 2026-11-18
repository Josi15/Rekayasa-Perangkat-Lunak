<?php

namespace App\Models;

use App\Enums\Peran;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Pengguna LMS (siswa, guru, admin). Dipakai sebagai model autentikasi Laravel
 * lewat AUTH_MODEL=App\Models\Pengguna.
 */
class Pengguna extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'pengguna';

    protected $primaryKey = 'id_pengguna';

    /**
     * "peran" sengaja TIDAK mass-assignable agar input pengguna tidak bisa
     * menaikkan hak akses (mis. peran=admin). Set eksplisit: $p->peran = Peran::Guru.
     */
    protected $fillable = ['nisn', 'nip', 'username', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed', // di-hash otomatis saat di-set
            'peran' => Peran::class,
            'nonaktif_pada' => 'datetime',
        ];
    }

    public function aktif(): bool
    {
        return $this->nonaktif_pada === null;
    }

    /** @param Builder<Pengguna> $query */
    public function scopeAktif(Builder $query): Builder
    {
        return $query->whereNull('nonaktif_pada');
    }

    /** @param Builder<Pengguna> $query */
    public function scopeNonaktif(Builder $query): Builder
    {
        return $query->whereNotNull('nonaktif_pada');
    }

    /** Email disimpan huruf kecil & tanpa spasi; string kosong menjadi NULL. */
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (?string $nilai) => ($nilai === null || trim($nilai) === '') ? null : mb_strtolower(trim($nilai)),
        );
    }

    /** Dikirim lewat antrean (tidak menahan respons) dengan tautan ke frontend SPA. */
    public function sendPasswordResetNotification($token): void
    {
        if (! $this->aktif()) {
            return; // akun nonaktif tidak menerima tautan reset (respons API tetap generik)
        }

        $this->notify(new ResetPasswordNotification($token));
    }

    public function punyaPeran(Peran $peran): bool
    {
        return $this->peran === $peran;
    }

    public function kelasWali(): HasMany
    {
        return $this->hasMany(Kelas::class, 'id_wali', 'id_pengguna');
    }

    /** Kelas yang diikuti sebagai siswa. */
    public function kelas(): BelongsToMany
    {
        return $this->belongsToMany(Kelas::class, 'siswa_kelas', 'id_siswa', 'id_kelas')
            ->using(SiswaKelas::class)
            ->withTimestamps();
    }

    public function mataPelajaran(): HasMany
    {
        return $this->hasMany(MataPelajaran::class, 'id_guru', 'id_pengguna');
    }

    public function jadwalMengajar(): HasMany
    {
        return $this->hasMany(Jadwal::class, 'id_guru', 'id_pengguna');
    }

    public function presensi(): HasMany
    {
        return $this->hasMany(Presensi::class, 'id_siswa', 'id_pengguna');
    }

    public function pengumpulanTugas(): HasMany
    {
        return $this->hasMany(PengumpulanTugas::class, 'id_siswa', 'id_pengguna');
    }

    public function nilai(): HasMany
    {
        return $this->hasMany(Nilai::class, 'id_siswa', 'id_pengguna');
    }

    public function pengumuman(): HasMany
    {
        return $this->hasMany(Pengumuman::class, 'id_penulis', 'id_pengguna');
    }
}
