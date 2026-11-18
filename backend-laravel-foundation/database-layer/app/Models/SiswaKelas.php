<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Keanggotaan siswa pada kelas. Primary key komposit (id_siswa, id_kelas).
 */
class SiswaKelas extends Pivot
{
    use HasFactory;

    protected $table = 'siswa_kelas';

    public $incrementing = false;

    public $timestamps = true;

    protected $fillable = ['id_siswa', 'id_kelas'];

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_siswa', 'id_pengguna');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }
}
