// Data simulasi statis untuk Dashboard Guru (belum punya sumber di store bersama).
// academicYear dibaca dari Pengaturan (db.settings) lewat getter, sehingga perubahan admin ikut tampil.
import { db } from '../services/db'

export const teacherHome = {
  get academicYear() { return `${db.settings.academicYear} ${db.settings.semester}` },
  nip: '19820412 200501 2 004',
  subject: 'Matematika',
  workload: { jp: 28, target: 24, percent: 100 },
  attendance: { average: 96.8, classes: 6 },
  homeroom: { classId: 1, name: 'X IPA 1', total: 32, present: 30, permit: 1, sick: 1, note: 'Rafi Ahmad (Sakit - Surat Dokter Terlampir)' },
  session: { title: 'Matematika X IPA 1', period: 'Jam ke 3-4 (08:30 - 10:00 WIB)', room: 'R. 101', topic: 'Fungsi Kuadrat & Grafik Parabola', remaining: '45 menit', progress: 50, clock: '09:15 WIB' },
  agenda: [
    { id: 1, time: '08:30 - 10:00', className: 'X IPA 1', topic: 'Fungsi Kuadrat & Grafik Parabola', room: 'R. 101', status: 'running' },
    { id: 2, time: '10:15 - 11:45', className: 'X IPS 2', topic: 'Persamaan Linear Satu Variabel', room: 'R. 102', status: 'upcoming' },
    { id: 3, time: '13:00 - 14:30', className: 'XI IPA 1', topic: 'Trigonometri Dasar', room: 'R. 201', status: 'upcoming' },
  ],
}

// Mode API: ganti teks statis demo (mapel, wali kelas, NIP, tahun ajaran) dengan konteks guru dari backend.
// Dipanggil AuthContext sebelum halaman guru dirender, sehingga halaman yang membaca `teacherHome` tidak menampilkan data demo.
export function applyTeacherContext(ctx) {
  Object.assign(teacherHome, { nip: ctx.nip, subject: ctx.subject })
  Object.assign(teacherHome.homeroom, ctx.homeroom, { present: 0, permit: 0, sick: 0, note: '' })
  Object.defineProperty(teacherHome, 'academicYear', { configurable: true, enumerable: true, get: () => `${ctx.academicYear} ${ctx.semester}` })
}
