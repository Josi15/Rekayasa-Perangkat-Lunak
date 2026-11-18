<?php

namespace App\Models;

use App\Enums\StatusPengumpulan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PengumpulanTugas extends Model
{
    use HasFactory;

    protected $table = 'pengumpulan_tugas';

    protected $primaryKey = 'id_pengumpulan';

    /** status & waktu_kumpul ditentukan server, bukan input klien. */
    protected $fillable = ['id_siswa', 'id_tugas', 'jawaban_file'];

    protected function casts(): array
    {
        return [
            'status' => StatusPengumpulan::class,
            'waktu_kumpul' => 'datetime',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_siswa', 'id_pengguna');
    }

    public function tugas(): BelongsTo
    {
        return $this->belongsTo(Tugas::class, 'id_tugas', 'id_tugas');
    }

    public function nilai(): HasOne
    {
        return $this->hasOne(Nilai::class, 'id_pengumpulan', 'id_pengumpulan');
    }
}
