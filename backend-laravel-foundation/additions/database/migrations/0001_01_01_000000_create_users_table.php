<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Menggantikan migration bawaan skeleton ("users") dengan tabel PENGGUNA sesuai ERD.
 * Tabel sessions dipertahankan karena SESSION_DRIVER=database.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengguna', function (Blueprint $table) {
            $table->id('id_pengguna');
            $table->string('nisn', 20)->nullable()->unique();
            $table->string('nip', 30)->nullable()->unique();
            $table->string('username', 50)->nullable()->unique();
            $table->string('password');
            $table->enum('peran', ['siswa', 'guru', 'admin'])->index();
            $table->rememberToken();
            $table->timestamps();
        });

        // Tambahan teknis: akun harus punya minimal satu identitas login.
        DB::statement('ALTER TABLE pengguna ADD CONSTRAINT pengguna_identitas_check
            CHECK (nisn IS NOT NULL OR nip IS NOT NULL OR username IS NOT NULL)');

        Schema::create('sessions', function (Blueprint $table) {
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
        Schema::dropIfExists('pengguna');
    }
};
