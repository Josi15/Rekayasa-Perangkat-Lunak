import { apiRequest, fetchAll, ApiError } from '../http'
import { loadCatalog, invalidateCatalog } from './catalog'
import * as A from './adapt'
import { fileApi, resolveMapelId } from './contentApi'

export { fileApi }
const invalid = (message) => new ApiError(message, { status: 422, code: 'validasi_gagal' })
const gone = async (fn) => { try { return await fn() } catch (e) { if (e?.status === 404 || e?.status === 403) return null; throw e } }
const notSupported = (fitur) => new ApiError(`${fitur} belum didukung oleh backend.`, { status: 501, code: 'belum_didukung' })
const nope = (fitur) => () => Promise.reject(notSupported(fitur))
const isoDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ---------------------------------------------------------------- Jadwal
// Backend menyimpan SESI bertanggal (waktu_mulai/selesai), bukan jadwal mingguan. Halaman menampilkan pola mingguan,
// jadi sesi yang berulang pada hari+jam+kelas+mapel yang sama dilipat menjadi satu entri (utamakan yang akan datang).
export function weekly(rows) {
  const now = Date.now()
  const upcoming = rows.filter((r) => new Date(r.endsAt).getTime() >= now)
  const base = (upcoming.length ? upcoming : rows).slice().sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)))
  const seen = new Set()
  return base.filter((r) => { const k = `${r.dayIndex}|${r.time}|${r.classId}|${r.subjectId}`; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => a.dayIndex - b.dayIndex || a.time.localeCompare(b.time))
}
const sched = async (path) => weekly((await fetchAll(path)).map(A.mapSchedule))
// Admin: sesi bertanggal apa adanya (tanpa dilipat jadi pola mingguan). Rentang tanggal 'YYYY-MM-DD' (sampai = inklusif).
const toBody = (d) => {
  const body = {}
  if (d.classId) body.id_kelas = Number(d.classId)
  if (d.subjectId) body.id_mapel = Number(d.subjectId)
  if (d.teacherId) body.id_guru = Number(d.teacherId)
  if (d.date && d.start) body.waktu_mulai = A.localIso(d.date, d.start)
  if (d.date && d.end) body.waktu_selesai = A.localIso(d.date, d.end)
  return body
}
export const scheduleApi = {
  list: () => sched('/jadwal'),
  forStudent: (uid) => sched(`/siswa/${uid}/jadwal`),
  forTeacher: (uid) => sched(`/guru/${uid}/jadwal`),
  async sessions({ from, to, classId } = {}) {
    const rows = await fetchAll('/jadwal', { dari: from, sampai: to, id_kelas: classId })
    return rows.map(A.mapSchedule).map((x) => ({ ...x, key: String(x.id), date: A.dayKey(x.startsAt) })).sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)))
  },
  async create(d) {
    if (!d.classId || !d.subjectId) throw invalid('Kelas dan mata pelajaran wajib dipilih.')
    if (!d.date || !d.start || !d.end) throw invalid('Tanggal, jam mulai, dan jam selesai wajib diisi.')
    if (d.end <= d.start) throw invalid('Jam selesai harus setelah jam mulai.')
    const r = A.mapSchedule(A.item(await apiRequest('/jadwal', { method: 'POST', body: toBody(d) })))
    invalidateCatalog(); return r
  },
  async update(id, d) {
    if (d.start && d.end && d.end <= d.start) throw invalid('Jam selesai harus setelah jam mulai.')
    const r = A.mapSchedule(A.item(await apiRequest(`/jadwal/${id}`, { method: 'PATCH', body: toBody(d) })))
    invalidateCatalog(); return r
  },
  async remove(id) { await apiRequest(`/jadwal/${id}`, { method: 'DELETE' }); invalidateCatalog(); return true },
}

