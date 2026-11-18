<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Tabel token Sanctum dengan NAMA MIGRATION TETAP.
 * Migration bawaan hasil `vendor:publish` memakai timestamp saat publish; bila publish terjadi di setiap build
 * (mis. Docker/Railway) namanya berbeda tiap build sehingga `migrate` mencoba membuat tabel yang sama lagi
 * ("relation personal_access_tokens already exists"). apply.sh menghapus salinan hasil publish; file ini penggantinya.
 * Idempoten: tidak membuat ulang bila tabel sudah ada.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('personal_access_tokens')) {
            return;
        }

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
