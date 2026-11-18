# Matriks Akses LMS Simba

Sumber kebenaran: Policy di `app/Policies/*` dan middleware `role:` pada `routes/api.php`. Semua keputusan memakai peran & relasi dari **database**, bukan input klien. Semua endpoint (kecuali login/reset password/csrf-cookie) memerlukan sesi login + akun aktif; akun nonaktif → 401.

Legenda: ✔ boleh, ✖ ditolak (403), ◐ boleh sebatas data miliknya / mapel/kelas terkait.

| Sumber daya | Aksi | Admin | Guru | Siswa |
|---|---|---|---|---|
| Pengguna (`/admin/pengguna`) | lihat/buat/ubah/nonaktifkan/aktifkan | ✔ (tidak boleh menonaktifkan diri sendiri) | ✖ | ✖ |
| Profil (`/profil`) | lihat/ubah diri sendiri | ✔ | ✔ | ✔ |
| Kelas | lihat | ✔ semua | ◐ wali/pengajar | ◐ kelas yang diikuti |
| Kelas | buat/ubah/hapus/arsip/ganti wali | ✔ | ✖ | ✖ |
| Anggota kelas | lihat | ✔ | ◐ guru terkait kelas | ✖ |
| Anggota kelas | tambah/keluarkan | ✔ | ◐ hanya wali kelas itu | ✖ |
| Mapel | lihat | ✔ semua | ◐ yang diampu | ◐ pada kelasnya |
| Mapel | buat/ubah/hapus/ganti guru | ✔ | ✖ | ✖ |
| Materi | lihat/unduh | ✔ | ◐ mapel diampu | ◐ mapel diikuti |
| Materi | buat/ubah/hapus | ✖ | ◐ mapel diampu | ✖ |
| Tugas | lihat | ✔ | ◐ diampu | ◐ diikuti |
| Tugas | buat/ubah/hapus | ✖ | ◐ mapel diampu | ✖ |
| Pengumpulan | kirim/ubah (sebelum dinilai) | ✖ | ✖ | ◐ milik sendiri, mapel diikuti |
| Pengumpulan | lihat/unduh | ✔ | ◐ mapel diampu | ◐ milik sendiri |
| Kuis | lihat | ✔ | ◐ diampu | ◐ diikuti |
| Kuis | buat/ubah/hapus | ✖ | ◐ mapel diampu | ✖ |
| Nilai | lihat | ✔ (baca saja) | ◐ mapel diampu | ◐ milik sendiri |
| Nilai | beri/ubah/hapus | ✖ | ◐ mapel diampu | ✖ |
| Jadwal | lihat | ✔ semua | ◐ jadwal sendiri | ◐ kelas sendiri |
| Jadwal | buat/ubah/hapus | ✔ | ✖ | ✖ |
| Presensi | check-in | ✖ | ✖ | ◐ jadwal kelasnya, validasi waktu & lokasi |
| Presensi | lihat/rekap | ✔ | ◐ jadwal diajar | ◐ milik sendiri |
| Presensi | catat/koreksi | ✔ koreksi | ◐ jadwal diajar | ✖ |
| Pengumuman | lihat | ✔ | global + mapel diampu | global + mapel diikuti |
| Pengumuman | buat/ubah/hapus global | ✔ | ✖ | ✖ |
| Pengumuman | buat/ubah/hapus mapel | ✔ | ◐ mapel diampu | ✖ |
| Dashboard | `GET /dashboard` | ✔ ringkasan admin | ✔ ringkasan guru | ✔ ringkasan siswa (isi ditentukan peran dari sesi, bukan parameter) |

Catatan: baris ◐ adalah ringkasan; aturan persis ada di Policy. Bila ada ketidaksesuaian antara tabel ini dan kode, **kode yang berlaku** dan tabel ini harus dikoreksi. Tabel ini belum diverifikasi oleh test yang berjalan (lihat TEST-REPORT.md).
