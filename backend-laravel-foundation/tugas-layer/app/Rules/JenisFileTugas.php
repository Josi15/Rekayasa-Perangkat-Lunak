<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/** Tipe file dari ISI file (deteksi MIME server) terhadap daftar putih config/tugas.php. */
class JenisFileTugas implements ValidationRule
{
    /**
     * @param  string  $kunciMaks  'maks_kb_lampiran' | 'maks_kb_jawaban'
     * @return array<int, mixed>
     */
    public static function aturan(string $kunciMaks, bool $wajib): array
    {
        return array_merge(
            ['bail', $wajib ? 'required' : 'nullable'],
            ['file', 'max:'.(int) config('tugas.'.$kunciMaks), new self],
        );
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $jenis = (array) config('tugas.jenis');
        $mime = $value instanceof UploadedFile ? $value->getMimeType() : null;

        if (! is_string($mime) || ! array_key_exists($mime, $jenis)) {
            $fail('Jenis file tidak diizinkan. Yang diizinkan: '.implode(', ', array_unique(array_values($jenis))).'.');
        }
    }
}
