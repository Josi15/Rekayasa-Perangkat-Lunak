<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Tipe file diperiksa dari ISI file (deteksi MIME di server) terhadap daftar putih config/materi.php.
 * Nama & ekstensi dari pengguna diabaikan sepenuhnya.
 */
class JenisFileMateri implements ValidationRule
{
    /** @return array<int, mixed> */
    public static function aturan(): array
    {
        return ['bail', 'required', 'file', 'max:'.(int) config('materi.maks_kb'), new self];
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $jenis = (array) config('materi.jenis');
        $mime = $value instanceof UploadedFile ? $value->getMimeType() : null;

        if (! is_string($mime) || ! array_key_exists($mime, $jenis)) {
            $fail('Jenis file tidak diizinkan. Yang diizinkan: '.implode(', ', array_unique(array_values($jenis))).'.');
        }
    }
}
