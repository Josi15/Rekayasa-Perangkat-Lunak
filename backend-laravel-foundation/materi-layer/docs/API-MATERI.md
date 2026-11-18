# API Materi (Backend 5)

Tabel `materi` memakai kolom ERD apa adanya: `id_materi`, `judul`, `file`, `id_mapel` (+ timestamp).
**Tidak ada perubahan skema.** Kolom `file` berisi path relatif pada disk privat
(`materi/{id_mapel}/{uuid}.{ext}`) dan tidak pernah dikirim ke klien.

## Endpoint (`/api/v1`, login + akun aktif)
| Metode & path | Akses | Hasil |
|---|---|---|
| `GET /mapel/{mapel}/materi?cari=&urut=&arah=&page=&per_page=` | admin, guru pengampu, siswa yang kelasnya berjadwal mapel itu | 200 terpaginasi; `urut`=id_materi\|judul\|created_at |
| `POST /mapel/{mapel}/materi` (multipart: `judul`, `file`) | **guru pengampu mapel itu** | 201 · 422 · 403 · 409 `subject_archived` · 503 `storage_failure` |
| `GET /materi/{materi}` | admin, guru pengampu, siswa berhak | 200 |
| `PATCH /materi/{materi}` (JSON `{judul}`) | guru pengampu | 200; `file`/`id_mapel` dilarang (422) |
| `POST /materi/{materi}/file` (multipart: `file`) | guru pengampu | mengganti file; file lama dihapus setelah commit |
| `DELETE /materi/{materi}` | guru pengampu | 204; baris dan file dihapus |
| `GET /materi/{materi}/file` | sama dengan melihat materi | unduhan (attachment) · 404 bila file hilang |

Respons materi: `id_materi, judul, id_mapel, mapel{id_mapel,nama_mapel}?, ekstensi, tipe, url_file, created_at, updated_at`.

## Keputusan desain
- **Hapus, bukan arsip.** Mengarsipkan butuh kolom baru; materi tidak dirujuk tabel lain, jadi dihapus permanen
  (baris + file). Bila Anda ingin arsip, saya usulkan `materi.diarsipkan_pada` (seperti kelas/mapel).
- **Tanpa deskripsi/urutan**: tidak ditambahkan; usulkan `deskripsi` (text nullable) dan `urutan` (int) bila dibutuhkan.
- **Admin hanya melihat/mengunduh** (kebijakan Backend 3: materi wewenang guru pengampu). Mengelola materi pada
  mapel yang diarsipkan ditolak 409; menghapus tetap boleh.
- Nama file asli tidak disimpan (kolom ERD hanya satu); nama unduhan dibuat dari judul (`bab-1-pengantar.pdf`).

## Keamanan file
- Laravel Storage, disk `MATERI_DISK` (bawaan `local` = privat, tanpa symlink `public/storage`). Jangan arahkan ke `public`.
  File hanya keluar lewat `GET /materi/{id}/file` setelah Policy: `attachment`, `Content-Type` dari ekstensi tersimpan,
  `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`, CSP `sandbox`.
- Nama file dibuat server (UUID + ekstensi daftar putih); nama dari pengguna diabaikan (anti path traversal).
- Tipe diperiksa dari **isi** file (deteksi MIME server) terhadap daftar putih `config/materi.php`
  (pdf, doc/docx, ppt/pptx, xls/xlsx, txt, png, jpg). SVG, HTML, ZIP, executable ditolak. Ukuran maks `MATERI_MAX_KB` (20480 KB).
- Kegagalan: tulis gagal → 503 `storage_failure` (detail hanya di log) dan tidak ada baris baru; DB gagal setelah file
  tertulis → file dihapus; hapus file gagal → dicatat sebagai warning (file yatim), baris tetap terhapus.
- Batas PHP: `upload_max_filesize` dan `post_max_size` harus ≥ `MATERI_MAX_KB`; melebihi batas PHP menghasilkan 422/413.

## Menguji
```bash
php artisan test tests/Feature/Materi
```
