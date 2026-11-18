<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tugas extends Model
{
    use HasFactory;

    protected $table = 'tugas';

    protected $primaryKey = 'id_tugas';

    protected $fillable = ['judul', 'instruksi', 'batas_waktu', 'lampiran', 'id_mapel'];

    protected function casts(): array
    {
        return ['batas_waktu' => 'datetime'];
    }

    /** Batas akhir efektif = tenggat + toleransi (config tugas.toleransi_terlambat_jam; bawaan 0 = tegas). */
    public function batasAkhir(): CarbonInterface
    {
        return $this->batas_waktu->copy()->addHours((int) config('tugas.toleransi_terlambat_jam', 0));
    }

    public function menerimaPengumpulan(?CarbonInterface $saat = null): bool
    {
        return ($saat ?? now())->lessThanOrEqualTo($this->batasAkhir());
    }

    /** @param Builder<Tugas> $query @return Builder<Tugas> */
    public function scopeTerbuka(Builder $query): Builder
    {
        return $query->where('batas_waktu', '>=', now()->subHours((int) config('tugas.toleransi_terlambat_jam', 0)));
    }

    /** @param Builder<Tugas> $query @return Builder<Tugas> */
    public function scopeTertutup(Builder $query): Builder
    {
        return $query->where('batas_waktu', '<', now()->subHours((int) config('tugas.toleransi_terlambat_jam', 0)));
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function pengumpulan(): HasMany
    {
        return $this->hasMany(PengumpulanTugas::class, 'id_tugas', 'id_tugas');
    }
}
