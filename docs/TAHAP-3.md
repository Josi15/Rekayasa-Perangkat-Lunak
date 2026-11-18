# Tahap 3 — Laravel menyajikan frontend (laporan)

## Status pembuktian (jujur)
| Bagian | Status |
|---|---|
| Build frontend `VITE_USE_MOCK=false VITE_API_BASE_URL=/api/v1` + salin ke `public/` | **TERUJI**: `npm run verify` lulus (lint 0 error, check:routes OK, 63 tes lulus, build OK). `scripts/build-frontend.sh` dijalankan ke folder tiruan: `index.html` + `assets/` masuk, `index.php`/`.htaccess`/`robots.txt` tidak tersentuh. Bundel memuat `/api/v1` sebagai base. |
| Regex pengecualian route fallback | **TERUJI** terpisah di PHP 8.3 (26 kasus path: rute React lolos; `api`, `sanctum`, `storage`, `assets`, `up`, dotfile, path berekstensi tidak lolos) |
| Sintaks PHP (controller, config, route, tes) | **TERUJI** `php -l` |
| Route fallback + tes `SpaServingTest` di dalam aplikasi Laravel | **BELUM TERUJI**: Packagist diblokir di lingkungan ini, Laravel tidak bisa dipasang. Jalankan `php artisan test --filter=SpaServingTest` di mesin Anda (langkah di bawah). |
| Berkas privat tak bisa diakses lewat web | Rancangan + tes tertulis, **belum dijalankan** (lihat di atas) |

## File baru / diubah
Baru (semua dalam `backend-laravel-foundation/spa-layer/`, disalin `apply.sh`):
- `app/Http/Controllers/SpaController.php` — menyajikan `index.html` (`Cache-Control: no-cache`, `nosniff`, `X-Frame-Options`); 503 teks jelas bila belum dibuild.
- `config/spa.php` — `index_path` (default `public/index.html`, env `SPA_INDEX_PATH`, dipakai tes).
- `routes/web.php` — `GET /{any?}` → SpaController, tanpa middleware sesi/cookie/CSRF (halaman HTML tidak membuat sesi DB / Set-Cookie).
- `tests/Feature/SpaServingTest.php` — 22 kasus: rute React → HTML; `/api/*` tetap JSON 404; aset hilang/path berekstensi/dotfile bukan HTML; tidak ada cookie; 503 bila index hilang; berkas privat tidak keluar lewat 6 URL tebakan; disk materi/tugas di luar `public/`.
- `docs/TAHAP-3.md` (ini).
Baru di root: `scripts/build-frontend.sh <folder-laravel>`.
Diubah: `backend-laravel-foundation/apply.sh` (+1 baris `copy_tree spa-layer`). **`routes/web.php` bawaan Laravel akan dicadangkan sebagai `routes/web.php.bak`** (perilaku normal `apply.sh`). Frontend: tidak ada perubahan kode.

## Aturan fallback
Dilayani `index.html`: semua GET kecuali `api/*`, `sanctum/*`, `storage/*`, `assets/*`, `up`, path berawalan `.`, dan path yang diakhiri ekstensi (`.js`, `.pdf`, dst.). Yang dikecualikan memakai penanganan asli Laravel (404 JSON untuk API; 404 untuk aset hilang, sehingga tidak ada "HTML menyamar jadi JS").
Keterbatasan: rute React yang berakhir `.xxx` (mis. `/admin/users/john.doe`) tidak akan jatuh ke SPA. Rute frontend saat ini tidak ada yang begitu.

## Berkas privat
- Materi/tugas memakai disk `local` → `storage/app/private`, di luar `public/`, tidak ada symlink `storage:link` yang dibutuhkan (jangan dijalankan).
- Satu-satunya jalan keluar: `GET /api/v1/materi/{id}/file` dst. (ber-otorisasi, via sesi Sanctum).
- Catatan: disk `local` bawaan Laravel 12 punya `serve=true` (route `/storage/{path}` hanya untuk URL bertanda tangan; tanpa signature → 403). Aplikasi tidak membuat temporary URL, jadi tidak terpakai. Bila ingin dimatikan: `'serve' => false` di disk `local` pada `config/filesystems.php`.
- Pastikan web server (Tahap 4) hanya mengarah ke `public/` sebagai docroot.

## Uji manual (di mesin Anda)
```bash
cd backend-laravel-foundation && ./apply.sh ../simba-backend && cd ../simba-backend
php artisan test --filter=SpaServingTest            # harus hijau
cd .. && scripts/build-frontend.sh simba-backend
cd simba-backend && php artisan serve               # http://127.0.0.1:8000
```
1. Buka `/` lalu `/admin/users` dan tekan refresh (F5) → tetap halaman React (bukan 404).
2. `curl -i http://127.0.0.1:8000/api/v1/tidak-ada` → JSON 404 `{"code":"not_found"...}`.
3. `curl -i http://127.0.0.1:8000/assets/hilang.js` → 404 (bukan HTML).
4. Unggah materi lewat UI, lalu coba `curl -i http://127.0.0.1:8000/storage/app/private/materi/<nama>` dan `/materi/<nama>` → bukan 200 / bukan isi berkas.
5. `curl -i http://127.0.0.1:8000/login` → tidak ada header `Set-Cookie`.
6. Login lewat UI (satu origin, tanpa CORS) → `/auth/me` terbaca.

## Masalah tersisa
- Tes SPA belum pernah dijalankan; bila ada yang gagal karena perbedaan versi Laravel (nama kelas middleware), kirim hasilnya.
- 12 tes backend dari Tahap 1 (`bug.md`) masih terbuka; integrasi frontend↔backend sungguhan belum teruji.
- Bundel JS utama 560 kB + exceljs 929 kB (peringatan Vite; belum dipecah). Bukan blocker.
