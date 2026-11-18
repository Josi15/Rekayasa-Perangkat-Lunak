<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengumpulan_tugas', function (Blueprint $table) {
            $table->id('id_pengumpulan');
            $table->foreignId('id_siswa')
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->foreignId('id_tugas')->index()
                ->constrained('tugas', 'id_tugas')->restrictOnDelete();
            $table->string('jawaban_file', 500);
            $table->enum('status', ['dikumpulkan', 'terlambat', 'dinilai'])->default('dikumpulkan');
            $table->timestamp('waktu_kumpul');
            $table->timestamps();

            // Satu siswa hanya punya satu pengumpulan per tugas (kumpul ulang = update).
            $table->unique(['id_siswa', 'id_tugas']);
            // Target composite FK dari tabel nilai (menjamin nilai.id_siswa = pemilik pengumpulan).
            $table->unique(['id_pengumpulan', 'id_siswa']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumpulan_tugas');
    }
};
