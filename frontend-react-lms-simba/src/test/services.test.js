// Tes lapisan service: satu sumber data (db), validasi, dan sesi mock. Tanpa DOM/React.
import { beforeEach } from 'vitest'
import * as S from '../services'
import { resetDb } from '../services/db'
import { SESSION_KEY } from '../services/authService'
import { teacherHome } from '../data/teacherHome'

const T = 30000
beforeEach(() => { resetDb(); localStorage.clear() })
const rejects = (p, msg) => expect(p).rejects.toThrow(msg)

test('login: username, email, NISN; ditolak bila salah/nonaktif/menunggu; sesi tidak bisa memalsukan peran', async () => {
  expect((await S.authService.login({ identifier: 'guru', password: 'guru123' })).role).toBe('teacher')
  expect((await S.authService.login({ identifier: 'SISWA@simba.test', password: 'siswa123' })).role).toBe('student')
  expect((await S.authService.login({ identifier: '0068129031', password: 'siswa123' })).name).toBe('Siti Nurhaliza')
  await rejects(S.authService.login({ identifier: 'guru', password: 'salah' }), 'salah')
  await rejects(S.authService.login({ identifier: 'budi', password: 'guru123' }), 'tidak aktif')
  await rejects(S.authService.login({ identifier: 'dewi', password: 'siswa123' }), 'belum diaktifkan')
  // peran dipulihkan dari db, bukan dari localStorage
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: 3, name: 'Andi', role: 'admin', status: 'active' }))
  expect(S.authService.currentUser().role).toBe('student')
  S.authService.logout()
  expect(S.authService.currentUser()).toBeNull()
}, T)

test('sesi gugur bila admin menonaktifkan akun', async () => {
  await S.authService.login({ identifier: 'siswa', password: 'siswa123' })
  expect(S.authService.currentUser().id).toBe(3)
  await S.userService.setStatus(3, 'inactive', 1)
  expect(S.authService.currentUser()).toBeNull()
}, T)

test('pengguna: validasi, duplikat, dan perlindungan akun sendiri', async () => {
  await rejects(S.userService.create({ name: '', email: 'a@b.co', username: 'x', role: 'student' }), 'Nama wajib')
  await rejects(S.userService.create({ name: 'A', email: 'salah', username: 'x', role: 'student' }), 'Email tidak valid')
  await rejects(S.userService.create({ name: 'A', email: 'guru@simba.test', username: 'baru', role: 'student' }), 'Email sudah dipakai')
  await rejects(S.userService.create({ name: 'A', email: 'a@b.co', username: 'GURU', role: 'student' }), 'Username sudah dipakai')
  await rejects(S.userService.setStatus(1, 'inactive', 1), 'akun sendiri')
  await rejects(S.userService.update(2, { role: 'student' }, 1), 'pengampu')
  const u = await S.userService.create({ name: 'Rani', email: 'rani@simba.test', username: 'rani', role: 'student', password: 'rahasia123' })
  expect(u.password).toBe(undefined)
  expect((await S.authService.login({ identifier: 'rani', password: 'rahasia123' })).name).toBe('Rani')
  expect((await S.userService.list())).toHaveLength(7)
}, T)

test('perubahan nama guru oleh admin tercermin di kelas, mapel, jadwal, dan daftar peserta', async () => {
  await S.userService.update(2, { name: 'Ratna W., S.Pd.' }, 1)
  expect((await S.classService.get(1)).homeroom).toBe('Ratna W., S.Pd.')
  expect((await S.subjectService.get(1)).teacherName).toBe('Ratna W., S.Pd.')
  expect((await S.scheduleService.forTeacher(2))[0].teacherName).toBe('Ratna W., S.Pd.')
  await S.userService.update(3, { name: 'Andi P.' }, 1)
  expect((await S.teacherService.getClass(1)).students.map((s) => s.name)).toContain('Andi P.')
  expect((await S.teacherAssignmentService.roster(1)).rows.map((r) => r.name)).toContain('Andi P.')
}, T)

test('kelas & mapel: validasi, duplikat, dan arsip diblokir bila masih dipakai', async () => {
  await rejects(S.classService.create({ name: 'x ipa 1', homeroomId: 2, size: 30 }), 'sudah ada')
  await rejects(S.classService.create({ name: 'XII IPA 1', homeroomId: 3, size: 30 }), 'harus seorang guru')
  await rejects(S.classService.create({ name: 'XII IPA 1', homeroomId: 2, size: 0 }), '1–60')
  const c = await S.classService.create({ name: 'XII IPA 1', homeroomId: 2, size: 30 })
  expect((await S.classService.list())).toHaveLength(4)
  await rejects(S.classService.setStatus(1, 'archived'), 'pengampuan aktif')
  expect((await S.classService.setStatus(c.id, 'archived')).status).toBe('archived')
  await rejects(S.subjectService.create({ name: 'Kimia', code: 'mtk', teacherId: 2 }), 'sudah dipakai')
  const s = await S.subjectService.create({ name: 'Kimia', code: 'kim', teacherId: 2 })
  expect(s.code).toBe('KIM')
  await rejects(S.subjectService.setStatus(1, 'archived'), 'pengampuan aktif')
}, T)

