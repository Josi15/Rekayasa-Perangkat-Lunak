<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Validation\ValidationException;

/**
 * Nilai berasal dari TEPAT SATU sumber: pengumpulan tugas ATAU kuis.
 * Aturan ditegakkan di dua lapis: model (pesan jelas, HTTP 422 lewat
 * ApiExceptionRenderer) dan database (CHECK + FK komposit sebagai jaring pengaman).
 */
class Nilai extends Model
{
    use HasFactory;

    protected $table = 'nilai';

    protected $primaryKey = 'id_nilai';

    protected $fillable = ['id_siswa', 'id_pengumpulan', 'id_kuis', 'nilai', 'umpan_balik'];

    protected function casts(): array
    {
        return ['nilai' => 'decimal:2'];
    }

    protected static function booted(): void
    {
        static::saving(function (Nilai $nilai): void {
            $nilai->pastikanSumberValid();
        });
    }

    /**
     * @throws ValidationException
     */
    public function pastikanSumberValid(): void
    {
        $punyaPengumpulan = $this->id_pengumpulan !== null;
        $punyaKuis = $this->id_kuis !== null;

        if (! $punyaPengumpulan && ! $punyaKuis) {
            throw ValidationException::withMessages([
                'id_pengumpulan' => 'Sumber nilai wajib diisi: pilih id_pengumpulan atau id_kuis.',
            ]);
        }

        if ($punyaPengumpulan && $punyaKuis) {
            throw ValidationException::withMessages([
                'id_kuis' => 'Nilai hanya boleh berasal dari satu sumber: id_pengumpulan atau id_kuis, bukan keduanya.',
            ]);
        }

        if ($punyaPengumpulan) {
            $pemilik = PengumpulanTugas::query()
                ->whereKey($this->id_pengumpulan)
                ->value('id_siswa');

            if ($pemilik !== null && (int) $pemilik !== (int) $this->id_siswa) {
                throw ValidationException::withMessages([
                    'id_siswa' => 'Siswa pada nilai harus sama dengan siswa pemilik pengumpulan tugas.',
                ]);
            }
        }
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_siswa', 'id_pengguna');
    }

    public function pengumpulanTugas(): BelongsTo
    {
        return $this->belongsTo(PengumpulanTugas::class, 'id_pengumpulan', 'id_pengumpulan');
    }

    public function kuis(): BelongsTo
    {
        return $this->belongsTo(Kuis::class, 'id_kuis', 'id_kuis');
    }
}