// ---------------------------------------------------------------- Pengumuman
const newest = (a, b) => String(b.createdAtIso).localeCompare(String(a.createdAtIso)) || b.id - a.id
const rejectDraft = (d) => { if (d?.status === 'draft') throw invalid('Draf pengumuman belum didukung backend: pengumuman langsung terbit. Ubah status menjadi "Dipublikasikan".') }
export const announcementApi = {
  list: async () => (await fetchAll('/pengumuman')).map(A.mapAnnouncement).sort(newest),
  get: (id) => gone(async () => A.mapAnnouncement(A.item(await apiRequest(`/pengumuman/${id}`)))),
  forRole: () => announcementApi.list(), // backend sudah membatasi: global + mapel yang diikuti/diampu
  async create(d) { // kategori & sasaran peran tidak ada di backend; pengumuman admin = cakupan global
    rejectDraft(d)
    return A.mapAnnouncement(A.item(await apiRequest('/pengumuman', { method: 'POST', body: { judul: String(d.title ?? '').trim(), isi: String(d.body ?? '').trim(), cakupan: 'global' } })))
  },
  async update(id, d) {
    rejectDraft(d)
    const body = {}
    if (d.title !== undefined) body.judul = String(d.title).trim()
    if (d.body !== undefined) body.isi = String(d.body).trim()
    return A.mapAnnouncement(A.item(await apiRequest(`/pengumuman/${id}`, { method: 'PATCH', body })))
  },
  async remove(id) { await apiRequest(`/pengumuman/${id}`, { method: 'DELETE' }); return true },
}

// ---------------------------------------------------------------- Profil (backend: hanya email & kata sandi)
export const profileApi = {
  async get() {
    const [me, cat] = await Promise.all([apiRequest('/profil'), loadCatalog()])
    const u = A.item(me)
    return { name: A.nameOf(u), nip: u.nip ?? '-', nuptk: '-', subject: cat.mapel.map((m) => m.nama_mapel).join(', ') || '-', email: u.email ?? '', phone: '', address: '', photo: null, twoFA: false, updatedAt: null, otherSessions: [] }
  },
  update: () => Promise.reject(new ApiError('Backend hanya menyimpan email dan kata sandi akun. Nama, telepon, dan alamat belum bisa diubah, dan perubahan email memerlukan kata sandi saat ini.', { status: 501, code: 'belum_didukung' })),
  setPhoto: nope('Unggah foto profil'),
  setTwoFA: nope('Autentikasi dua langkah (2FA)'),
  signOutOthers: nope('Keluar dari sesi lain'),
  async changePassword({ current, next, confirm }) {
    await apiRequest('/profil', { method: 'PATCH', body: { password: next, password_confirmation: confirm, password_saat_ini: current } })
    return { simulated: false }
  },
}

