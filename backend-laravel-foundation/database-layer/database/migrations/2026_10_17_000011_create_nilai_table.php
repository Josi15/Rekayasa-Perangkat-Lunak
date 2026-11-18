<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nilai', function (Blueprint $table): void {
            $table->id('id_nilai');
            $table->foreignId('id_siswa')->index()
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->unsignedBigInteger('id_pengumpulan')->nullable();
            $table->foreignId('id_kuis')->nullable()->index()
                ->constrained('kuis', 'id_kuis')->restrictOnDelete();
            $table->decimal('nilai', 5, 2);
            $table->text('umpan_balik')->nullable();
            $table->timestamps();

            // FK komposit: nilai hanya boleh menunjuk pengumpulan milik siswa yang sama.
            // MATCH SIMPLE (default PostgreSQL): bila id_pengumpulan NULL, FK tidak diperiksa.
            $table->foreign(['id_pengumpulan', 'id_siswa'])
                ->references(['id_pengumpulan', 'id_siswa'])
                ->on('pengumpulan_tugas')
                ->restrictOnDelete();

            // Satu nilai per pengumpulan, satu nilai per siswa per kuis.
            $table->unique('id_pengumpulan');
            $table->unique(['id_siswa', 'id_kuis']);
        });

        // Aturan E: sumber nilai harus tepat satu (tugas XOR kuis).
        DB::statement('ALTER TABLE nilai ADD CONSTRAINT nilai_sumber_tunggal_check CHECK ((id_pengumpulan IS NULL) <> (id_kuis IS NULL))');
        DB::statement('ALTER TABLE nilai ADD CONSTRAINT nilai_rentang_check CHECK (nilai BETWEEN 0 AND 100)');
    }

    public function down(): void
    {
        Schema::dropIfExists('nilai');
    }
};
