<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengumuman', function (Blueprint $table): void {
            $table->id('id_pengumuman');
            $table->string('judul', 255);
            $table->text('isi');
            $table->enum('cakupan', ['global', 'mapel']);
            $table->foreignId('id_penulis')->index()
                ->constrained('pengguna', 'id_pengguna')->restrictOnDelete();
            $table->foreignId('id_mapel')->nullable()->index()
                ->constrained('mata_pelajaran', 'id_mapel')->restrictOnDelete();
            $table->timestamps();
        });

        // global => tanpa mapel; mapel => wajib punya mapel.
        DB::statement("ALTER TABLE pengumuman ADD CONSTRAINT pengumuman_cakupan_mapel_check CHECK ((cakupan = 'global' AND id_mapel IS NULL) OR (cakupan = 'mapel' AND id_mapel IS NOT NULL))");
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumuman');
    }
};
