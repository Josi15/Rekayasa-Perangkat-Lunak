<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jadwal', function (Blueprint $table) {
            $table->id('id_jadwal');
            $table->foreignId('id_mapel')->index()
                ->constrained('mata_pelajaran', 'id_mapel')->restrictOnDelete();
            $table->foreignId('id_kelas')
                ->constrained('kelas', 'id_kelas')->restrictOnDelete();
            $table->foreignId('id_guru')
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->timestamp('waktu_mulai');
            $table->timestamp('waktu_selesai');
            $table->timestamps();

            // Satu kelas / satu guru tidak boleh punya dua jadwal dengan waktu mulai sama.
            $table->unique(['id_kelas', 'waktu_mulai']);
            $table->unique(['id_guru', 'waktu_mulai']);
        });

        DB::statement('ALTER TABLE jadwal ADD CONSTRAINT jadwal_waktu_check CHECK (waktu_selesai > waktu_mulai)');
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal');
    }
};
