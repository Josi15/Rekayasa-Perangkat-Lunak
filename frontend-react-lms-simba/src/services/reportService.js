import { request } from './http'
import { db, userName, className, subjectName, isLate } from './db'
import { attendance, statsOf } from './attendanceStore'
import { pick } from './mode'
import { reportApi } from './api/activityApi'

// Laporan DITURUNKAN dari db saat diminta (bukan data statis). Presensi memakai store presensi guru.
const roleOf = (r) => db.users.filter((u) => u.role === r).length
const graded = () => db.submissions.filter((s) => s.status === 'graded')

export const reportCatalog = [
  { id: 'users', name: 'Daftar pengguna', filename: 'pengguna.csv' },
  { id: 'classes', name: 'Rekap kelas', filename: 'kelas.csv' },
  { id: 'submissions', name: 'Pengumpulan tugas', filename: 'pengumpulan-tugas.csv' },
  { id: 'grades', name: 'Nilai tugas', filename: 'nilai-tugas.csv' },
]
const ROLE = { admin: 'Administrator', teacher: 'Guru', student: 'Siswa' }

const tables = {
  users: () => ({
    columns: [{ key: 'name', header: 'Nama' }, { key: 'username', header: 'Username' }, { key: 'email', header: 'Email' }, { key: 'role', header: 'Peran' }, { key: 'status', header: 'Status' }],
    rows: db.users.map((u) => ({ ...u, role: ROLE[u.role] })),
  }),
  classes: () => ({
    columns: [{ key: 'name', header: 'Kelas' }, { key: 'homeroom', header: 'Wali kelas' }, { key: 'size', header: 'Jumlah siswa' }, { key: 'enrolled', header: 'Terdaftar (demo)' }, { key: 'status', header: 'Status' }],
    rows: db.classes.map((c) => ({ ...c, homeroom: userName(c.homeroomId), enrolled: new Set(db.teachingClasses.filter((t) => t.classId === c.id).flatMap((t) => t.studentIds)).size })),
  }),
  submissions: () => ({
    columns: [{ key: 'student', header: 'Siswa' }, { key: 'assignment', header: 'Tugas' }, { key: 'className', header: 'Kelas' }, { key: 'status', header: 'Status' }, { key: 'late', header: 'Terlambat' }, { key: 'score', header: 'Nilai' }],
    rows: db.submissions.map((s) => {
      const a = db.assignments.find((x) => x.id === s.assignmentId)
      return { student: userName(s.studentId), assignment: a?.title ?? '-', className: className(a?.classId), status: s.status === 'graded' ? 'Sudah dinilai' : 'Belum dinilai', late: a && isLate(s, a) ? 'Ya' : 'Tidak', score: s.score ?? '' }
    }),
  }),
  grades: () => ({
    columns: [{ key: 'student', header: 'Siswa' }, { key: 'subject', header: 'Mapel' }, { key: 'assignment', header: 'Tugas' }, { key: 'score', header: 'Nilai' }],
    rows: graded().map((s) => { const a = db.assignments.find((x) => x.id === s.assignmentId); return { student: userName(s.studentId), subject: subjectName(a?.subjectId), assignment: a?.title ?? '-', score: s.score } }),
  }),
}

const mockReportService = {
  list: () => request(() => reportCatalog),
  summary: () => request(() => {
    const g = graded()
    const att = statsOf(attendance.records)
    return {
      users: { total: db.users.length, admin: roleOf('admin'), teacher: roleOf('teacher'), student: roleOf('student'), active: db.users.filter((u) => u.status === 'active').length },
      classes: db.classes.filter((c) => c.status === 'active').length,
      subjects: db.subjects.filter((s) => s.status === 'active').length,
      materials: { total: db.materials.length, published: db.materials.filter((m) => m.status === 'published').length },
      assignments: { total: db.assignments.length, published: db.assignments.filter((a) => a.status === 'published').length },
      submissions: { total: db.submissions.length, graded: g.length, pending: db.submissions.length - g.length, late: db.submissions.filter((s) => { const a = db.assignments.find((x) => x.id === s.assignmentId); return a && isLate(s, a) }).length },
      averageScore: g.length ? Math.round((g.reduce((s, x) => s + x.score, 0) / g.length) * 10) / 10 : null,
      attendance: { pct: att.pct, total: att.total },
    }
  }),
  table: (id) => request(() => {
    const meta = reportCatalog.find((r) => r.id === id)
    if (!meta) throw new Error('Laporan tidak ditemukan.')
    return { ...meta, ...tables[id]() }
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const reportService = pick(mockReportService, reportApi)
