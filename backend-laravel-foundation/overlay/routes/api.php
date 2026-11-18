<?php

use App\Http\Controllers\Api\V1\Admin\PenggunaController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\JadwalController;
use App\Http\Controllers\Api\V1\KelasAnggotaController;
use App\Http\Controllers\Api\V1\KelasController;
use App\Http\Controllers\Api\V1\KuisController;
use App\Http\Controllers\Api\V1\MataPelajaranController;
use App\Http\Controllers\Api\V1\MateriController;
use App\Http\Controllers\Api\V1\NilaiController;
use App\Http\Controllers\Api\V1\PengumpulanController;
use App\Http\Controllers\Api\V1\PengumumanController;
use App\Http\Controllers\Api\V1\PresensiController;
use App\Http\Controllers\Api\V1\ProfilController;
use App\Http\Controllers\Api\V1\SiswaKelasController;
use App\Http\Controllers\Api\V1\TugasController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — LMS Simba
|--------------------------------------------------------------------------
|
| Prefix "/api" diberikan oleh bootstrap/app.php, prefix "v1" diberikan di sini,
| sehingga seluruh endpoint aplikasi berada di bawah /api/v1.
| Ringkasan seluruh endpoint: docs/API-MASTER.md
|
*/

// Parameter id harus berupa bilangan bulat wajar; selain itu 404 (bukan error database / 500).
foreach (['pengguna', 'kelas', 'mapel', 'siswa', 'materi', 'tugas', 'pengumpulan', 'kuis', 'nilai', 'guru', 'jadwal', 'presensi', 'pengumuman'] as $parameter) {
    Route::pattern($parameter, '[0-9]{1,18}');
}

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('health', [HealthController::class, 'live'])->name('health.live');
    Route::get('health/ready', [HealthController::class, 'ready'])->name('health.ready');

    // Backend 3: autentikasi (login, logout, me, reset password).
    Route::prefix('auth')->name('auth.')->group(base_path('routes/auth.php'));

    // Endpoint terautentikasi. Akun yang dinonaktifkan ditolak (401) walau sesinya masih ada.
    // Otorisasi per sumber daya lewat Policy / FormRequest::authorize().
    Route::middleware(['auth:sanctum', 'akun.aktif'])->group(function (): void {
        // Profil sendiri
        Route::get('profil', [ProfilController::class, 'show'])->name('profil.show');
        Route::patch('profil', [ProfilController::class, 'update'])->name('profil.update');

        // Kelas
        Route::get('kelas', [KelasController::class, 'index'])->name('kelas.index');
        Route::post('kelas', [KelasController::class, 'store'])->name('kelas.store');
        Route::get('kelas/{kelas}', [KelasController::class, 'show'])->name('kelas.show');
        Route::patch('kelas/{kelas}', [KelasController::class, 'update'])->name('kelas.update');
        Route::put('kelas/{kelas}/wali', [KelasController::class, 'gantiWali'])->name('kelas.wali');
        Route::post('kelas/{kelas}/arsipkan', [KelasController::class, 'arsipkan'])->name('kelas.arsipkan');
        Route::post('kelas/{kelas}/pulihkan', [KelasController::class, 'pulihkan'])->name('kelas.pulihkan');

        // Keanggotaan kelas (siswa_kelas)
        Route::get('kelas/{kelas}/anggota', [KelasAnggotaController::class, 'index'])->name('kelas.anggota.index');
        Route::post('kelas/{kelas}/anggota', [KelasAnggotaController::class, 'store'])->name('kelas.anggota.store');
        Route::delete('kelas/{kelas}/anggota/{siswa}', [KelasAnggotaController::class, 'destroy'])->name('kelas.anggota.destroy');
        Route::get('siswa/{siswa}/kelas', [SiswaKelasController::class, 'index'])->name('siswa.kelas');

        // Mata pelajaran
        Route::get('mapel', [MataPelajaranController::class, 'index'])->name('mapel.index');
        Route::post('mapel', [MataPelajaranController::class, 'store'])->name('mapel.store');
        Route::get('mapel/{mapel}', [MataPelajaranController::class, 'show'])->name('mapel.show');
        Route::patch('mapel/{mapel}', [MataPelajaranController::class, 'update'])->name('mapel.update');
        Route::put('mapel/{mapel}/guru', [MataPelajaranController::class, 'gantiGuru'])->name('mapel.guru');
        Route::post('mapel/{mapel}/arsipkan', [MataPelajaranController::class, 'arsipkan'])->name('mapel.arsipkan');
        Route::post('mapel/{mapel}/pulihkan', [MataPelajaranController::class, 'pulihkan'])->name('mapel.pulihkan');

        // Materi pembelajaran (Backend 5). Izin per baris lewat MateriPolicy.
        Route::get('mapel/{mapel}/materi', [MateriController::class, 'index'])->name('materi.index');
        Route::post('mapel/{mapel}/materi', [MateriController::class, 'store'])->name('materi.store');
        Route::get('materi/{materi}', [MateriController::class, 'show'])->name('materi.show');
        Route::patch('materi/{materi}', [MateriController::class, 'update'])->name('materi.update');
        Route::delete('materi/{materi}', [MateriController::class, 'destroy'])->name('materi.destroy');
        Route::post('materi/{materi}/file', [MateriController::class, 'gantiFile'])->name('materi.file.ganti');
        Route::get('materi/{materi}/file', [MateriController::class, 'unduh'])->name('materi.file');

        // Tugas (Backend 6): dikelola guru pengampu; dibaca sesuai TugasPolicy.
        Route::get('tugas', [TugasController::class, 'index'])->name('tugas.index');
        Route::get('mapel/{mapel}/tugas', [TugasController::class, 'indexMapel'])->name('tugas.mapel');
        Route::post('mapel/{mapel}/tugas', [TugasController::class, 'store'])->name('tugas.store');
        Route::get('tugas/{tugas}', [TugasController::class, 'show'])->name('tugas.show');
        Route::patch('tugas/{tugas}', [TugasController::class, 'update'])->name('tugas.update');
        Route::delete('tugas/{tugas}', [TugasController::class, 'destroy'])->name('tugas.destroy');
        Route::post('tugas/{tugas}/tutup', [TugasController::class, 'tutup'])->name('tugas.tutup');
        Route::get('tugas/{tugas}/lampiran', [TugasController::class, 'lampiran'])->name('tugas.lampiran');
        Route::post('tugas/{tugas}/lampiran', [TugasController::class, 'gantiLampiran'])->name('tugas.lampiran.ganti');
        Route::delete('tugas/{tugas}/lampiran', [TugasController::class, 'hapusLampiran'])->name('tugas.lampiran.hapus');

        // Pengumpulan tugas (Backend 6): siswa mengumpulkan miliknya; guru pengampu/admin membaca.
        Route::get('pengumpulan/saya', [PengumpulanController::class, 'daftarSaya'])->middleware('role:siswa')->name('pengumpulan.saya');
        Route::get('tugas/{tugas}/pengumpulan', [PengumpulanController::class, 'index'])->name('pengumpulan.index');
        Route::post('tugas/{tugas}/pengumpulan', [PengumpulanController::class, 'store'])->name('pengumpulan.store');
        Route::post('tugas/{tugas}/pengumpulan/revisi', [PengumpulanController::class, 'revisi'])->name('pengumpulan.revisi');
        Route::get('tugas/{tugas}/pengumpulan/saya', [PengumpulanController::class, 'saya'])->middleware('role:siswa')->name('pengumpulan.tugas.saya');
        Route::get('pengumpulan/{pengumpulan}', [PengumpulanController::class, 'show'])->name('pengumpulan.show');
        Route::get('pengumpulan/{pengumpulan}/file', [PengumpulanController::class, 'unduh'])->name('pengumpulan.file');

        // Kuis (Backend 7): hanya tautan Google Forms; dikelola guru pengampu.
        Route::get('kuis', [KuisController::class, 'index'])->name('kuis.index');
        Route::get('mapel/{mapel}/kuis', [KuisController::class, 'indexMapel'])->name('kuis.mapel');
        Route::post('mapel/{mapel}/kuis', [KuisController::class, 'store'])->name('kuis.store');
        Route::get('kuis/{kuis}', [KuisController::class, 'show'])->name('kuis.show');
        Route::patch('kuis/{kuis}', [KuisController::class, 'update'])->name('kuis.update');
        Route::delete('kuis/{kuis}', [KuisController::class, 'destroy'])->name('kuis.destroy');

        // Nilai (Backend 7): dicatat/diubah guru pengampu; siswa & admin hanya membaca.
        Route::get('nilai/saya', [NilaiController::class, 'saya'])->middleware('role:siswa')->name('nilai.saya');
        Route::get('nilai', [NilaiController::class, 'index'])->name('nilai.index');
        Route::get('nilai/{nilai}', [NilaiController::class, 'show'])->name('nilai.show');
        Route::patch('nilai/{nilai}', [NilaiController::class, 'update'])->name('nilai.update');
        Route::post('pengumpulan/{pengumpulan}/nilai', [NilaiController::class, 'beriTugas'])->name('nilai.tugas');
        Route::post('kuis/{kuis}/nilai', [NilaiController::class, 'catatKuis'])->name('nilai.kuis');
        Route::get('mapel/{mapel}/nilai', [NilaiController::class, 'rekapMapel'])->name('nilai.mapel');
        Route::get('siswa/{siswa}/nilai', [NilaiController::class, 'rekapSiswa'])->name('nilai.siswa');

        // Jadwal (Backend 8): dibaca sesuai JadwalPolicy; dikelola admin.
        Route::get('jadwal', [JadwalController::class, 'index'])->name('jadwal.index');
        Route::post('jadwal', [JadwalController::class, 'store'])->name('jadwal.store');
        Route::get('jadwal/{jadwal}', [JadwalController::class, 'show'])->name('jadwal.show');
        Route::patch('jadwal/{jadwal}', [JadwalController::class, 'update'])->name('jadwal.update');
        Route::delete('jadwal/{jadwal}', [JadwalController::class, 'destroy'])->name('jadwal.destroy');
        Route::get('siswa/{siswa}/jadwal', [JadwalController::class, 'jadwalSiswa'])->name('jadwal.siswa');
        Route::get('guru/{guru}/jadwal', [JadwalController::class, 'jadwalGuru'])->name('jadwal.guru');

        // Presensi (Backend 8): check-in siswa; roster/pencatatan/koreksi guru pada jadwal & admin.
        Route::post('jadwal/{jadwal}/checkin', [PresensiController::class, 'checkin'])->middleware('role:siswa')->name('presensi.checkin');
        Route::get('jadwal/{jadwal}/presensi', [PresensiController::class, 'roster'])->name('presensi.roster');
        Route::post('jadwal/{jadwal}/presensi', [PresensiController::class, 'catat'])->name('presensi.catat');
        Route::get('presensi/saya', [PresensiController::class, 'saya'])->middleware('role:siswa')->name('presensi.saya');
        Route::get('presensi', [PresensiController::class, 'index'])->name('presensi.index');
        Route::get('presensi/{presensi}', [PresensiController::class, 'show'])->name('presensi.show');
        Route::patch('presensi/{presensi}', [PresensiController::class, 'update'])->name('presensi.update');
        Route::get('rekap/presensi', [PresensiController::class, 'rekap'])->name('presensi.rekap');

        // Pengumuman (Backend 9): global dikelola admin; pengumuman mapel oleh guru pengampu/admin.
        Route::get('pengumuman', [PengumumanController::class, 'index'])->name('pengumuman.index');
        Route::post('pengumuman', [PengumumanController::class, 'store'])->name('pengumuman.store');
        Route::get('pengumuman/{pengumuman}', [PengumumanController::class, 'show'])->name('pengumuman.show');
        Route::patch('pengumuman/{pengumuman}', [PengumumanController::class, 'update'])->name('pengumuman.update');
        Route::delete('pengumuman/{pengumuman}', [PengumumanController::class, 'destroy'])->name('pengumuman.destroy');
        Route::get('mapel/{mapel}/pengumuman', [PengumumanController::class, 'indexMapel'])->name('pengumuman.mapel');

        // Dashboard (Backend 9): statistik dihitung dari database sesuai peran pemanggil.
        Route::get('dashboard', [DashboardController::class, 'show'])->name('dashboard.show');

        // Area admin: peran dicek di server dari database (bukan dari input klien).
        Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function (): void {
            Route::get('pengguna', [PenggunaController::class, 'index'])->name('pengguna.index');
            Route::post('pengguna', [PenggunaController::class, 'store'])->name('pengguna.store');
            Route::get('pengguna/{pengguna}', [PenggunaController::class, 'show'])->name('pengguna.show');
            Route::patch('pengguna/{pengguna}', [PenggunaController::class, 'update'])->name('pengguna.update');
            Route::post('pengguna/{pengguna}/nonaktifkan', [PenggunaController::class, 'nonaktifkan'])->name('pengguna.nonaktifkan');
            Route::post('pengguna/{pengguna}/aktifkan', [PenggunaController::class, 'aktifkan'])->name('pengguna.aktifkan');
        });
    });
});
