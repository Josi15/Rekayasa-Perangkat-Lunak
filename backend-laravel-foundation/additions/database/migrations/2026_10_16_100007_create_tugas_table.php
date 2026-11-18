<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tugas', function (Blueprint $table) {
            $table->id('id_tugas');
            $table->string('judul');
            $table->text('instruksi');
            $table->timestamp('batas_waktu');
            $table->string('lampiran', 500)->nullable(); // lampiran opsional
            $table->foreignId('id_mapel')->index()
                ->constrained('mata_pelajaran', 'id_mapel')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tugas');
    }
};
