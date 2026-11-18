# bug.md — Catatan bug SIMBA

Dicatat selama Tahap 1 (backend lokal). Lingkungan uji: PHP 8.3.6, PostgreSQL 16, Laravel 12.71.0, PHPUnit 11.5.57.
Hasil `php artisan test`: awal 88 gagal / 511 lulus -> sekarang 12 gagal / 587 lulus.

Status: [FIXED] sudah diperbaiki dan diterapkan di sumber overlay. [OPEN] belum selesai / belum diselidiki.

## Sudah diperbaiki

### BUG-01 [FIXED] Cek akun/peran berjalan SETELAH route-binding (kebocoran keberadaan data)
- Gejala: akun nonaktif atau peran salah yang memanggil route dengan ID yang tidak ada mendapat 404, bukan 401/403.
  Tes: `RouteGuardTest` (akun nonaktif, area admin menolak siswa/guru).
- Penyebab: urutan middleware efektif `Authenticate -> Throttle -> SubstituteBindings -> EnsureAkunAktif`. Middleware kustom
  tidak masuk daftar prioritas, jadi binding (404) jalan duluan.
- Dampak: penyerang yang login bisa menebak ID mana yang ada (enumerasi) walau tidak berhak.
- Perbaikan: `additions/bootstrap/app.php` — `prependToPriorityList(before: SubstituteBindings::class, prepend: EnsureRole::class)`
  lalu `prependToPriorityList(before: EnsureRole::class, prepend: EnsureAkunAktif::class)`.
  Urutan baru: `Authenticate -> Throttle -> EnsureAkunAktif -> SubstituteBindings`.

### BUG-02 [FIXED] Gagal simpan berkas jadi 500, bukan 503 (parameter bernama salah)
- Gejala: `Error: Unknown named parameter $previous` saat penyimpanan berkas gagal. 5 tes (Materi, Pengumpulan, Tugas).
- Penyebab: `new PenyimpananGagalException(previous: $e)`, padahal konstruktornya memakai `?Throwable $sebelumnya`.
- Dampak: bug produksi di jalur error. Saat disk/storage bermasalah, klien menerima 500 mentah, bukan 503 dengan pesan rapi.
- Perbaikan: ganti menjadi `sebelumnya: $e` di 6 tempat:
  `materi-layer/.../PenyimpananMateri.php` (2), `tugas-layer/.../PenyimpananTugas.php` (2), `tugas-layer/.../PenyimpananBerkas.php` (2).

### BUG-03 [FIXED] `waktu_mulai` berupa array membuat 500 (seharusnya 422)
- Gejala: `TypeError: Carbon::parse(): Argument #1 ($time) must be ... array given`. Tes: `JadwalApiTest > validasi input pembuatan`
  (data set "mulai bertipe array").
- Penyebab: aturan `after:waktu_mulai` pada `waktu_selesai` memanggil `Carbon::parse()` pada nilai `waktu_mulai` yang ternyata array.
- Perbaikan: `jadwalpresensi-layer/.../BuatJadwalRequest.php` — `after:waktu_mulai` hanya ditambahkan bila `waktu_mulai` bertipe string
  (field itu sendiri sudah ditolak aturan `string`).
- Catatan: `UbahJadwalRequest` tidak memakai `after:waktu_mulai`, jadi tidak terkena.

### BUG-04 [FIXED] 404 route tak dikenal tanpa `request_id`
- Gejala: `FoundationTest > unknown api route returns json 404` — body `{"message","code"}` tanpa `request_id`.
- Penyebab: `AssignRequestId` dipasang di grup `api`; route yang tidak cocok tidak menjalankan middleware grup itu.
- Perbaikan: `additions/bootstrap/app.php` — `AssignRequestId` dipasang global (`$middleware->prepend(...)`), `ForceJsonResponse` tetap di grup api.

### TEST-01 [FIXED, hanya tes] Guard Sanctum menyimpan user antar request dalam satu tes
- Gejala: puluhan tes "diharapkan 403 tapi 200" / "diharapkan 422 tapi 403" / "401 tapi 200" (82 kegagalan).
- Penyebab: helper `sebagai()` memakai `actingAs()` berulang dalam satu tes; `RequestGuard` Sanctum men-cache user sehingga pelaku
  berikutnya memakai pelaku sebelumnya.
- Dampak: artefak harness tes, BUKAN bug runtime (di produksi tiap request memakai proses/guard baru).
- Perbaikan: `master-layer/tests/Concerns/MasterApi.php` — `Auth::forgetGuards()` di awal `sebagai()`.

## Masih terbuka (12 tes gagal, belum diselidiki tuntas)
Jangan dianggap bug maupun bukan-bug sebelum diperiksa.

| ID | Tes | Gejala | Dugaan (belum terbukti) |
|----|-----|--------|-------------------------|
| OPEN-01 | `AksesRoleTest` daftar kelas dibatasi sesuai peran | array tidak identik | sisa guard-state / urutan data |
| OPEN-02 | `ConstraintTest` jadwal | AssertionFailedError (`DatabaseTestCase.php:46`) | belum dilihat |
| OPEN-03 | `AlurUtamaTest` alur sekolah | 401 diharapkan 201 | sisa guard-state (login/logout dalam satu tes) |
| OPEN-04 | `JadwalApiTest` filter tanggal | `false is true` | zona waktu / PHP 8.3 |
| OPEN-05 | `PresensiCheckinTest` hanya siswa di... | 403 diharapkan 401 | sisa guard-state |
| OPEN-06 | `PresensiKelolaTest` rekap memakai zona... | array tidak identik | zona waktu |
| OPEN-07 | `NilaiApiTest` guru mencatat nilai kuis | `92 is identical to 92.0` | tipe numerik JSON (int vs float) |
| OPEN-08 | `AnggotaKelasTest` siswa tidak boleh melihat... | 401 diharapkan 200 | sisa guard-state / sesi dicabut dalam satu tes |
| OPEN-09 | `TugasApiTest` batas waktu dengan offset zona | `false is true` | zona waktu |
| OPEN-10 | 3 tes `UniqueConstraintViolationException` (mapel nama+guru) | berbeda tiap run | factory menghasilkan data duplikat (flaky) |

Catatan terkait OPEN-08: tes `PenggunaApiTest > nonaktifkan lalu login ditolak` sempat gagal pada `GET /auth/me` untuk akun nonaktif
(200 diharapkan 401) sebelum perbaikan TEST-01; setelah itu lulus.

## Ketidakcocokan kontrak (bukan bug backend)
- `frontend-react-lms-simba/src/services/endpoints.js`: `materials: '/materi'` dan `submissions: '/pengumpulan'` tidak punya route koleksi
  `GET` di backend. Gunakan `/mapel/{id}/materi`, `/materi/{id}`, `/pengumpulan/saya`, `/pengumpulan/{id}`. Ditangani di Tahap 2.
- OpenAPI mencantumkan `GET /sanctum/csrf-cookie` (route bawaan Sanctum, tidak ada di `routes/api.php`) — wajar.
