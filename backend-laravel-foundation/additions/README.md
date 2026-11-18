# LMS Simba — Backend API

REST API Laravel 12 (PHP 8.4, PostgreSQL) untuk Learning Management System LMS Simba.
Hanya backend; tidak ada frontend di repositori ini.

> Status: fondasi (Backend 1). Fitur domain (auth, kursus, dst.) menyusul di Backend 2+ mengikuti ERD LMS Simba.

## Prasyarat
- Laravel Herd (PHP 8.4), Composer 2, PostgreSQL 14+, Git

## Instalasi
```bash
composer install
cp .env.example .env
php artisan key:generate
```
Buat database `lms_simba` di PostgreSQL, lalu isi `DB_USERNAME` dan `DB_PASSWORD` di `.env`
(file `.env` sudah di-ignore Git; jangan commit credential).
```bash
php artisan migrate
```

## Menjalankan lewat Herd
Letakkan/link folder proyek ke Herd (`herd link lms-simba` atau taruh di `~/Herd`).
API tersedia di `http://lms-simba.test/api/v1/health`. Tanpa Herd: `php artisan serve`.

## Menjalankan test
```bash
php artisan test
```
Test memakai `phpunit.xml` dari layer database (PostgreSQL, database terpisah `lms_simba_test`; buat dulu dengan `createdb lms_simba_test`). `DatabaseTestCase` menolak berjalan bila nama database tidak berakhiran `_test`, karena `RefreshDatabase` menjalankan `migrate:fresh`.

## Dokumentasi lain
- Database & ERD: `docs/DATABASE.md`
- Autentikasi, role, cara uji login & reset password: `docs/AUTH.md`
- API pengguna, kelas, keanggotaan, mata pelajaran: `docs/API-MASTER.md`
- API materi & penyimpanan file: `docs/API-MATERI.md`
- API tugas & pengumpulan: `docs/API-TUGAS.md`
- API kuis & nilai: `docs/API-KUIS-NILAI.md`
- API pengumuman & dashboard: `docs/API-PENGUMUMAN-DASHBOARD.md`
- API jadwal & presensi (validasi lokasi): `docs/API-JADWAL-PRESENSI.md`
- Finalisasi (Backend 10): `docs/SETUP.md`, `API-REFERENCE.md`, `openapi.yaml`, `ACCESS-MATRIX.md`, `SECURITY-AUDIT.md`, `DEPLOYMENT.md`, `FRONTEND-INTEGRATION.md`, `TEST-REPORT.md`

## Konvensi API
- Semua endpoint di bawah `/api/v1`, respons JSON.
- Sukses: `{ "data": ... }`; daftar data memakai Laravel Resource Collection (`data`, `links`, `meta`).
- Error: `{ "message", "code", "errors"?, "request_id" }` dengan status 401/403/404/405/422/429/500.
- Pagination: `?page=` dan `?per_page=` (default 15, maks 100) via `App\Http\Requests\Api\PaginationRequest`.
- Setiap respons membawa `X-Request-Id`, juga tercatat di log.

## Environment penting
| Variabel | Fungsi |
|---|---|
| `DB_*` | Koneksi PostgreSQL |
| `LOG_STACK`, `LOG_LEVEL` | Channel & level log (default `daily`, `debug`) |
| `CORS_ALLOWED_ORIGINS` | Origin frontend, dipisah koma |
| `CORS_SUPPORTS_CREDENTIALS` | `true` hanya jika perlu cookie lintas-origin |
| `API_DEFAULT_PER_PAGE`, `API_MAX_PER_PAGE`, `API_RATE_LIMIT` | Pagination & rate limit |

Di produksi: `APP_ENV=production`, `APP_DEBUG=false`, batasi `CORS_ALLOWED_ORIGINS` ke domain frontend.

## Struktur
`app/Http/Controllers/Api/V1`, `app/Http/Requests/Api`, `app/Http/Resources`, `app/Policies`, `app/Services`, `app/Support/ApiResponse.php`, `app/Exceptions/ApiExceptionRenderer.php`, `routes/api.php`, `config/api.php`, `config/cors.php`, `tests/Feature/Api`.

## Status verifikasi
Kode fondasi ini ditulis tetapi **belum dijalankan** (lihat catatan serah terima). Jalankan `php artisan test` untuk memverifikasi sebelum lanjut ke Backend 2.
