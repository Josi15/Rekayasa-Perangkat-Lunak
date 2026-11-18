import { users } from '../data/users'
import { demoCredentials } from '../data/demoAccounts'
import * as a from '../data/academic'
import * as t from '../data/teacher'

// ---------------------------------------------------------------------------------------------
// DATABASE SIMULASI (satu-satunya sumber data bersama).
// Ini BUKAN database sungguhan: hanya objek JavaScript di memori. Perubahan hidup selama tab terbuka
// dan kembali ke seed saat halaman dimuat ulang. Semua service membaca/menulis ke sini, jadi data yang
// diubah di satu halaman otomatis terlihat di halaman lain. Fase backend: ganti dengan API Laravel.
// ---------------------------------------------------------------------------------------------
const copy = (list) => list.map((x) => JSON.parse(JSON.stringify(x)))

function seed() {
  return {
    users: copy(users),
    credentials: { ...demoCredentials }, // userId → kata sandi demo (tidak pernah dikembalikan oleh service)
    classes: copy(a.classes),
    subjects: copy(a.subjects),
    teachingClasses: copy(t.teachingClasses),
    materials: t.teacherMaterials.map((m) => ({ ...JSON.parse(JSON.stringify(m)), subjectId: 1 })),
    assignments: t.teacherAssignments.map((x) => ({
      ...x, subjectId: 1, instructions: 'Kerjakan soal pada buku paket.', dueDate: `${x.dueDate}T23:59`, status: 'published', attachments: [],
    })),
    submissions: t.teacherSubmissions.map((s) => ({
      ...s, answer: 'Jawaban terlampir.', attachments: [], submittedAt: `${s.submittedAt}T10:00`,
      score: s.status === 'graded' ? 85 : null, feedback: s.status === 'graded' ? 'Bagus, pertahankan.' : '',
    })),
    schedules: copy(a.schedules),
    announcements: copy(a.announcements),
    settings: { ...a.settings },
    nextId: { users: 7, classes: 4, subjects: 4, materials: 9, assignments: 3, submissions: 4, announcements: 5, schedules: 6 },
  }
}

export const db = seed()
// Kembalikan ke seed awal (dipakai tes dan tombol reset demo). Referensi objek `db` tetap sama.
export const resetDb = () => Object.assign(db, seed())
export const nextId = (table) => db.nextId[table]++

// ---- Selektor bersama (hindari menyalin logika "cari nama" di tiap service) ----
export const findUser = (id) => db.users.find((u) => u.id === Number(id))
export const userName = (id) => findUser(id)?.name ?? '-'
export const className = (id) => db.classes.find((c) => c.id === Number(id))?.name ?? '-'
export const subjectName = (id) => db.subjects.find((s) => s.id === Number(id))?.name ?? '-'
export const activeTeachings = () => db.teachingClasses.filter((c) => c.status === 'active')
export const classStudentIds = (classId) => db.teachingClasses.find((c) => c.classId === Number(classId))?.studentIds ?? []
export const studentClassIds = (uid) => activeTeachings().filter((c) => c.studentIds.includes(Number(uid))).map((c) => c.classId)
export const isLate = (s, asg) => new Date(s.submittedAt) > new Date(asg.dueDate)
export const today = () => new Date().toISOString().slice(0, 10)

export const fail = (msg) => { throw new Error(msg) }