test('alur: guru buat tugas → siswa kumpul → guru nilai → nilai tampil di nilai, leger, dan laporan', async () => {
  const before = await S.reportService.summary()
  const a = await S.teacherAssignmentService.save({ classId: 1, title: 'Tugas Uji', instructions: 'x', dueDate: '2099-01-01T00:00', status: 'published', attachments: [] })
  expect((await S.studentService.listAssignments(3)).map((x) => x.title)).toContain('Tugas Uji')
  expect((await S.studentService.listAssignments(6)).map((x) => x.title)).not.toContain('Tugas Uji') // kelas lain
  await rejects(S.studentService.submit(3, a.id, { answer: ' ', attachments: [] }), 'Isi jawaban')
  await S.studentService.submit(3, a.id, { answer: 'jawaban', attachments: [] })
  await rejects(S.studentService.submit(3, a.id, { answer: 'lagi', attachments: [] }), 'sudah dikumpulkan')
  const roster = await S.teacherAssignmentService.roster(a.id)
  expect(roster.rows.find((r) => r.id === 3).state).toBe('submitted')
  expect(roster.rows.find((r) => r.id === 4).state).toBe('missing')
  const sub = roster.rows.find((r) => r.id === 3).submission
  await rejects(S.teacherAssignmentService.grade(sub.id, { score: 150, feedback: '' }), '0 dan 100')
  await S.teacherAssignmentService.grade(sub.id, { score: 90, feedback: 'Bagus' })
  expect((await S.studentService.listGrades(3)).find((g) => g.assignmentTitle === 'Tugas Uji').score).toBe(90)
  expect((await S.gradeService.list()).some((g) => g.studentId === 3 && g.score === 90)).toBe(true)
  expect((await S.ledgerService.get()).rows.find((r) => r.studentId === 3).tugas).toBe(90)
  const after = await S.reportService.summary()
  expect(after.submissions.total).toBe(before.submissions.total + 1)
  expect(after.submissions.graded).toBe(before.submissions.graded + 1)
  // hapus tugas → pengumpulan & nilainya ikut hilang di semua tempat
  await S.assignmentService.remove(a.id)
  expect((await S.gradeService.forStudent(3))).toHaveLength(0)
}, T)

test('materi: hanya yang dipublikasikan untuk kelas siswa; perubahan guru tercermin', async () => {
  const titles = async () => (await S.materialService.forStudent(3)).map((m) => m.title)
  expect(await titles()).toContain('Fungsi Kuadrat')
  expect(await titles()).not.toContain('Persamaan Linear') // draft
  expect((await S.materialService.forStudent(6)).map((m) => m.title)).toContain('LKPD Praktikum Statistika Dasar')
  const m = await S.teacherService.saveMaterial({ id: 2, status: 'published', classIds: [1] })
  expect(m.status).toBe('published')
  expect(await titles()).toContain('Persamaan Linear')
  await S.teacherService.deleteMaterial(2)
  expect(await titles()).not.toContain('Persamaan Linear')
}, T)

test('jadwal siswa mengikuti kelas aktifnya', async () => {
  const andi = await S.scheduleService.forStudent(3)
  expect(andi.every((s) => s.classId === 1)).toBe(true)
  expect(andi.map((s) => s.day)).toEqual(['Senin', 'Selasa', 'Kamis'])
  expect((await S.scheduleService.forStudent(1))).toHaveLength(0) // admin tidak punya kelas
}, T)

test('pengumuman: draft & sasaran disaring per peran; CRUD admin tercermin', async () => {
  const titles = async (r) => (await S.announcementService.forRole(r)).map((a) => a.title)
  expect(await titles('student')).toEqual(['Ujian Tengah Semester', 'Pemeliharaan Sistem'])
  expect(await titles('teacher')).toContain('Rapat Dewan Guru')
  await rejects(S.announcementService.create({ title: '', body: 'x', audience: 'all', status: 'published' }), 'Judul wajib')
  const a = await S.announcementService.create({ title: 'Libur', body: 'Besok libur', audience: 'student', status: 'published' }, 'Admin Simba')
  expect(await titles('student')).toContain('Libur')
  expect(await titles('teacher')).not.toContain('Libur')
  await S.announcementService.update(a.id, { status: 'draft' })
  expect(await titles('student')).not.toContain('Libur')
  await S.announcementService.remove(a.id)
  await rejects(S.announcementService.remove(a.id), 'tidak ditemukan')
}, T)

test('pengaturan: validasi dan tercermin pada tahun ajaran dashboard guru', async () => {
  await rejects(S.settingService.update({ schoolName: 'X', academicYear: '2026/2028', semester: 'Ganjil' }), 'berformat')
  await rejects(S.settingService.update({ schoolName: 'X', academicYear: '2026/2027', semester: 'Tengah' }), 'Ganjil atau Genap')
  await S.settingService.update({ schoolName: 'SMA Baru', academicYear: '2027/2028', semester: 'Genap' })
  expect(teacherHome.academicYear).toBe('2027/2028 Genap')
  expect((await S.teacherHomeService.get()).academicYear).toBe('2027/2028 Genap')
}, T)

test('laporan diturunkan dari db dan tabel CSV konsisten', async () => {
  const r = await S.reportService.summary()
  expect(r.users.total).toBe(6)
  expect(r.users.student).toBe(3)
  const t = await S.reportService.table('users')
  expect(t.rows).toHaveLength(6)
  expect(t.columns.map((c) => c.header)).toContain('Peran')
  await rejects(S.reportService.table('tidak-ada'), 'tidak ditemukan')
}, T)

test('kata sandi demo tidak pernah bocor lewat service', async () => {
  const all = JSON.stringify([await S.userService.list(), await S.classService.list(), await S.authService.login({ identifier: 'admin', password: 'admin123' })])
  expect(all.includes('admin123')).toBe(false)
  expect(all.includes('password')).toBe(false)
}, T)
