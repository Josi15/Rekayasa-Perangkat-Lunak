<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presensi', function (Blueprint $table): void {
            $table->id('id_presensi');
            $table->foreignId('id_siswa')
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->foreignId('id_jadwal')->index()
                ->constrained('jadwal', 'id_jadwal')->restrictOnDelete();
            // Nullable (deviasi teknis dari ERD): izin/sakit/alpa dicatat tanpa check-in.
            $table->timestampTz('waktu_checkin')->nullable();
            $table->enum('status_kehadiran', ['hadir', 'terlambat', 'izin', 'sakit', 'alpa']);
            $table->decimal('lokasi_lat', 10, 7)->nullable();
            $table->decimal('lokasi_lng', 10, 7)->nullable();
            $table->enum('status_validasi_lokasi', ['valid', 'tidak_valid', 'belum_divalidasi'])
                ->default('belum_divalidasi');
            $table->timestamps();

            // Satu siswa hanya punya satu catatan presensi per sesi jadwal.
            $table->unique(['id_siswa', 'id_jadwal']);
        });

        DB::statement('ALTER TABLE presensi ADD CONSTRAINT presensi_lat_check CHECK (lokasi_lat BETWEEN -90 AND 90)');
        DB::statement('ALTER TABLE presensi ADD CONSTRAINT presensi_lng_check CHECK (lokasi_lng BETWEEN -180 AND 180)');
        DB::statement('ALTER TABLE presensi ADD CONSTRAINT presensi_lat_lng_berpasangan_check CHECK ((lokasi_lat IS NULL) = (lokasi_lng IS NULL))');
    }

    public function down(): void
    {
        Schema::dropIfExists('presensi');
    }
};
