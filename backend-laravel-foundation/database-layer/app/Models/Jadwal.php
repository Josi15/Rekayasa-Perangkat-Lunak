<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Jadwal extends Model
{
    use HasFactory;

    protected $table = 'jadwal';

    protected $primaryKey = 'id_jadwal';

    protected $fillable = ['id_mapel', 'id_kelas', 'id_guru', 'waktu_mulai', 'waktu_selesai'];

    protected function casts(): array
    {
        return [
            'waktu_mulai' => 'datetime',
            'waktu_selesai' => 'datetime',
        ];
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_guru', 'id_pengguna');
    }

    public function presensi(): HasMany
    {
        return $this->hasMany(Presensi::class, 'id_jadwal', 'id_jadwal');
    }
}
