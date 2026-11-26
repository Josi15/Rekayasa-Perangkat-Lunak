# CLAUDE.md — Proyek SIMBA (LMS)

Konteks untuk Claude/pengembang. Perbarui bagian "Status tahap" setiap selesai satu tahap.

## Tujuan
Frontend React dan backend Laravel benar-benar tersambung, lalu di-deploy sebagai SATU service di Railway:
Laravel menyajikan API `/api/v1` sekaligus build frontend. Satu domain, tanpa Vercel, tanpa CORS lintas domain.

## Struktur
- `frontend-react-lms-simba/` — frontend utama (React 19 + Vite + Tailwind 4 + React Router 7). Semua `src/services/*.js` masih MOCK (`db.js`). Transport API ada di `src/services/http.js` (`apiRequest`, Sanctum SPA cookie + CSRF), peta endpoint di `src/services/endpoints.js`, base URL dari `VITE_API_BASE_URL`.
- `backend-laravel-foundation/` — BUKAN proyek Laravel utuh: overlay untuk Laravel 12 (PHP 8.4, PostgreSQL), dipasang `./apply.sh <folder-baru>`. Auth Sanctum mode SPA (cookie + CSRF, tanpa token). Dokumen: `finalisasi-layer/docs/` (API-REFERENCE.md, openapi.yaml, FRONTEND-INTEGRATION.md, ACCESS-MATRIX.md, DEPLOYMENT.md, SETUP.md), `auth-layer/docs/AUTH.md`.
- `frontend-react-rpl/`, `frontend-ejs-prototype/` — referensi saja. JANGAN diubah, tidak di-deploy.

## Aturan kerja
- Kerjakan BERTAHAP; selesai satu tahap -> lapor -> tunggu kata "lanjut".
- Jangan mengklaim "sudah jalan" tanpa bukti hasil perintah. Sebut jelas bagian yang tidak teruji.
- Jangan menimpa file diam-diam; sebutkan file yang diubah.
- Jangan ubah tampilan/desain UI. Halaman hanya mengimpor dari `src/services`.
- Rahasia (APP_KEY, password DB) tidak di kode atau `VITE_*`; semua lewat env. `.env` tidak di-commit.
- Mode mock dipertahankan lewat env (`VITE_USE_MOCK=true`) untuk vitest dan demo.

## Setup backend lokal
```bash
cd backend-laravel-foundation && ./apply.sh ../simba-backend     # perlu composer + PHP 8.4 + ext pgsql
cd ../simba-backend
# .env: DB_USERNAME / DB_PASSWORD; buat DB kosong: lms_simba dan lms_simba_test
php artisan migrate
php artisan test          # memakai lms_simba_test
```

Catatan bug lengkap: lihat `bug.md`. Build frontend ke Laravel: `scripts/build-frontend.sh ../simba-backend`.

## Status tahap
### Tahap 1 — Backend lokal: SELESAI SEBAGIAN (lihat angka jujur di bawah)
Lingkungan uji: PHP 8.3.6 (BUKAN 8.4), PostgreSQL 16, Laravel 12.71.0, PHPUnit 11.5.57. Packagist tidak terjangkau,
jadi Laravel dipasang lewat workaround manual dari GitHub (tidak relevan untuk lokal/Railway).
- `apply.sh`: berhasil. `php artisan migrate`: 19 migrasi lulus.
- `php artisan test` awal: 88 gagal / 511 lulus. Setelah perbaikan di bawah: **12 gagal / 587 lulus** (4256 assertion).

Perubahan (semua juga diterapkan di sumber overlay):
1. `additions/bootstrap/app.php` — `SubstituteBindings` berjalan sebelum `akun.aktif`/`role`, sehingga ID tak ada memberi 404 sebelum 401/403 (membocorkan keberadaan data). Ditambah `prependToPriorityList` agar `EnsureAkunAktif` lalu `EnsureRole` berjalan lebih dulu. Juga `AssignRequestId` dijadikan middleware global agar 404 route tak dikenal punya `request_id`.
2. `PenyimpananMateri.php`, `PenyimpananTugas.php`, `PenyimpananBerkas.php` — `new PenyimpananGagalException(previous: $e)` salah nama parameter (konstruktor memakai `$sebelumnya`) sehingga gagal-simpan berkas jadi 500 dan bukan 503. Bug produksi nyata.
3. `BuatJadwalRequest.php` — `after:waktu_mulai` memanggil `Carbon::parse()` pada array -> 500; kini aturan itu dilewati bila `waktu_mulai` bukan string (hasil: 422).
4. `master-layer/tests/Concerns/MasterApi.php` (HANYA tes) — `sebagai()` kini memanggil `Auth::forgetGuards()`. Guard Sanctum menyimpan user antar request dalam satu tes, sehingga pelaku berikutnya "bocor" ke pelaku sebelumnya (82 -> 18 kegagalan). Ini artefak harness tes, bukan bug runtime (tiap request nyata proses baru).

