<?php

namespace App\Models;

use App\Enums\StatusKehadiran;
use App\Enums\StatusValidasiLokasi;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Presensi extends Model
{
    use HasFactory;

    protected $table = 'presensi';

    protected $primaryKey = 'id_presensi';

    /**
     * status_validasi_lokasi tidak mass-assignable: hasilnya ditentukan server
     * (validasi lokasi), bukan input klien.
     */
    protected $fillable = [
        'id_siswa', 'id_jadwal', 'waktu_checkin', 'status_kehadiran', 'lokasi_lat', 'lokasi_lng',
    ];

    protected function casts(): array
    {
        return [
            'waktu_checkin' => 'datetime',
            'status_kehadiran' => StatusKehadiran::class,
            'lokasi_lat' => 'decimal:7',
            'lokasi_lng' => 'decimal:7',
            'status_validasi_lokasi' => StatusValidasiLokasi::class,
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_siswa', 'id_pengguna');
    }

    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal', 'id_jadwal');
    }
}
