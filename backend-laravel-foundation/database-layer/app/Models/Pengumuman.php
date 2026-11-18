<?php

namespace App\Models;

use App\Enums\CakupanPengumuman;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pengumuman extends Model
{
    use HasFactory;

    protected $table = 'pengumuman';

    protected $primaryKey = 'id_pengumuman';

    protected $fillable = ['judul', 'isi', 'cakupan', 'id_penulis', 'id_mapel'];

    protected function casts(): array
    {
        return ['cakupan' => CakupanPengumuman::class];
    }

    public function penulis(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_penulis', 'id_pengguna');
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }
}