12 tes MASIH gagal (belum diselidiki tuntas; jangan dianggap bug/bukan bug tanpa diperiksa):
AksesRoleTest (daftar kelas), ConstraintTest (jadwal), AlurUtamaTest (401 vs 201), JadwalApiTest (filter tanggal), PresensiCheckinTest (403 vs 401),
PresensiKelolaTest (rekap zona waktu), NilaiApiTest (92 vs 92.0), AnggotaKelasTest (200 vs 401), TugasApiTest (offset zona waktu),
serta 3 kegagalan `UniqueConstraintViolationException` dari factory (acak/flaky, berbeda tiap run).
Dugaan (belum terbukti): sebagian sisa guard-state sama seperti butir 4, sebagian zona waktu/PHP 8.3, sebagian factory tidak unik.

Perbandingan endpoint (artisan route:list vs openapi.yaml vs endpoints.js):
- Route nyata: 94 (method+path). OpenAPI: 95. Selisih hanya `GET /sanctum/csrf-cookie` (route bawaan Sanctum, bukan di routes/api.php). Selain itu identik.
- `endpoints.js` tidak cocok pada: `materials: '/materi'` dan `submissions: '/pengumpulan'` — tidak ada koleksi `GET /materi` maupun `GET /pengumpulan`. Pakai `/mapel/{id}/materi`, `/materi/{id}`, `/pengumpulan/saya`, `/pengumpulan/{id}`.
- Daftar materi/tugas/kuis/nilai/pengumuman bersifat PER MAPEL (`/mapel/{id}/...`); tugas, kuis, nilai, pengumuman punya juga koleksi datar. Perlu lapisan adaptasi di Tahap 2.

