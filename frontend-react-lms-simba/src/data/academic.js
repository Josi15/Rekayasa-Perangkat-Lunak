// Seed akademik bersama (kelas, mapel, jadwal, pengumuman, pengaturan). Dimuat ke db.js,
// lalu SEMUA halaman membaca/menulis lewat service → satu sumber data.
export const classes = [
  { id: 1, name: 'X IPA 1', homeroomId: 2, size: 32, status: 'active' },
  { id: 2, name: 'X IPS 2', homeroomId: 5, size: 30, status: 'active' },
  { id: 3, name: 'XI IPA 1', homeroomId: 2, size: 34, status: 'active' },
]
export const subjects = [
  { id: 1, name: 'Matematika', code: 'MTK', teacherId: 2, status: 'active' },
  { id: 2, name: 'Bahasa Indonesia', code: 'BIN', teacherId: 5, status: 'active' },
  { id: 3, name: 'Fisika', code: 'FIS', teacherId: 2, status: 'active' },
]
export const schedules = [
  { id: 1, dayIndex: 4, day: 'Kamis', time: '13:00', classId: 1, subjectId: 1, teacherId: 2, room: 'R. 101' },
  { id: 2, dayIndex: 5, day: 'Jumat', time: '08:00', classId: 2, subjectId: 1, teacherId: 2, room: 'R. 102' },
  { id: 3, dayIndex: 1, day: 'Senin', time: '07:30', classId: 1, subjectId: 1, teacherId: 2, room: 'R. 101' },
  { id: 4, dayIndex: 2, day: 'Selasa', time: '09:30', classId: 1, subjectId: 2, teacherId: 5, room: 'R. 101' },
  { id: 5, dayIndex: 3, day: 'Rabu', time: '07:30', classId: 2, subjectId: 2, teacherId: 5, room: 'R. 102' },
]
export const announcements = [
  { id: 1, title: 'Ujian Tengah Semester', category: 'Akademik', audience: 'all', status: 'published', author: 'Tata Usaha', createdAt: '2026-10-12', body: 'UTS dimulai 26 Oktober 2026. Jadwal lengkap dibagikan melalui wali kelas.' },
  { id: 2, title: 'Pemeliharaan Sistem', category: 'Umum', audience: 'all', status: 'published', author: 'Admin Simba', createdAt: '2026-10-10', body: 'Akses LMS terbatas Sabtu malam pukul 22.00–24.00.' },
  { id: 3, title: 'Rapat Dewan Guru', category: 'Internal', audience: 'teacher', status: 'published', author: 'Kepala Sekolah', createdAt: '2026-10-14', body: 'Rapat evaluasi pembelajaran pukul 14.00 di ruang guru.' },
  { id: 4, title: 'Lomba Karya Tulis Ilmiah', category: 'Kegiatan', audience: 'student', status: 'draft', author: 'Kesiswaan', createdAt: '2026-10-15', body: 'Pendaftaran dibuka hingga akhir bulan.' },
]
export const settings = { schoolName: 'SMA Simba', academicYear: '2026/2027', semester: 'Ganjil' }
