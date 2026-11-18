<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('siswa_kelas', function (Blueprint $table) {
            $table->foreignId('id_siswa')
                ->constrained('pengguna', 'id_pengguna')->cascadeOnDelete();
            $table->foreignId('id_kelas')->index()
                ->constrained('kelas', 'id_kelas')->cascadeOnDelete();
            $table->timestamps();

            // Primary key komposit sekaligus mencegah pasangan siswa-kelas duplikat.
            $table->primary(['id_siswa', 'id_kelas']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('siswa_kelas');
    }
};
