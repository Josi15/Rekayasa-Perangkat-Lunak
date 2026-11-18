<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nilai', function (Blueprint $table) {
            $table->id('id_nilai');
            $table->foreignId('id_siswa')->index()
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            // FK id_pengumpulan dibuat sebagai composite FK (id_pengumpulan, id_siswa) di bawah.
            $table->unsignedBigInteger('id_pengumpulan')->nullable()->unique();
            $table->foreignId('id_kuis')->nullable()->index()
                ->constrained('kuis', 'id_kuis')->restrictOnDelete();
            $table->decimal('nilai', 5, 2);
            $table->text('umpan_balik')->nullable();
            $table->timestamps();

            $table->unique(['id_siswa', 'id_kuis']); // satu nilai kuis per siswa
        });

        // Composite FK: bila id_pengumpulan NULL (nilai kuis), FK tidak diperiksa (MATCH SIMPLE).
        DB::statement('ALTER TABLE nilai ADD CONSTRAINT nilai_pengumpulan_siswa_fk
            FOREIGN KEY (id_pengumpulan, id_siswa)
            REFERENCES pengumpulan_tugas (id_pengumpulan, id_siswa) ON DELETE RESTRICT');

        // Sumber nilai harus tepat satu: pengumpulan tugas XOR kuis.
        DB::statement('ALTER TABLE nilai ADD CONSTRAINT nilai_satu_sumber_check
            CHECK (num_nonnulls(id_pengumpulan, id_kuis) = 1)');
        DB::statement('ALTER TABLE nilai ADD CONSTRAINT nilai_rentang_check
            CHECK (nilai BETWEEN 0 AND 100)');
    }

    public function down(): void
    {
        Schema::dropIfExists('nilai');
    }
};
