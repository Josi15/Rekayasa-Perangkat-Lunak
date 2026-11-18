<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Tipe file dari ISI file (deteksi MIME server) terhadap daftar putih di config/tugas.php.
 * Nama & ekstensi dari pengguna diabaikan sepenuhnya.
 */
class JenisBerkas implements ValidationRule
{
    public function __construct(private readonly string $kunciJenis) {}

    /**
     * @param  string  $kunciJenis  mis. 'jenis_jawaban'
     * @param  string  $kunciUkuran  mis. 'maks_kb_jawaban'
     * @return array<int, mixed>
     */
    public static function aturan(string $kunciJenis, string $kunciUkuran): array
    {
        return ['bail', 'required', 'file', 'max:'.(int) config('tugas.'.$kunciUkuran), new self($kunciJenis)];
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $jenis = (array) config('tugas.'.$this->kunciJenis);
        $mime = $value instanceof UploadedFile ? $value->getMimeType() : null;

        if (! is_string($mime) || ! array_key_exists($mime, $jenis)) {
            $fail('Jenis file tidak diizinkan. Yang diizinkan: '.implode(', ', array_unique(array_values($jenis))).'.');
        }
    }
}
