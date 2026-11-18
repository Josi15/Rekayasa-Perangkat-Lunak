<?php

namespace App\Services;

use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;

/** Pencabutan sesi login pengguna (hanya bila sesi disimpan di database). */
class SesiPengguna
{
    public function cabutSemua(Pengguna $pengguna, ?string $kecualiSesiId = null): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::connection(config('session.connection'))
            ->table((string) config('session.table', 'sessions'))
            ->where('user_id', $pengguna->getAuthIdentifier())
            ->when($kecualiSesiId !== null, fn ($q) => $q->where('id', '<>', $kecualiSesiId))
            ->delete();
    }
}
