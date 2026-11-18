# API Tugas & Pengumpulan (Backend 6)

Struktur database **tidak diubah** (tabel `tugas` dan `pengumpulan_tugas` dari ERD apa adanya).
Semua endpoint di bawah `/api/v1`, login + akun aktif. Path file penyimpanan tidak pernah dikirim ke klien.

## Tugas (dikelola guru pengampu mapel)
| Metode & path | Akses | Catatan |
|---|---|---|
| `GET /tugas?status=terbuka\|tertutup\|semua&id_mapel=&cari=&urut=&arah=` | semua peran | **tugas yang tersedia**: siswa = mapel yang diikuti lewat kelasnya; guru = mapel yang diampu; admin = semua. Siswa mendapat `pengumpulan_saya`, guru/admin `jumlah_pengumpulan` |
| `GET /mapel/{mapel}/tugas` | yang berhak melihat mapel | filter sama |
| `POST /mapel/{mapel}/tugas` (multipart/JSON: `judul`, `instruksi`, `batas_waktu`, `lampiran`?) | **guru pengampu** | `batas_waktu` ISO-8601 (mis. `2026-11-01T23:59:00+07:00`), harus di masa depan; mapel arsip → 409 |
| `GET /tugas/{id}` | admin, guru pengampu, siswa berhak | `status` = terbuka/tertutup, `menerima_pengumpulan` |
| `PATCH /tugas/{id}` (JSON) | guru pengampu | `judul`, `instruksi`, `batas_waktu` (di masa depan; ini juga cara **membuka kembali**); `lampiran`/`id_mapel` dilarang |
| `POST /tugas/{id}/tutup` | guru pengampu | menutup pengumpulan sekarang (idempotent); pengumpulan yang sudah masuk tidak berubah |
| `DELETE /tugas/{id}` | guru pengampu | 204; bila sudah ada pengumpulan → 409 `task_has_submissions` |
| `GET` / `POST` / `DELETE /tugas/{id}/lampiran` | unduh: yang berhak melihat; ganti/hapus: guru pengampu | |

## Pengumpulan
| Metode & path | Akses | Catatan |
|---|---|---|
| `POST /tugas/{id}/pengumpulan` (multipart: `file`) | siswa yang mengikuti mapel tugas | 201; sudah pernah → 409 `already_submitted` |
| `POST /tugas/{id}/pengumpulan/revisi` (multipart: `file`) | siswa pemilik | 200; ganti file |
| `GET /tugas/{id}/pengumpulan/saya` | siswa | status pengumpulan sendiri pada satu tugas (404 bila belum) |
| `GET /pengumpulan/saya?status=&urut=&arah=` | siswa | seluruh pengumpulan milik sendiri |
| `GET /tugas/{id}/pengumpulan?cari=&status=&urut=&arah=` | guru pengampu, admin | `cari` = username/NISN; `status`=dikumpulkan\|terlambat\|dinilai\|semua |
| `GET /pengumpulan/{id}` dan `/file` | pemilik, guru pengampu, admin | siswa lain → 403 |

## Aturan bisnis (eksplisit)
1. **Hanya siswa yang mengikuti mapel tugas** (anggota kelas yang berjadwal mapel itu) yang boleh mengumpulkan; selain itu 403.
   Guru dan admin tidak mengumpulkan.
2. **Satu pengumpulan per siswa per tugas** (unique ERD). POST kedua = 409; perubahan lewat **revisi** (baris yang sama diperbarui).
3. **Setelah tenggat — bawaan tegas:** pengumpulan dan revisi ditolak 409 `deadline_passed`. Dengan `TUGAS_TOLERANSI_JAM=N` (N>0)
   pengumpulan setelah `batas_waktu` tetapi dalam N jam diterima dengan status `terlambat`; sesudahnya ditolak.
4. **Revisi** diperbolehkan selama tugas masih menerima pengumpulan **dan** belum dinilai; setiap revisi mengganti file,
   memperbarui `waktu_kumpul`, dan menghitung ulang status. Sudah dinilai (status `dinilai` atau ada baris nilai) → 409 `already_graded`.
5. **Status & waktu konsisten:** `waktu_kumpul` = waktu server saat diterima; `status` = `terlambat` bila `waktu_kumpul > batas_waktu`,
   selain itu `dikumpulkan`. `id_siswa`, `status`, `waktu_kumpul` dari klien diabaikan. Status `dinilai` hanya diberikan proses
   penilaian (fase berikutnya). Mengubah/menutup deadline **tidak** menulis ulang status pengumpulan yang sudah ada.
6. **Akses jawaban:** siswa hanya melihat/mengunduh jawabannya sendiri; guru hanya pada tugas mapel yang diampunya; admin melihat.
7. Mapel yang diarsipkan: tugas tidak dapat dibuat/diubah dan tidak menerima pengumpulan (409 `subject_archived`).

## File
Laravel Storage, disk privat `TUGAS_DISK` (bawaan `local`, tanpa symlink publik); hanya keluar lewat endpoint unduh
(attachment, `nosniff`, `no-store`). Nama file dibuat server (UUID + ekstensi daftar putih); tipe diperiksa dari **isi** file terhadap
`config/tugas.php` (pdf, doc/docx, ppt/pptx, xls/xlsx, txt, png, jpg; SVG/HTML/ZIP/executable ditolak); ukuran maks 20 MB
(`TUGAS_LAMPIRAN_MAX_KB`, `TUGAS_JAWABAN_MAX_KB`). Kegagalan tulis → 503 `storage_failure` tanpa baris baru; DB gagal setelah
file tertulis → file dihapus; hapus file lama gagal → dicatat sebagai warning (file yatim). Selaraskan `upload_max_filesize` dan `post_max_size` PHP.

## Penyesuaian terhadap ERD (tanpa mengubah skema)
- **Menutup tugas** = memajukan `batas_waktu` ke sekarang (tabel `tugas` tidak punya kolom status). **Mengarsipkan tugas tidak disediakan**
  karena butuh kolom baru; bila diinginkan, usulan `tugas.diarsipkan_pada`.
- **Jawaban = satu file** (`jawaban_file` NOT NULL di ERD); jawaban teks tidak didukung tanpa kolom baru.
- Kewenangan guru mengikuti struktur ERD: guru pengampu **mapel** (bukan per kelas) melihat pengumpulan dari semua kelas yang berjadwal mapel itu.

## Menguji
```bash
php artisan test tests/Feature/Tugas
```
