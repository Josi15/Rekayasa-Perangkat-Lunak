# Tahap 2 — Frontend tersambung ke API (laporan)

Lingkungan: Node 22, npm 10. **Tidak ada PHP/PostgreSQL di lingkungan ini → backend TIDAK dijalankan.** Seluruh bukti di bawah berasal dari
`npm run verify` dan tes dengan `fetch` stub yang bentuk datanya mengikuti Resource/FormRequest backend. Integrasi ke backend sungguhan belum teruji
(langkah uji manual di bagian akhir).

## Hasil perintah
| Perintah | Hasil |
|---|---|
| `npm run lint` | 0 error, 15 peringatan (sama dengan baseline sebelum Tahap 2) |
| `npm run check:routes` | OK (42 rute, 104 tautan) |
| `npm test` | **12 file, 63 tes lulus** (baseline sebelum perubahan: 40 lulus + 1 gagal; lihat "Tes yang sudah gagal") |
| `npm run build` | berhasil |

Tes baru: `src/test/api.test.js` (18 tes lapisan API) dan `src/test/auth-live.test.jsx` (4 tes UI mode API: pemulihan sesi dari `/auth/me`, 401, peran salah, 401 di tengah sesi).

### Tes yang sudah gagal sebelum Tahap 2
`roles.test.jsx › admin menambah pengguna…` gagal pada baseline (sebelum saya mengubah apa pun). Penyebab: setelah simpan, halaman memuat ulang dan
tabel sempat hilang, tetapi tes memakai `getByLabelText` sinkron. Perbaikan HANYA di tes: `await screen.findByLabelText(...)`.

## Arsitektur
- `VITE_USE_MOCK=true` → service lama (data simulasi di memori). Selain itu → API. Dipilih per service lewat `pick(mock, api)` (`services/mode.js`).
  Vitest selalu mock (`vitest.config.js`). Kode mock lama tidak diubah, hanya dibungkus (`const mockXService = {…}` + `export const xService = pick(…)`).
- `services/api/`: `adapt.js` (mapper murni), `catalog.js` (relasi mapel↔kelas↔guru dari `/mapel`,`/jadwal`,`/kelas`),
  `authApi.js`, `masterApi.js` (pengguna/kelas/mapel), `contentApi.js` (materi/tugas/pengumpulan/nilai + fasad guru & siswa),
  `activityApi.js` (jadwal/pengumuman/profil/laporan/presensi/kuis), `teacherViewApi.js` (dashboard & matriks jadwal guru).
- `services/http.js` (diperluas): multipart (`FormData`), `fetchAll` (ikuti paginasi `meta.last_page`, per_page=100), `apiDownload`/`saveBlob`,
  pesan error per status (401/403/409/419/422/429/5xx/jaringan putus), `onUnauthorized` (401 → sesi dikosongkan → `/login`), `quiet401` untuk `/auth/me` & login.
- Sesi: tidak ada localStorage di mode API. `AuthContext` memulihkan user dari `GET /auth/me` (`loading` sampai selesai); `ProtectedRoute` menunggu `loading`.
- Dev: `vite.config.js` mem-proxy `/api` & `/sanctum` ke Laravel (`VITE_DEV_PROXY_TARGET`) → satu origin seperti produksi.

## Perubahan per file (frontend-react-lms-simba)
**Baru:** `src/services/mode.js`, `src/services/api/{adapt,catalog,authApi,masterApi,contentApi,activityApi,teacherViewApi}.js`,
`src/components/common/DownloadButton.jsx`, `src/pages/auth/ResetPasswordPage.jsx`, `src/test/{api.test.js,auth-live.test.jsx}`.

**Service dibungkus `pick` (isi mock tidak diubah):** auth, user, class, subject, material, assignment, submission, grade, schedule, announcement,
report, setting, teacher, teacherAssignment, student, profile, teacherHome, teacherSchedule, attendance, quiz, ledger (`src/services/*Service.js`).

**Diubah:** `services/http.js`, `services/index.js` (ekspor `serviceMode`, `onUnauthorized`, `ApiError`, `fileService`), `config/env.js` (`useMock`),
`contexts/AuthContext.jsx`, `contexts/ToastContext.jsx` (buang label "(simulasi…)" di mode API), `routes/ProtectedRoute.jsx`, `routes/index.jsx` (+`/reset-password`),
`scripts/check-routes.mjs` (+`/reset-password`), `data/teacherHome.js` (+`applyTeacherContext`), `vite.config.js`, `vitest.config.js`, `.env.example`, `test/roles.test.jsx` (perbaikan tes).

