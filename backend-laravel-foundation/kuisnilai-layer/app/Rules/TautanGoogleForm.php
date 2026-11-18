<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Tautan Google Forms untuk RESPONDEN. Hanya memeriksa bentuk & host (tanpa permintaan jaringan,
 * jadi tidak ada risiko SSRF dan tidak membuktikan formnya benar-benar ada):
 *  - wajib https, tanpa userinfo (user:pass@), port selain 443, fragment, spasi/karakter kontrol/backslash;
 *  - host persis docs.google.com  -> /forms/[u/N/]d/[e/]{id}/viewform
 *  - host persis forms.gle        -> /{kode}
 * Tautan editor (/edit), hasil (/viewanalytics), host mirip (docs.google.com.evil.test) ditolak.
 */
class TautanGoogleForm implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $this->valid($value)) {
            $fail('Tautan harus berupa tautan responden Google Forms (https://docs.google.com/forms/d/e/{id}/viewform atau https://forms.gle/{kode}).');
        }
    }

    public function valid(mixed $nilai): bool
    {
        if (! is_string($nilai) || $nilai === '' || strlen($nilai) > 2048 || preg_match('/[\x00-\x20\x7f\\\\]/', $nilai)) {
            return false;
        }

        $bagian = parse_url($nilai);

        if ($bagian === false
            || ($bagian['scheme'] ?? '') !== 'https'
            || isset($bagian['user']) || isset($bagian['pass']) || isset($bagian['fragment'])
            || (isset($bagian['port']) && $bagian['port'] !== 443)) {
            return false;
        }

        $host = strtolower($bagian['host'] ?? '');
        $path = $bagian['path'] ?? '';

        return match ($host) {
            'docs.google.com' => (bool) preg_match('#^/forms/(u/\d+/)?d/(e/)?[A-Za-z0-9_-]{10,}/viewform$#', $path),
            'forms.gle' => (bool) preg_match('#^/[A-Za-z0-9]{6,}$#', $path),
            default => false,
        };
    }
}
