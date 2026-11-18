// Data simulasi. Ganti dengan respons API Laravel pada fase berikutnya.
export const users = [
  { id: 1, name: 'Siti Aminah', email: 'siswa@simba.test', username: 'siswa', role: 'student', status: 'active' },
  { id: 2, name: 'Budi Santoso', email: 'guru@simba.test', username: 'guru', role: 'teacher', status: 'active' },
  { id: 3, name: 'Admin Simba', email: 'admin@simba.test', username: 'admin', role: 'admin', status: 'active' },
]
export const classes = [
  { id: 1, name: 'X IPA 1', homeroom: 'Budi Santoso', students: 32, status: 'active' },
  { id: 2, name: 'X IPS 2', homeroom: 'Rina Wulandari', students: 30, status: 'active' },
  { id: 3, name: 'XI IPA 1', homeroom: 'Agus Salim', students: 28, status: 'active' },
  { id: 4, name: 'XII IPA 2', homeroom: 'Dewi Lestari', students: 26, status: 'inactive' },
]
export const subjects = [
  { id: 1, name: 'Matematika', code: 'MTK' },
  { id: 2, name: 'Bahasa Indonesia', code: 'BIN' },
  { id: 3, name: 'Fisika', code: 'FIS' },
]
export const assignments = [
  { id: 1, title: 'Latihan Persamaan Kuadrat', subjectId: 1, dueDate: '2026-10-20', status: 'open' },
  { id: 2, title: 'Esai Teks Eksposisi', subjectId: 2, dueDate: '2026-10-18', status: 'closed' },
  { id: 3, title: 'Laporan Praktikum Gerak', subjectId: 3, dueDate: '2026-10-25', status: 'open' },
]
export const submissions = [
  { id: 1, assignmentId: 1, studentId: 1, submittedAt: '2026-10-14', status: 'submitted' },
]
export const grades = [
  { id: 1, studentId: 1, subjectId: 1, score: 88 },
  { id: 2, studentId: 1, subjectId: 2, score: 92 },
]
export const schedules = [
  { id: 1, day: 'Senin', time: '07:00 - 08:30', subjectId: 1, classId: 1 },
  { id: 2, day: 'Selasa', time: '09:00 - 10:30', subjectId: 3, classId: 1 },
]
export const announcements = [
  { id: 1, title: 'Ujian Tengah Semester', date: '2026-10-22', status: 'published' },
  { id: 2, title: 'Libur Nasional', date: '2026-10-28', status: 'draft' },
]
export const reports = [
  { id: 1, name: 'Rekap Kehadiran Oktober', period: '2026-10', status: 'ready' },
]
export const settings = [{ id: 1, schoolName: 'SMA Simba', academicYear: '2026/2027' }]