**Halaman/komponen (perubahan fungsional kecil, tanpa ubah desain):**
- `AttachmentPicker.jsx`: menyimpan objek `File` asli (`{name,size,file}`) agar bisa diunggah; teks "Simulasi" hanya di mode mock; `formatSize(0)` → kosong.
- `AdminUsersPage.jsx`: mode API menambah field NISN & NIP (backend mewajibkan NISN untuk siswa, NIP untuk guru) dan hint kata sandi sesuai aturan backend.
- `AdminClassesPage.jsx` (field "Jumlah siswa"), `AdminSubjectsPage.jsx` (field "Kode"), `AdminAnnouncementsPage.jsx` (field Kategori & Sasaran): disembunyikan di mode API (tidak ada di backend).
- `LoginPage.jsx` (blok akun demo) & `DemoBanner.jsx`: hanya mode mock. `ForgotPasswordPage.jsx`: pesan sesuai mode + tangani error. 
- Tombol **Unduh** (`DownloadButton`, hanya mode API): `StudentMaterialDetailPage`, `MaterialDetailPage`, `GradeDialog`, `AssignmentDetailPage`, `StudentAssignmentDetailPage`.
- `PasswordModal.jsx` (hasil `simulated:false` → pesan sukses nyata), `HomeroomPanel.jsx` (hindari "NaN%" bila bukan wali kelas).

## Pemetaan kontrak (halaman ↔ backend)
| Frontend | Backend | Catatan adaptasi |
|---|---|---|
| role `student/teacher/admin` | `peran` `siswa/guru/admin` | dipetakan dua arah |
| status `active/inactive/pending` | `aktif` boolean | `pending` = nonaktif; ubah status → `/aktifkan` & `/nonaktifkan` |
| `name` | — (tidak ada) | **diturunkan** dari username → NISN → NIP → email |
| kelas `size` | `jumlah_siswa` (hitungan anggota) | read-only |
| mapel `code` | — | singkatan dari nama (tampilan saja) |
| materi per kelas, draft, urutan | materi per **mapel**, 1 berkas, selalu terbit | mapel dicari dari jadwal kelas yang dipilih; materi teks → `.txt`; urutan tidak didukung |
| tugas per kelas, draft/archived | tugas per **mapel**; `terbuka/tertutup` | `archived` = `POST /tugas/{id}/tutup`; draft ditolak (422 jelas); buka kembali tidak didukung |
| pengumpulan (teks/lampiran) | 1 berkas `file` | teks → `jawaban.txt`; >1 berkas ditolak |
| skor/feedback di pengumpulan | resource `/nilai` terpisah | digabung lewat `id_pengumpulan`; ubah nilai = `PATCH /nilai/{id}` |
| jadwal mingguan | sesi bertanggal | sesi berulang dilipat per hari+jam+kelas+mapel |
| pengumuman audience/kategori/draft | `cakupan` global/mapel | admin selalu `global`; draft ditolak |

## Belum didukung backend (mode API menampilkan pesan jelas, bukan data palsu)
Pengaturan sekolah (admin), Leger nilai, status/sinkronisasi/token kuis (hanya tautan Google Form yang disimpan), catatan presensi & buka/tutup sesi presensi
(jendela check-in otomatis dari waktu jadwal), ubah profil (nama/telepon/alamat/foto/2FA/sesi lain; hanya email & kata sandi, email butuh kata sandi saat ini),
urut materi, draft tugas/pengumuman, buka ulang tugas, ganti peran pengguna. Ruang lab di matriks jadwal kosong. Total materi di laporan admin = 0 (tidak ada agregat).

## Keterbatasan / hal yang perlu keputusan Anda
1. **Backend tidak punya nama lengkap** → seluruh UI menampilkan username/NISN/NIP. Rekomendasi: tambah kolom `nama` (migrasi + Resource + FormRequest).
2. Teks statis demo di beberapa halaman masih ada (mis. paragraf "versi simulasi" di Profil guru, judul modal "Ubah Kata Sandi (simulasi)").
3. Beberapa halaman guru memanggil beberapa endpoint per kelas/tugas (N+1) — aman untuk skala sekolah, bisa dioptimalkan dengan endpoint agregat.
4. Mapel ambigu: bila guru mengajar >1 mapel di kelas yang sama, tugas/materi baru memakai mapel pertama.
5. `GET /dashboard` guru tidak memuat rerata presensi; "Rerata Presensi Kelas" dihitung dari presensi hari ini kelas binaan.

## Uji manual (butuh backend jalan)
1. Backend: `php artisan serve` (+ `migrate --seed`), `.env` frontend: `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=/api/v1`; `npm run dev` (proxy → :8000).
   `SANCTUM_STATEFUL_DOMAINS` harus memuat `localhost:5173`.
2. Login admin → buat guru (NIP 18 digit) & siswa (NISN 10 digit) → buat kelas, mapel; (jadwal belum ada UI admin: buat lewat API/tinker).
3. Guru: unggah materi PDF → siswa: unduh. Guru buat tugas → siswa kirim → guru beri nilai → siswa lihat nilai.
4. Login salah (pesan 422), 6× salah (429), logout, refresh (sesi tetap), hapus cookie lalu aksi apa pun (→ /login).
