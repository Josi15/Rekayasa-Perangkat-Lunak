<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Menggantikan migration bawaan skeleton Laravel. Tabel "users" dan
 * "password_reset_tokens" sengaja tidak dibuat: ERD LMS Simba memakai tabel
 * "pengguna" dan tidak memiliki kolom email. Hanya "sessions" yang dipertahankan
 * (SESSION_DRIVER=database). Nama file tetap agar menimpa migration bawaan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
