<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presensi', function (Blueprint $table) {
            $table->id('id_presensi');
            $table->foreignId('id_siswa')
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->foreignId('id_jadwal')->index()
                ->constrained('jadwal', 'id_jadwal')->restrictOnDelete();
            // Nullable: siswa izin/sakit/alpa tidak melakukan check-in (lihat laporan deviasi ERD).
            $table->timestamp('waktu_checkin')->nullable();
            $table->enum('status_kehadiran', ['hadir', 'izin', 'sakit', 'alpa']);
            $table->decimal('lokasi_lat', 10, 7)->nullable();
            $table->decimal('lokasi_lng', 10, 7)->nullable();
            $table->enum('status_validasi_lokasi', ['valid', 'tidak_valid'])->nullable();
            $table->timestamps();

            $table->unique(['id_siswa', 'id_jadwal']);
        });

        DB::statement("ALTER TABLE presensi ADD CONSTRAINT presensi_hadir_checkin_check
            CHECK (status_kehadiran <> 'hadir' OR waktu_checkin IS NOT NULL)");
        DB::statement('ALTER TABLE presensi ADD CONSTRAINT presensi_koordinat_check
            CHECK ((lokasi_lat IS NULL OR lokasi_lat BETWEEN -90 AND 90)
               AND (lokasi_lng IS NULL OR lokasi_lng BETWEEN -180 AND 180))');
    }

    public function down(): void
    {
        Schema::dropIfExists('presensi');
    }
};
