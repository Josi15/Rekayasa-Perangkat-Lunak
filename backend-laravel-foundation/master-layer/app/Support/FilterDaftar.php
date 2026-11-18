<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * Pencarian, filter status, dan pengurutan yang aman untuk endpoint daftar.
 * Nama kolom HANYA berasal dari kode (whitelist), tidak pernah dari input klien.
 */
final class FilterDaftar
{
    /**
     * Pencarian ILIKE pada beberapa kolom. Karakter khusus LIKE (\ % _) di-escape sehingga
     * "50%" mencari teks "50%" apa adanya, bukan semua baris.
     *
     * @param  Builder<*>|Relation<*, *, *>  $query
     * @param  list<string>  $kolom
     */
    public static function cari(Builder|Relation $query, ?string $kata, array $kolom): void
    {
        if ($kata === null || $kata === '') {
            return;
        }

        $pola = '%'.addcslashes($kata, '\\%_').'%';

        $query->where(function ($w) use ($kolom, $pola): void {
            foreach ($kolom as $k) {
                $w->orWhereRaw("CAST({$k} AS TEXT) ILIKE ?", [$pola]);
            }
        });
    }

    /**
     * status: "aktif" (kolom NULL), "semua" (tanpa filter), selain itu = nonaktif/arsip (kolom terisi).
     *
     * @param  Builder<*>|Relation<*, *, *>  $query
     */
    public static function status(Builder|Relation $query, string $status, string $kolomPenanda): void
    {
        match ($status) {
            'aktif' => $query->whereNull($kolomPenanda),
            'semua' => null,
            default => $query->whereNotNull($kolomPenanda),
        };
    }

    /**
     * @param  Builder<*>|Relation<*, *, *>  $query
     */
    public static function urut(Builder|Relation $query, string $kolom, string $arah, string $kolomKunci): void
    {
        $query->orderBy($kolom, $arah === 'desc' ? 'desc' : 'asc');

        if ($kolom !== $kolomKunci) {
            $query->orderBy($kolomKunci); // urutan deterministik untuk pagination
        }
    }
}
