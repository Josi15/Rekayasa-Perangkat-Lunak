# LMS Simba — Frontend

React 19 · React Router 7 · Tailwind CSS 4 · Vite 8 · Lucide React · ExcelJS (ekspor leger) · Vitest + Testing Library + jsdom · oxlint.
Peran: **Siswa**, **Guru**, **Admin**. Dua mode data yang dipilih lewat `VITE_USE_MOCK`.

## Menjalankan
Node **20.19+ atau 22.12+** (disarankan 22; `.nvmrc`).
```bash
npm install
npm run dev:mock      # DEMO tanpa backend (data simulasi)         → http://localhost:5173
npm run dev           # mode API: butuh backend Laravel di :8000 (proxy Vite /api & /sanctum)
npm run build         # produksi (di Docker dipaksa VITE_USE_MOCK=false VITE_API_BASE_URL=/api/v1)
npm run build:mock    # build demo mock
npm run lint          # oxlint
npm test              # vitest run (selalu mode mock; tes mode API memakai fetch stub)
npm run check:routes  # pemeriksa statis menu/rute/tautan (tanpa dependensi)
npm run verify        # lint + check:routes + test + build
```
`npm run dev` tanpa backend akan gagal login (mode API). Untuk demo pakai `dev:mock`.

## Environment (`.env.example`, `.env.mock`)
| Variabel | Arti |
|---|---|
| `VITE_USE_MOCK` | `true` = data simulasi di memori; selain itu = API Laravel |
| `VITE_API_BASE_URL` | Base URL API; disarankan relatif `/api/v1` (satu origin) |
| `VITE_DEV_PROXY_TARGET` | Hanya dev: alamat Laravel untuk proxy (default `http://localhost:8000`) |
| `VITE_MOCK_DELAY_MS` | Jeda simulasi jaringan mode mock (default 300) |

Semua `VITE_*` publik (terlihat di bundle): jangan taruh rahasia.

## Akun demo (hanya mode mock)
`siswa / siswa123`, `guru / guru123`, `admin / admin123` (tombol isi-otomatis di halaman login; sengaja publik, bukan akun sungguhan).
Data hidup di memori dan kembali ke awal saat halaman dimuat ulang. Di mode API, akun berasal dari database backend.

## Rute
| Area | Rute |
|---|---|
| Publik | `/login`, `/forgot-password`, `/403`, `*` (404) |
| Siswa `/student` | `dashboard`, `subjects`, `materials`, `materials/:id`, `assignments`, `assignments/:id`, `grades`, `schedule`, `announcements`, `announcements/:id` |
| Guru `/teacher` | `dashboard`, `classes`, `classes/:id`, `materials` (+`new`, `:id`, `:id/edit`), `assignments` (+`manage`, `new`, `:id`, `:id/edit`), `grading`, `grading/recap`, `schedule`, `attendance`, `quiz`, `profile` |
| Admin `/admin` | `dashboard`, `users`, `classes`, `subjects`, `schedule`, `materials`, `assignments`, `quiz`, `attendance`, `announcements`, `reports`, `settings` |

Menu sidebar bersumber dari `src/routes/navigation.js`. `ProtectedRoute` mengarahkan peran yang salah ke `/403`. **Itu hanya UX**: otorisasi sebenarnya ada di backend (Sanctum + policy); lihat `backend-laravel-foundation/finalisasi-layer/docs/ACCESS-MATRIX.md`.

## Arsitektur data
Halaman hanya mengimpor dari `src/services` (tidak dari `data/` atau `db.js`).
- `services/mode.js`: `pick(mock, api)` memilih implementasi per service; keduanya harus mengembalikan bentuk data yang sama.
- Mode mock: `services/db.js` (satu sumber data simulasi di memori) + service per domain (users, classes, subjects, materials, assignments, submissions, grades, schedules, announcements, reports, settings, …).
- Mode API: `services/api/*` (adaptasi kontrak backend) di atas `apiRequest` di `services/http.js` (Sanctum SPA: cookie + CSRF, tanpa token di JavaScript); peta endpoint di `services/endpoints.js`.
- Fitur tanpa endpoint backend memakai `unsupported(...)`: menampilkan pesan jelas, bukan data palsu. Daftar lengkap: `../docs/TAHAP-2.md`.

## Status
Rincian per tahap (1–5) ada di `../CLAUDE.md`. Ringkas:
- Mode mock: halaman Siswa, Guru, Admin tersedia dan lulus tes (85 tes tercatat pada Tahap 5C).
- Mode API: kode tersambung, **belum diuji terhadap backend sungguhan**.
- Belum ada: profil siswa/admin, notifikasi, progres materi, dan fitur lain yang tidak punya endpoint (lihat `CLAUDE.md` Tahap 5).

## Verifikasi pada sesi perapian terakhir
Lingkungan itu tidak punya akses npm, jadi `npm install`, `npm run build`, `npm run lint`, dan `npm test` **tidak dijalankan**. Yang dijalankan: bundling esbuild seluruh aplikasi, `check:routes` (48 rute, 120 tautan), `tsc --checkJs` (tanpa identifier tak terdefinisi), pencarian impor tak terpakai, dan uji klik di Chromium (build mock dengan router/ikon pengganti): seluruh menu 3 peran tampil tanpa error JS, tanpa overflow horizontal di 390px dan 768px.
