import { request } from './http'
import { attendance, statsOf } from './attendanceStore'
import { pick } from './mode'
import { attendanceApi } from './api/activityApi'

const find = (id) => {
  if (!attendance.open) throw new Error('Sesi presensi sudah ditutup.')
  const r = attendance.records.find((x) => x.studentId === id)
  if (!r) throw new Error('Siswa tidak ditemukan.')
  return r
}
const nowTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const noteMethod = { I: 'Izin dicatat guru', S: 'Sakit dicatat guru', A: 'Tanpa keterangan' }

const mockAttendanceService = {
  get: () => request(() => ({ session: attendance.session, open: attendance.open, records: attendance.records, stats: statsOf(attendance.records), history: attendance.history })),
  setStatus: (id, status) => request(() => {
    const r = find(id)
    if (r.status === status) return true
    r.status = status
    if (status === 'H') { if (!r.time) { r.time = nowTime(); r.method = { kind: 'manual', label: 'Manual Guru' } } }
    else { r.time = null; r.method = { kind: 'note', label: noteMethod[status] } }
    return true
  }),
  setNote: (id, note) => request(() => { find(id).note = note; return true }),
  markAllPresent: () => request(() => {
    if (!attendance.open) throw new Error('Sesi presensi sudah ditutup.')
    const todo = attendance.records.filter((r) => r.status === 'A')
    todo.forEach((r) => { r.status = 'H'; r.time = nowTime(); r.method = { kind: 'manual', label: 'Manual Guru' } })
    return todo.length
  }),
  setOpen: (open) => request(() => { attendance.open = open; return open }),
  // Admin (demo): satu roster bersama; backend sungguhan menyediakan roster per sesi.
  roster: () => request(() => ({ records: attendance.records, stats: statsOf(attendance.records) })),
  correct: (_scheduleId, id, status) => request(() => {
    const r = attendance.records.find((x) => x.studentId === Number(id))
    if (!r) throw new Error('Siswa tidak ditemukan.')
    r.status = status
    if (status === 'H') { if (!r.time) { r.time = nowTime(); r.method = { kind: 'manual', label: 'Dikoreksi admin' } } }
    else { r.time = null; r.method = { kind: 'note', label: 'Dikoreksi admin' } }
    return true
  }),
  rekap: () => request(() => attendance.records.map((r, i) => ({
    id: r.studentId, no: i + 1, studentId: r.studentId, name: r.name, nisn: r.nisn, total: 1, recorded: 1, pending: 0,
    h: r.status === 'H' ? 1 : 0, late: 0, i: r.status === 'I' ? 1 : 0, s: r.status === 'S' ? 1 : 0, a: r.status === 'A' ? 1 : 0, pct: r.status === 'H' ? 100 : 0,
  }))),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const attendanceService = pick(mockAttendanceService, attendanceApi)
