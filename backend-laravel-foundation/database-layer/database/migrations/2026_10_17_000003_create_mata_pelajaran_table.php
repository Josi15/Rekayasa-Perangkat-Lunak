<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mata_pelajaran', function (Blueprint $table): void {
            $table->id('id_mapel');
            $table->string('nama_mapel', 100);
            $table->foreignId('id_guru')->index()
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['nama_mapel', 'id_guru']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mata_pelajaran');
    }
};
