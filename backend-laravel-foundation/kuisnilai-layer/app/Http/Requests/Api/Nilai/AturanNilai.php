<?php

namespace App\Http\Requests\Api\Nilai;

/** Aturan bersama: skala 0–100, maksimal 2 desimal (selaras CHECK & decimal(5,2) di database). */
final class AturanNilai
{
    public const MIN = 0;

    public const MAKS = 100;

    /** @return array<int, string> */
    public static function nilai(bool $wajib = true): array
    {
        return [$wajib ? 'required' : 'sometimes', 'bail', 'numeric', 'decimal:0,2', 'between:'.self::MIN.','.self::MAKS];
    }

    /** @return array<int, string> */
    public static function umpanBalik(): array
    {
        return ['sometimes', 'nullable', 'string', 'max:5000', 'regex:/^[^\x00]*$/u'];
    }
}
