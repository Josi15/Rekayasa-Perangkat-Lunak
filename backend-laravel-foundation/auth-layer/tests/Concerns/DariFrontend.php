<?php

namespace Tests\Concerns;

/**
 * Meniru request dari SPA terdaftar (SANCTUM_STATEFUL_DOMAINS=localhost:5173):
 * header Origin/Referer membuat Sanctum menjalankan sesi + CSRF pada request.
 */
trait DariFrontend
{
    protected function dariFrontend(): static
    {
        return $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ]);
    }
}
