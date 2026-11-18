# Setup LMS Simba Backend (pengembangan)

Prasyarat: PHP 8.4, Composer, PostgreSQL 16+, Laravel Herd (opsional, hanya untuk pengembangan lokal), Git Bash/WSL untuk `apply.sh`.

## 1. Pasang proyek
```bash
./apply.sh ~/Herd/lms-simba     # composer create-project + sanctum + salin semua layer (file lama dicadangkan *.bak)
cd ~/Herd/lms-simba
cp .env.example .env
php artisan key:generate
```

## 2. PostgreSQL (dua database terpisah)
```sql
CREATE ROLE simba_app LOGIN PASSWORD '<password-anda>';
CREATE DATABASE lms_simba      OWNER simba_app;   -- pengembangan
CREATE DATABASE lms_simba_test OWNER simba_app;   -- khusus test
```
Isi `DB_USERNAME` dan `DB_PASSWORD` di `.env` (jangan di-commit). Untuk test, boleh buat `.env.testing` berisi kredensial yang sama; `phpunit.xml` memaksa `DB_DATABASE=lms_simba_test`.
Koneksi pgAdmin: host 127.0.0.1, port 5432, database `lms_simba`, user sesuai di atas.

## 3. Migration & seeder
```bash
php artisan migrate
php artisan db:seed          # 1 admin, 5 guru, 30 siswa + data contoh
```
Password akun demo diambil dari `SEED_DEFAULT_PASSWORD`; bila kosong dibuat acak dan ditampilkan sekali. Admin demo: username `admin`. Jangan memakai seeder di produksi.
`php artisan migrate:fresh` **menghapus seluruh data**: jangan dijalankan pada database yang berisi data tanpa persetujuan eksplisit.

## 4. Menjalankan
Herd menyajikan `http://lms-simba.test`. Atau `php artisan serve`. Atur `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` ke alamat frontend React (mis. `localhost:5173`).

## 5. Menjalankan test
```bash
php artisan test
```
Test memakai trait `DatabaseTestCase` yang **menolak berjalan** bila nama database tidak berakhiran `_test`, sehingga data pengembangan/produksi tidak tersentuh. Pastikan `lms_simba_test` sudah ada; migration dijalankan otomatis pada database test itu saja.
> Catatan jujur: seluruh test belum pernah dijalankan oleh penulis (lingkungan tanpa akses Packagist). Harapkan beberapa kegagalan pada eksekusi pertama; lihat TEST-REPORT.md.

## 6. Dokumentasi API
`docs/API-REFERENCE.md`, `docs/openapi.yaml` (impor ke Swagger UI/Postman), serta dokumen per modul `API-*.md`.
