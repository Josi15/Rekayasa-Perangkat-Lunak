<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * DEVIASI ERD (disengaja): ERD tidak memiliki status. "Menonaktifkan pengguna" dan "mengarsipkan
 * kelas/mata pelajaran" dimodelkan sebagai timestamp NULLABLE (NULL = aktif). Alasan: baris dengan
 * riwayat akademik (presensi, nilai, jadwal) tidak boleh dihapus (FK RESTRICT), dan soft delete
 * akan menyembunyikan baris dari relasi. Migration terpisah agar aman untuk database yang sudah ada.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengguna', function (Blueprint $table): void {
            $table->timestampTz('nonaktif_pada')->nullable()->index();
        });

        Schema::table('kelas', function (Blueprint $table): void {
            $table->timestampTz('diarsipkan_pada')->nullable()->index();
        });

        Schema::table('mata_pelajaran', function (Blueprint $table): void {
            $table->timestampTz('diarsipkan_pada')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('mata_pelajaran', fn (Blueprint $table) => $table->dropColumn('diarsipkan_pada'));
        Schema::table('kelas', fn (Blueprint $table) => $table->dropColumn('diarsipkan_pada'));
        Schema::table('pengguna', fn (Blueprint $table) => $table->dropColumn('nonaktif_pada'));
    }
};
