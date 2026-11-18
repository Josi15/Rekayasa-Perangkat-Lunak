<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MataPelajaran extends Model
{
    use HasFactory;

    protected $table = 'mata_pelajaran';

    protected $primaryKey = 'id_mapel';

    protected $fillable = ['nama_mapel', 'id_guru'];

    protected function casts(): array
    {
        return ['diarsipkan_pada' => 'datetime'];
    }

    public function aktif(): bool
    {
        return $this->diarsipkan_pada === null;
    }

    /** @param Builder<MataPelajaran> $query */
    public function scopeAktif(Builder $query): Builder
    {
        return $query->whereNull('diarsipkan_pada');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_guru', 'id_pengguna');
    }

    public function jadwal(): HasMany
    {
        return $this->hasMany(Jadwal::class, 'id_mapel', 'id_mapel');
    }

    public function materi(): HasMany
    {
        return $this->hasMany(Materi::class, 'id_mapel', 'id_mapel');
    }

    public function tugas(): HasMany
    {
        return $this->hasMany(Tugas::class, 'id_mapel', 'id_mapel');
    }

    public function kuis(): HasMany
    {
        return $this->hasMany(Kuis::class, 'id_mapel', 'id_mapel');
    }

    public function pengumuman(): HasMany
    {
        return $this->hasMany(Pengumuman::class, 'id_mapel', 'id_mapel');
    }
}
