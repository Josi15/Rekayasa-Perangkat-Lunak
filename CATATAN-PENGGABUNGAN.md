# Catatan penggabungan 3 zip

| Zip | Tanggal berkas terbaru | Peran dalam penggabungan |
|---|---|---|
| `simbaaaaa.zip` | 14 Nov 2026 | **Dasar** (terbaru; superset dari `simbaaaaa_2`, ejs-prototype lebih baru) |
| `simbaaaaa_2.zip` | 13 Nov 2026 | Identik dengan dasar di luar `frontend-ejs-prototype` → tidak ada yang unik |
| `simba.zip` | 11 Nov 2026 | Frontend paling lama (tanpa halaman admin/siswa Tahap 5), tapi punya riwayat git (6 commit Tahap 4) |

Yang diambil dari `simba.zip` (commit git terakhirnya, `42e5d3f`): opsi data demo `SEED_DEMO` pada `Dockerfile`, `docker/start.sh`, dan `railway.env.example`.
Berkas-berkas ini hilang di dua zip lain padahal `CLAUDE.md` menyebutnya sudah ada.
Tidak disertakan: folder `.git` dari `simba.zip` (riwayatnya milik state lama), dan `frontend-ejs-prototype/node_modules`.

Perubahan kode setelah penggabungan: `AdminDashboard.jsx` baris grid diberi `grid-cols-1` (memperbaiki overflow horizontal di ponsel).

## Perapian setelah penggabungan
Dashboard admin: overflow ponsel, identitas ganda, dan jam `07:30 - …` diperbaiki. Ditambah `npm run dev:mock` (demo tanpa backend), `engines`/`.nvmrc`, dan README/CLAUDE.md yang disesuaikan dengan kode. Dua impor tak terpakai dihapus.