### Tahap 2 — Sambungkan frontend ke API: SELESAI (belum diuji terhadap backend sungguhan)
Detail lengkap: `docs/TAHAP-2.md` (perubahan per file, pemetaan kontrak, fitur belum didukung, uji manual).
- Hasil: `npm run verify` lulus — lint 0 error, check:routes OK, **63 tes lulus (12 file)**, build OK. Backend TIDAK dijalankan (tidak ada PHP/PostgreSQL di lingkungan uji).
- Mode: `VITE_USE_MOCK=true` → data simulasi (demo & vitest); selain itu → API (`src/services/api/*`, dipilih lewat `pick` di `services/mode.js`).
- Sesi mode API = cookie Sanctum; user/peran dari `GET /auth/me`; 401 → `/login` (`onUnauthorized`).
- Dev: proxy Vite `/api` & `/sanctum` → Laravel; set `VITE_API_BASE_URL=/api/v1`.
- Keterbatasan penting: backend tidak punya nama lengkap (UI memakai username/NISN/NIP); fitur tanpa endpoint (pengaturan sekolah, leger, status/sync kuis, profil selain email/sandi, draft, urut materi) menampilkan pesan "belum didukung".
- Tes lama `roles.test.jsx` sudah gagal sebelum Tahap 2 (race tes); diperbaiki di tes saja.
- 12 tes backend dari Tahap 1 (lihat `bug.md`) masih terbuka.
### Tahap 3 — Laravel menyajikan frontend: SELESAI SEBAGIAN (kode siap; tes di dalam Laravel BELUM dijalankan)
Detail: `docs/TAHAP-3.md`. Packagist diblokir di lingkungan uji → Laravel tidak terpasang, `SpaServingTest` belum dijalankan.
- Baru: `backend-laravel-foundation/spa-layer/` (SpaController, `config/spa.php`, `routes/web.php` fallback `GET /{any?}`, `tests/Feature/SpaServingTest.php`), `scripts/build-frontend.sh <folder-laravel>`; `apply.sh` +1 baris. `routes/web.php` bawaan Laravel dicadangkan `.bak`.
- Fallback mengecualikan `api/*`, `sanctum/*`, `storage/*`, `assets/*`, `up`, dotfile, path berekstensi. Tanpa middleware sesi/cookie/CSRF.
- Terbukti: `npm run verify` lulus (63 tes), build mode API (`/api/v1`) disalin ke `public/` (uji folder tiruan), regex 26 kasus, `php -l`.
- Berkas privat: disk `local` = `storage/app/private`, di luar `public/`; jangan jalankan `storage:link`. Hanya lewat endpoint API.
- Build produksi WAJIB: `VITE_USE_MOCK=false VITE_API_BASE_URL=/api/v1` (tanpa itu bundel jatuh ke `http://localhost:8000/api/v1`).
### Tahap 4 — Deploy Railway (satu service): KODE SIAP, BELUM TERUJI SAMA SEKALI
Detail: `docs/TAHAP-4.md` (langkah deploy, admin pertama, verifikasi). Tidak ada Docker/Packagist di lingkungan penyusun → image belum pernah dibuild.
- Fix build #1: `/app` image dasar tidak kosong -> kosongkan dulu. Fix build #2: `Class Laravel\Pail\PailServiceProvider not found` (cache paket dev basi) -> create-project `--no-dev --no-scripts` dulu, hapus `bootstrap/cache/*.php` sebelum `package:discover`.
- Baru: `Dockerfile` (Node build → FrankenPHP PHP 8.4 + pdo_pgsql + overlay via apply.sh), `docker/{Caddyfile,php.ini,start.sh}`, `railway.toml`, `railway.env.example`, `.dockerignore`, `deploy-layer/` (`php artisan simba:buat-admin`, tes). `apply.sh` +1 baris.
- Start: cek env wajib → migrate --force (retry) → config:cache → route:cache → simba:cek-produksi (info) → frankenphp. Port dari `$PORT`. Volume di `/app/storage/app/private`.
- `TRUSTED_PROXIES=100.64.0.0/10` hanya tebakan terdokumentasi (Railway tidak menjamin); jangan "*". `QUEUE_CONNECTION=sync` (tanpa worker). `SESSION_DOMAIN` kosong.
- Admin pertama: `simba:buat-admin` (jangan db:seed).
- Fix deploy #3: `relation personal_access_tokens already exists` — migration hasil `vendor:publish` Sanctum bernama berdasar waktu build (beda tiap build). Diganti `auth-layer/database/migrations/2026_10_20_000003_ensure_personal_access_tokens_table.php` (nama tetap + `hasTable` guard); `apply.sh` menghapus salinan hasil publish.
- Admin pertama bisa lewat env `ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD` (start.sh memanggil `simba:buat-admin`); HAPUS `ADMIN_PASSWORD` setelah admin terbentuk.
- Data demo opsional: env `SEED_DEMO=true` + `SEED_DEFAULT_PASSWORD` -> start.sh menjalankan `db:seed --force` (seeder dilewati bila pengguna sudah ada). Dockerfile memasang `fakerphp/faker` (BELUM TERUJI). Jangan aktifkan untuk data sungguhan.

### Tahap 5 — Samakan tampilan admin dengan desain (mulai dari admin)
Temuan: guru dibangun dari desain Figma; admin punya desain di `frontend-ejs-prototype/` (10 halaman + CSS), siswa di `frontend-react-rpl/` (13 halaman). Proyek utama baru punya versi generik untuk admin/siswa. Aturan "jangan ubah UI" dicabut untuk admin/siswa atas permintaan pemilik.
- 5A (SELESAI): menu admin = 10 item prototype (+Pengumuman, Laporan, Pengaturan), `AdminDashboard` mengikuti layout prototype memakai data nyata (pengguna, kelas, jadwal hari ini, pengumuman terbaru), 5 halaman baru (`schedule, materials, assignments, quiz, attendance`) berupa `AdminComingSoon` (tanpa data palsu). Panel Dapodik/SSO/token CBT/backup di prototype TIDAK dibuat (tidak ada backend). `npm run verify` lulus (65 tes), hanya mode mock yang diuji.
- 5B (SELESAI): 5 halaman admin dibangun dengan data asli (`npm run verify` lulus, 77 tes; mode mock + stub fetch, BELUM diuji ke backend sungguhan).
  - Jadwal & Kalender KBM (`AdminSchedulePage`): sesi bertanggal per pekan, filter rombel, tab hari, buat/ubah/hapus (POST/PATCH/DELETE `/jadwal`, waktu ISO + offset zona lewat `A.localIso`), penanda bentrok (`A.conflictIds`, hanya tampilan; penolakan asli dari backend). Sesi yang sudah mulai: tombol ubah/hapus nonaktif di mode API (backend menolak `schedule_started`). Mode mock: pola mingguan dikembangkan jadi sesi bertanggal.
  - Materi, Tugas & Nilai, Kuis: HANYA-BACA (memakai service yang sudah ada). Tugas & Nilai menampilkan daftar tugas + 30 nilai terbaru + rerata. Kuis: hanya tautan Google Form.
  - Monitoring Presensi: rekap per siswa (`GET /rekap/presensi`, filter kelas + periode), daftar sesi per tanggal, modal roster dengan koreksi status (PATCH `/presensi/{id}` bila sudah ada, POST `/jadwal/{id}/presensi` bila belum).
  - Restyle Pengguna, Kelas, Mapel, Pengumuman: `AdminHead` + `AdminStat` + `DataTable variant="admin"` (komponen baru di `components/admin/`). Aksi/aria-label lama dipertahankan.
  - Service baru: `scheduleService.{sessions,create,update,remove}`, `attendanceService.{roster,correct,rekap}` (mock + API). `AdminComingSoon.jsx` tidak dipakai lagi dan dihapus.
  - Belum ada di backend (tidak dibuat): ruang/lab, kalender akademik, guru pengganti, panel Dapodik/SSO/token CBT/backup, catatan presensi.
