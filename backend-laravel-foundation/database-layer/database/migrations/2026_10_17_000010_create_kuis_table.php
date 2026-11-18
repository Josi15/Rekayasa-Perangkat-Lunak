<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kuis', function (Blueprint $table): void {
            $table->id('id_kuis');
            $table->string('judul', 255);
            $table->string('tautan_google_form', 2048);
            $table->foreignId('id_mapel')->index()
                ->constrained('mata_pelajaran', 'id_mapel')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kuis');
    }
};
