// Peta resource frontend → endpoint Laravel (`/api/v1`, sumber: routes/api.php backend).
// Dipakai saat service mock diganti pemanggilan HTTP. Belum dipanggil oleh kode saat ini.
export const endpoints = {
  auth: { login: '/auth/login', logout: '/auth/logout', me: '/auth/me', forgot: '/auth/forgot-password', validateReset: '/auth/reset-password/validate', reset: '/auth/reset-password' },
  profile: '/profil',
  users: '/admin/pengguna', // + /{id}, /{id}/nonaktifkan, /{id}/aktifkan (khusus admin)
  classes: '/kelas', // + /{id}, /{id}/anggota, /{id}/arsipkan, /{id}/pulihkan
  subjects: '/mapel', // + /{id}, /{id}/guru, /{id}/arsipkan, /{id}/pulihkan
  materials: '/materi', // daftar per mapel: /mapel/{id}/materi
  assignments: '/tugas', // daftar per mapel: /mapel/{id}/tugas, tutup: /tugas/{id}/tutup
  submissions: '/pengumpulan', // /pengumpulan/saya, /tugas/{id}/pengumpulan
  grades: '/nilai', // /nilai/saya, /pengumpulan/{id}/nilai
  quizzes: '/kuis',
  schedules: '/jadwal', // /siswa/{id}/jadwal, /guru/{id}/jadwal
  attendance: '/presensi',
  announcements: '/pengumuman',
  dashboard: '/dashboard',
  health: '/health',
}
