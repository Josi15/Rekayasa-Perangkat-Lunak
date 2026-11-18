<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * DEVIASI ERD (disengaja): ERD tidak memiliki email, padahal reset password lewat email
 * mewajibkannya. Kolom ditambahkan NULLABLE (siswa tanpa email tetap valid) dan unik
 * tanpa membedakan huruf besar/kecil. Migration terpisah agar aman untuk database yang
 * sudah memakai migration Backend 2.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengguna', function (Blueprint $table): void {
            $table->string('email', 255)->nullable();
        });

        DB::statement('CREATE UNIQUE INDEX pengguna_email_lower_unique ON pengguna (lower(email))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS pengguna_email_lower_unique');

        Schema::table('pengguna', function (Blueprint $table): void {
            $table->dropColumn('email');
        });
    }
};