- 5C (SELESAI): 9 halaman siswa mengikuti desain `frontend-react-rpl` dengan data asli (`npm run verify` lulus, 85 tes; mode mock + satu tes mode API dengan stub fetch, BELUM diuji ke backend sungguhan). Rute, menu, dan label lama dipertahankan (tes lama tetap lulus tanpa diubah); layout bersama (sidebar + header) tidak diubah.
  - Dashboard: sapaan "Halo, {nama}!", kartu (mapel, tugas belum dikumpulkan, menunggu penilaian, rata-rata nilai), jadwal hari ini + banner pelajaran berikutnya, tugas mendekati tenggat (sisa waktu), mapel, pengumuman terbaru.
  - Tugas: chip filter berjumlah (Semua, Belum dikumpulkan, Menunggu penilaian, Sudah dinilai, Terlambat) + pencarian; status dihitung di klien (`utils/student.js` -> `taskState`: todo, overdue, submitted, graded, closed). Detail: layout 2 kolom, kartu tenggat dan kartu nilai; tugas yang ditutup guru tidak menampilkan formulir. Alur kirim (label "Jawaban", tombol "Kumpulkan tugas", toast) tidak diubah.
  - Nilai: kartu ringkasan, grafik batang nilai terbaru (`ScoreBars`, tanpa angka sebagai teks), daftar per mapel (nilai + feedback + tugas menunggu/belum dikumpulkan), filter mapel. Rata-rata ditulis "N / 100" dan diberi catatan bukan nilai akhir.
  - Jadwal: tampilan Mingguan/Harian (tab hari), hari ini disorot, penanda "Berikutnya"/"Berlangsung" dari `nextSession`; Sabtu/Minggu tampil bila ada sesi. Jadwal siswa tetap POLA MINGGUAN (backend: sesi bertanggal dilipat oleh `weekly()`), jadi TIDAK ada navigasi tanggal seperti prototype RPL.
  - Materi: daftar baris + pencarian + filter mapel; detail: tombol sebelumnya/selanjutnya dalam satu mapel (gagal memuat daftar tidak menutup materi). Pengumuman: pencarian, chip kategori (bila >1 kategori), halaman detail baru `/student/announcements/:id` (lewat daftar peran siswa, jadi pengumuman sasaran guru tidak bisa dibuka). Mata Pelajaran: pencarian + kartu.
  - Perbaikan kecil: Minggu kini dihitung sebagai hari 7 (kode lama membandingkan `getDay()` = 0 dengan `dayIndex` 1-7 sehingga "hari ini" salah di hari Minggu).
  - Tidak dibuat karena backend/mock belum punya: progres "materi dipelajari" + tombol tandai, kategori/status kelas, notifikasi + lonceng, status dibaca/belum dibaca pengumuman, aktivitas terbaru, halaman profil siswa (layanan profil mock masih milik guru; backend hanya email + kata sandi), navigasi jadwal per tanggal, nilai maksimum per tugas (diasumsikan 0-100 seperti validasi backend).
  - Dipertahankan beda dari prototype RPL: path tetap `/student/assignments` dan `/student/subjects` (RPL: `/tasks`, `/classes`); pengumpulan tugas tanpa dialog konfirmasi agar alur dan tes lama tetap sama.

