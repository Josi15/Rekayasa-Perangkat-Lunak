<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengguna', function (Blueprint $table): void {
            $table->id('id_pengguna');
            // Nullable sesuai ERD; unique di PostgreSQL mengizinkan banyak NULL.
            $table->string('nisn', 20)->nullable()->unique();
            $table->string('nip', 25)->nullable()->unique();
            $table->string('username', 50)->nullable()->unique();
            $table->string('password'); // hash bcrypt/argon, bukan plaintext
            $table->enum('peran', ['siswa', 'guru', 'admin'])->index();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengguna');
    }
};
