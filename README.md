# Simba (LMS)

Frontend React + backend Laravel untuk LMS sekolah (peran Siswa, Guru, Admin). Repo ini hasil penggabungan beberapa zip (lihat `CATATAN-PENGGABUNGAN.md`).

| Folder | Isi | Status |
|---|---|---|
| `frontend-react-lms-simba/` | **Frontend utama** (React 19, Vite, Tailwind 4, React Router 7). Dua mode data: `mock` (simulasi) dan `api` (Laravel) | Dipakai & di-deploy |
| `backend-laravel-foundation/` | Overlay Laravel 12 (PHP 8.4, PostgreSQL, Sanctum SPA). **Bukan proyek Laravel utuh**; dirakit `apply.sh` | Dipakai & di-deploy |
| `Dockerfile`, `docker/`, `railway.toml` | Deploy Railway satu service (Laravel menyajikan API + build frontend) | Belum pernah dibuild di lingkungan penyusun |
| `docs/` | Laporan Tahap 2–4 | |
| `frontend-react-rpl/`, `frontend-ejs-prototype/` | Referensi desain (siswa / admin). Jangan diubah, tidak di-deploy | Referensi |
| `CLAUDE.md`, `bug.md` | Konteks kerja, status tahap, catatan bug backend | |

## Menjalankan frontend di lokal
Butuh **Node 20.19+ atau 22.12+** (`node -v`; disarankan 22, lihat `.nvmrc`). Dari folder ini:
```bash
npm run setup     # npm install (sekali; perlu internet)
npm run dev       # DEMO TANPA BACKEND (mode mock) → http://localhost:5173
```
Akun demo (data simulasi): `siswa / siswa123`, `guru / guru123`, `admin / admin123`. Data di memori, kembali ke awal saat reload.

Untuk memakai backend Laravel sungguhan: jalankan backend lalu `npm run dev:api` (mode API; proxy Vite `/api` dan `/sanctum` → `http://localhost:8000`).
**Tanpa backend, `dev:api` akan gagal login**; itu perilaku yang diharapkan.

Cek kualitas: `npm run verify` (lint + rute + tes + build).

## Deploy & data demo di Railway
Lihat `docs/TAHAP-4.md` dan `railway.env.example`. Database baru kosong; untuk mengisi data contoh set `SEED_DEMO=true` dan `SEED_DEFAULT_PASSWORD=<kata sandi kuat>`
(seeder dilewati bila tabel pengguna sudah berisi; hapus kedua variabel setelah data terbentuk). Admin pertama dibuat lewat `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Status jujur
Lihat `CLAUDE.md` (status per tahap). Singkatnya: frontend lulus tes di mode mock; koneksi ke backend sungguhan, image Docker, dan 12 tes backend yang masih gagal (`bug.md`) **belum terbukti**.