### Tahap 6 — Penggabungan 3 zip & perapian (SELESAI; tidak ada tes npm yang dijalankan)
- Penggabungan: dasar = zip 14 Nov; berkas deploy `SEED_DEMO` (Dockerfile, `docker/start.sh`, `railway.env.example`) dikembalikan dari commit git `42e5d3f` (hilang di snapshot lain). Detail: `CATATAN-PENGGABUNGAN.md`.
- Perbaikan UI: dashboard admin tidak lagi meluap horizontal di ponsel (`grid-cols-1`), identitas pengguna tidak ganda (`TopBar` kini menyembunyikan blok identitas bila `name` kosong; layout sudah menampilkan `UserBadge`), jam jadwal tidak lagi tampil `07:30 - …`.
- Tooling: `npm run dev:mock` / `build:mock` + `.env.mock` (demo tanpa backend; `npm run dev` = mode API), `engines` Node, `.nvmrc`, `package.json` root (`npm run dev` di root = mock). Dua impor tak terpakai dihapus. README root & frontend ditulis ulang agar sesuai kode.
- Uji: bundling esbuild, `check:routes` (48 rute), `tsc --checkJs`, uji klik Chromium pada build mock. `npm run verify` BELUM dijalankan di Tahap ini.

### Tahap 7 — Backend Pengaturan sekolah (`GET/PATCH /pengaturan`): KODE SIAP; tes backend BELUM dijalankan
Halaman Admin → Pengaturan Sistem sebelumnya menampilkan "Pengaturan sekolah belum didukung oleh backend" (`settingApi` = `nope(...)`). Detail endpoint: `backend-laravel-foundation/pengaturan-layer/docs/API-PENGATURAN.md`.
- Baru: `backend-laravel-foundation/pengaturan-layer/` (migration `pengaturan_sekolah` satu baris + constraint, model, enum `Semester`, `TahunAjaran`, rule, service, policy, request, resource, controller, `config/pengaturan.php`, 2 berkas tes). Diubah: `apply.sh` (+1 baris), `overlay/routes/api.php` (+2 route, bukan di grup `role:admin`; admin-saja lewat `PengaturanSekolahPolicy`).
- Frontend: `settingApi` memanggil `/pengaturan` (`activityApi.js`), `mapSetting`/`settingPayload` (`adapt.js`), `settingService` diekspor lewat `pick(mock, API)` (`services/index.js`), `loadTerm` (`teacherViewApi.js`) membuat header guru memakai tahun ajaran dari backend dengan cadangan turunan tanggal.
- Dokumen: `API-REFERENCE.md`, `openapi.yaml`, `ACCESS-MATRIX.md` ditambah MANUAL (generator butuh `audit_routes.py` yang tidak ada di repo). Env opsional `SCHOOL_NAME` (`railway.env.example`, `additions/.env.example`).
- Terbukti: `php -l` semua berkas baru bersih; 25 pemeriksaan logika `TahunAjaran` (PHP murni, stub Carbon) lulus; `src/test/api.test.js` 31/31 lulus (6 tes baru Pengaturan) dengan konfigurasi vitest sementara; `openapi.yaml` valid dan tanpa `$ref` menggantung.
- BELUM terbukti: `PengaturanApiTest` dan migration TIDAK dijalankan (tidak ada PostgreSQL/Laravel di lingkungan penyusun). Jalankan `php artisan migrate && php artisan test --filter=Pengaturan` setelah `apply.sh`. Deploy: `start.sh` menjalankan `migrate --force`, jadi tabel dibuat otomatis.
- TEMUAN (bukan dari Tahap 7, perlu keputusan pemilik): commit `755b315` "Perbaikan frontend LMS SIMBA" menimpa `frontend-react-lms-simba/src/routes/{index,studentRoutes,teacherRoutes,adminRoutes}.jsx` dengan versi gaya RPL (rute guru tinggal 1, admin 3) dan menyederhanakan `vite.config.js` (proxy dev hilang, bukan fungsi lagi sehingga `vitest.config.js` gagal start). Akibatnya `npm run check:routes` gagal (111 baris) dan tidak ada rute `/admin/settings`. Versi lengkap ada di `git show 755b315^:<path>`. Upload sesudahnya tidak memulihkan. Jangan deploy dari `main` sebelum ini diputuskan.
