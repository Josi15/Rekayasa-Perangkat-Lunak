<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kelas extends Model
{
    use HasFactory;

    protected $table = 'kelas';

    protected $primaryKey = 'id_kelas';

    protected $fillable = ['nama_kelas', 'id_wali'];

    protected function casts(): array
    {
        return ['diarsipkan_pada' => 'datetime'];
    }

    public function aktif(): bool
    {
        return $this->diarsipkan_pada === null;
    }

    /** @param Builder<Kelas> $query */
    public function scopeAktif(Builder $query): Builder
    {
        return $query->whereNull('diarsipkan_pada');
    }

    public function wali(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_wali', 'id_pengguna');
    }

    public function siswa(): BelongsToMany
    {
        return $this->belongsToMany(Pengguna::class, 'siswa_kelas', 'id_kelas', 'id_siswa')
            ->using(SiswaKelas::class)
            ->withTimestamps();
    }

    public function jadwal(): HasMany
    {
        return $this->hasMany(Jadwal::class, 'id_kelas', 'id_kelas');
    }
}
