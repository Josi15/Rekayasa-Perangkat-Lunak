<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kuis extends Model
{
    use HasFactory;

    protected $table = 'kuis';

    protected $primaryKey = 'id_kuis';

    protected $fillable = ['judul', 'tautan_google_form', 'id_mapel'];

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mapel', 'id_mapel');
    }

    public function nilai(): HasMany
    {
        return $this->hasMany(Nilai::class, 'id_kuis', 'id_kuis');
    }
}