// ---------------------------------------------------------------- Dashboard & laporan
const roleCount = (per, k) => per?.[k]?.total ?? 0
export const reportApi = {
  async list() { return [{ id: 'users', name: 'Daftar pengguna', filename: 'pengguna.csv' }, { id: 'classes', name: 'Rekap kelas', filename: 'kelas.csv' }, { id: 'submissions', name: 'Pengumpulan tugas', filename: 'pengumpulan-tugas.csv' }, { id: 'grades', name: 'Nilai tugas', filename: 'nilai-tugas.csv' }] },
  async summary() {
    const [d, kelas, tugas, nilai] = await Promise.all([apiRequest('/dashboard').then(A.item), fetchAll('/kelas').catch(() => []), fetchAll('/tugas').catch(() => []), fetchAll('/nilai', { sumber: 'tugas' }).catch(() => [])])
    const per = d.pengguna?.per_peran ?? {}
    const hadir = d.presensi?.per_status_kehadiran ?? {}
    const tercatat = d.presensi?.total_presensi ?? 0
    const hitHadir = (hadir.hadir ?? 0) + (hadir.terlambat ?? 0)
    const subs = tugas.reduce((s, t) => s + (t.jumlah_pengumpulan ?? 0), 0)
    return {
      users: { total: d.pengguna?.total ?? 0, admin: roleCount(per, 'admin'), teacher: roleCount(per, 'guru'), student: roleCount(per, 'siswa'), active: ['admin', 'guru', 'siswa'].reduce((s, k) => s + (per[k]?.aktif ?? 0), 0) },
      classes: d.kelas?.aktif ?? kelas.filter((k) => k.aktif !== false).length,
      subjects: d.mata_pelajaran?.aktif ?? 0,
      materials: { total: 0, published: 0 }, // tidak ada agregat materi di /dashboard admin
      assignments: { total: tugas.length, published: tugas.filter((t) => t.status === 'terbuka').length },
      submissions: { total: subs, graded: nilai.length, pending: Math.max(0, subs - nilai.length), late: 0 },
      averageScore: A.avg1(nilai.map((n) => Number(n.nilai))),
      attendance: { pct: tercatat ? Math.round((hitHadir / tercatat) * 1000) / 10 : 0, total: tercatat },
    }
  },
  async table(id) {
    const meta = (await reportApi.list()).find((r) => r.id === id)
    if (!meta) throw new Error('Laporan tidak ditemukan.')
    const ROLE = { admin: 'Administrator', teacher: 'Guru', student: 'Siswa' }
    if (id === 'users') { const rows = (await fetchAll('/admin/pengguna')).map(A.mapUser).map((u) => ({ ...u, role: ROLE[u.role] })); return { ...meta, columns: [{ key: 'name', header: 'Nama' }, { key: 'username', header: 'Username' }, { key: 'email', header: 'Email' }, { key: 'role', header: 'Peran' }, { key: 'status', header: 'Status' }], rows } }
    if (id === 'classes') { const cat = await loadCatalog(); const rows = cat.kelas.map((k) => A.mapClass(k, cat.rel)); return { ...meta, columns: [{ key: 'name', header: 'Kelas' }, { key: 'homeroom', header: 'Wali kelas' }, { key: 'enrolled', header: 'Jumlah siswa' }, { key: 'status', header: 'Status' }], rows } }
    const [tugas, nilai, cat] = await Promise.all([fetchAll('/tugas'), fetchAll('/nilai', { sumber: 'tugas' }), loadCatalog()])
    if (id === 'grades') { const rows = nilai.map((n) => { const g = A.mapGrade(n, cat.rel); return { student: g.studentName, subject: g.subjectName, assignment: g.assignmentTitle, score: g.score } }); return { ...meta, columns: [{ key: 'student', header: 'Siswa' }, { key: 'subject', header: 'Mapel' }, { key: 'assignment', header: 'Tugas' }, { key: 'score', header: 'Nilai' }], rows } }
    const nilaiBy = new Map(nilai.filter((n) => n.id_pengumpulan).map((n) => [Number(n.id_pengumpulan), n]))
    const rows = (await Promise.all(tugas.map(async (t) => (await fetchAll(`/tugas/${t.id_tugas}/pengumpulan`).catch(() => [])).map((p) => ({ student: p.siswa ? A.nameOf(p.siswa) : '-', assignment: t.judul, className: cat.rel.className(cat.rel.classIdsOfMapel(t.id_mapel)[0]) ?? '-', status: nilaiBy.has(Number(p.id_pengumpulan)) || p.status === 'dinilai' ? 'Sudah dinilai' : 'Belum dinilai', late: p.terlambat || new Date(p.waktu_kumpul) > new Date(t.batas_waktu) ? 'Ya' : 'Tidak', score: nilaiBy.get(Number(p.id_pengumpulan))?.nilai ?? '' }))))).flat()
    return { ...meta, columns: [{ key: 'student', header: 'Siswa' }, { key: 'assignment', header: 'Tugas' }, { key: 'className', header: 'Kelas' }, { key: 'status', header: 'Status' }, { key: 'late', header: 'Terlambat' }, { key: 'score', header: 'Nilai' }], rows }
  },
}

// Pengaturan sekolah & leger nilai tidak punya endpoint di backend.
export const settingApi = { get: nope('Pengaturan sekolah'), update: nope('Pengaturan sekolah') }
export const ledgerApi = { get: nope('Leger nilai'), savePts: nope('Leger nilai'), setLocked: nope('Leger nilai'), pullCbt: nope('Sinkronisasi nilai CBT ke leger') }

