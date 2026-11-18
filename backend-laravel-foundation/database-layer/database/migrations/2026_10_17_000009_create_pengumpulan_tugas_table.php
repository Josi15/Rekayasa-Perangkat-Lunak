<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengumpulan_tugas', function (Blueprint $table): void {
            $table->id('id_pengumpulan');
            $table->foreignId('id_siswa')
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->foreignId('id_tugas')->index()
                ->constrained('tugas', 'id_tugas')->restrictOnDelete();
            $table->string('jawaban_file', 500);
            $table->enum('status', ['dikumpulkan', 'terlambat', 'dinilai'])->default('dikumpulkan');
            $table->timestampTz('waktu_kumpul');
            $table->timestamps();

            // Satu siswa satu pengumpulan per tugas (pengumpulan ulang = update).
            $table->unique(['id_siswa', 'id_tugas']);
            // Target foreign key komposit dari tabel nilai (konsistensi pemilik nilai).
            $table->unique(['id_pengumpulan', 'id_siswa']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumpulan_tugas');
    }
};
