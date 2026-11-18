# SIMBA Frontend (Express + EJS)

## Menjalankan
    npm install
    npm start        # http://localhost:3000/admin/dashboard

## Struktur
- server.js            -> route halaman
- data/dummy.js        -> data dummy (ganti dengan data backend)
- views/partials/      -> sidebar & topbar (dipakai semua halaman)
- views/dashboard.ejs  -> Halaman 1: Dashboard Admin
- views/pengguna.ejs    -> Halaman 2: Manajemen Pengguna (data/pengguna.js, css/pengguna.css, js/pengguna.js)
- views/rombel.ejs      -> Halaman 3: Kelas & Rombel (data/rombel.js, css/rombel.css, js/rombel.js)
- views/presensi.ejs    -> Halaman 4: Monitoring Presensi (data/presensi.js, css/presensi.css, js/presensi.js)
- views/materi.ejs      -> Halaman 7: Master Bank Materi (data/materi.js, css/materi.css, js/materi.js)
- views/mapel.ejs        -> Halaman 5: Mata Pelajaran & Kurikulum (data/mapel.js, css/mapel.css, js/mapel.js)
- views/jadwal.ejs       -> Halaman 6: Jadwal & Kalender KBM (data/jadwal.js, css/jadwal.css, js/jadwal.js)
- views/tugas.ejs       -> Halaman 8: Bank Tugas & Monitoring Evaluasi (data/tugas.js, css/tugas.css, js/tugas.js)
- views/sistem.ejs      -> Halaman 9: Konfigurasi Satdik & Keamanan Data (data/sistem.js, css/sistem.css, js/sistem.js)
- views/kuis.ejs        -> Halaman 10: Pusat Integrasi Asesmen Kuis Form & CBT (data/kuis.js, css/kuis.css, js/kuis.js)
- public/css, public/js -> aset statis

## Redesain 6 halaman admin (menu Dapodik)
Menu admin dipangkas jadi 6: dashboard, pengguna, rombel, mapel, jadwal, sistem.
- views/partials/shell-sidebar.ejs + shell-topbar.ejs -> sidebar Dapodik & top bar bersama (logo: public/img/logo.png)
- public/css/shell.css -> gaya bersama; public/css/<halaman>.css -> gaya khusus halaman
- public/js/<halaman>.js -> interaksi + data contoh (belum memakai data/*.js; sambungkan ke backend nanti)
- Halaman presensi, materi, tugas, kuis tetap ada (tidak masuk menu baru) dan memakai sidebar lama.
- File lama enam halaman dicadangkan di _cadangan_sebelum_redesain/