// ---------------------------------------------------------------- Presensi (jadwal sesi guru ↔ roster)
// Halaman presensi bekerja pada SATU sesi: sesi yang sedang berlangsung, atau yang terdekat berikutnya, atau yang terakhir selesai.
async function currentSession() {
  const rows = (await fetchAll('/jadwal', { tanggal: isoDay() }).catch(() => [])).map(A.mapSchedule)
  const now = Date.now()
  const live = rows.find((r) => new Date(r.startsAt) <= now && now <= new Date(r.endsAt))
  const next = rows.filter((r) => new Date(r.startsAt) > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
  const last = rows.filter((r) => new Date(r.endsAt) < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0]
  return live ?? next ?? last ?? null
}
const requireSession = async () => { const s = await currentSession(); if (!s) throw new ApiError('Tidak ada sesi mengajar hari ini.', { status: 404, code: 'tidak_ada_sesi' }); return s }

async function writeStatus(scheduleId, studentId, status) {
  const roster = (await fetchAll(`/jadwal/${scheduleId}/presensi`)).find((r) => Number(r.id_siswa) === Number(studentId))
  if (!roster) throw new ApiError('Siswa tidak ditemukan.', { status: 404 })
  const body = { status_kehadiran: A.ATT_OUT[status] }
  if (roster.presensi) await apiRequest(`/presensi/${roster.presensi.id_presensi}`, { method: 'PATCH', body })
  else await apiRequest(`/jadwal/${scheduleId}/presensi`, { method: 'POST', body: { id_siswa: Number(studentId), ...body } })
  return true
}

export const attendanceApi = {
  async get() {
    const s = await currentSession()
    if (!s) return { session: { className: '-', title: 'Tidak ada sesi mengajar hari ini', mode: 'Tatap Muka', room: '-', ssid: '-', token: '-', slot: '-' }, open: false, records: [], stats: A.statsOfRows([]), history: [] }
    const roster = await fetchAll(`/jadwal/${s.id}/presensi`)
    const records = roster.map(A.mapRosterRow)
    const open = Date.now() <= new Date(s.endsAt).getTime()
    return { session: { className: s.className, title: `${s.subjectName} — ${s.className}`, mode: 'Tatap Muka', room: '-', ssid: '-', token: '-', slot: `${s.time} - ${s.endTime}`, scheduleId: s.id }, open, records, stats: A.statsOfRows(records), history: [] }
  },
  async setStatus(studentId, status) {
    const s = await requireSession()
    return writeStatus(s.id, studentId, status)
  },
  // Admin: roster & koreksi untuk sesi mana pun, serta rekap per siswa (GET /rekap/presensi).
  async roster(scheduleId) {
    const records = (await fetchAll(`/jadwal/${scheduleId}/presensi`)).map(A.mapRosterRow)
    return { records, stats: A.statsOfRows(records) }
  },
  correct: (scheduleId, studentId, status) => writeStatus(scheduleId, studentId, status),
  async rekap({ classId, from, to } = {}) {
    return (await fetchAll('/rekap/presensi', { id_kelas: classId, dari: from, sampai: to })).map(A.mapRekap)
  },
  setNote: nope('Catatan presensi'),
  async markAllPresent() {
    const s = await requireSession()
    const roster = await fetchAll(`/jadwal/${s.id}/presensi`)
    const todo = roster.filter((r) => r.status_kehadiran === 'belum_tercatat' || r.status_kehadiran === 'alpa')
    for (const r of todo) {
      if (r.presensi) await apiRequest(`/presensi/${r.presensi.id_presensi}`, { method: 'PATCH', body: { status_kehadiran: 'hadir' } })
      else await apiRequest(`/jadwal/${s.id}/presensi`, { method: 'POST', body: { id_siswa: Number(r.id_siswa), status_kehadiran: 'hadir' } })
    }
    return todo.length
  },
  setOpen: nope('Membuka/menutup sesi presensi (jendela check-in diatur otomatis oleh waktu jadwal)'),
}

// ---------------------------------------------------------------- Kuis (backend: hanya tautan Google Form)
export const quizApi = {
  async list() {
    const [rows, cat] = await Promise.all([fetchAll('/kuis'), loadCatalog()])
    const quizzes = rows.map((k) => A.mapQuiz(k, cat.rel))
    const options = cat.kelas.filter((k) => k.aktif !== false).map((k) => ({ id: Number(k.id_kelas), name: k.nama_kelas }))
    const done = quizzes.reduce((s, q) => s + q.done, 0)
    return { quizzes, updatedAt: Date.now(), token: '-', stats: { running: quizzes.filter((q) => q.status === 'running').length, done, total: done, pct: done ? 100 : 0, avg: null }, classOptions: options }
  },
  async create(d) {
    const link = String(d.link ?? d.url ?? d.googleFormUrl ?? d.formUrl ?? '').trim()
    if (!link) throw invalid('Backend hanya menyimpan kuis berupa tautan Google Form. Isi tautan Google Form.')
    const idMapel = await resolveMapelId({ classId: d.classIds?.[0], subjectId: d.subjectId })
    const k = A.item(await apiRequest(`/mapel/${idMapel}/kuis`, { method: 'POST', body: { judul: String(d.title ?? '').trim(), tautan_google_form: link } }))
    invalidateCatalog(); return k
  },
  setStatus: nope('Mengubah status kuis'),
  sync: nope('Sinkronisasi nilai dari Google Form'),
  async remove(id) { await apiRequest(`/kuis/${id}`, { method: 'DELETE' }); return true },
  newToken: nope('Token kuis'),
}
