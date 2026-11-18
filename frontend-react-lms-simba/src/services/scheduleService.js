import { request } from './http'
import { db, nextId, className, subjectName, userName, studentClassIds, fail } from './db'
import { pick } from './mode'
import { scheduleApi } from './api/activityApi'
import { dayKey } from './api/adapt'

const view = (s) => ({ ...s, className: className(s.classId), subjectName: subjectName(s.subjectId), teacherName: userName(s.teacherId) })
const sorted = (list) => [...list].sort((a, b) => a.dayIndex - b.dayIndex || a.time.localeCompare(b.time)).map(view)

const DAYS = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const p2 = (n) => String(n).padStart(2, '0')
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const fromMin = (m) => `${p2(Math.floor(m / 60) % 24)}:${p2(m % 60)}`
const endOf = (s) => s.endTime ?? fromMin(toMin(s.time) + 90)
const dayIdx = (date) => new Date(`${date}T00:00:00`).getDay() || 7

// Mode demo menyimpan POLA MINGGUAN (hari + jam). Untuk tampilan admin, pola itu dikembangkan menjadi sesi bertanggal.
function expand(from, to) {
  const out = []
  const start = new Date(`${from}T00:00:00`), end = new Date(`${to ?? from}T00:00:00`)
  for (let d = new Date(start), n = 0; d <= end && n < 62; d.setDate(d.getDate() + 1), n++) {
    const date = dayKey(d), idx = d.getDay() || 7
    db.schedules.filter((x) => x.dayIndex === idx).forEach((x) => out.push({
      ...view(x), key: `${x.id}@${date}`, date, endTime: endOf(x), startsAt: `${date}T${x.time}:00`, endsAt: `${date}T${endOf(x)}:00`,
    }))
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

function check(d, id) {
  if (!d.classId || !d.subjectId) fail('Kelas dan mata pelajaran wajib dipilih.')
  if (!d.date || !d.start || !d.end) fail('Tanggal, jam mulai, dan jam selesai wajib diisi.')
  if (d.end <= d.start) fail('Jam selesai harus setelah jam mulai.')
  const subject = db.subjects.find((x) => x.id === Number(d.subjectId))
  if (!subject) fail('Mata pelajaran tidak ditemukan.')
  const teacherId = Number(d.teacherId || subject.teacherId)
  const idx = dayIdx(d.date)
  const clash = db.schedules.find((x) => x.id !== id && x.dayIndex === idx && toMin(x.time) < toMin(d.end) && toMin(d.start) < toMin(endOf(x)) && (x.classId === Number(d.classId) || x.teacherId === teacherId))
  if (clash) fail(clash.classId === Number(d.classId) ? 'Bentrok: kelas ini sudah punya sesi pada jam tersebut.' : 'Bentrok: guru sudah mengajar pada jam tersebut.')
  return { dayIndex: idx, day: DAYS[idx], time: d.start, endTime: d.end, classId: Number(d.classId), subjectId: Number(d.subjectId), teacherId }
}

const mockScheduleService = {
  sessions: ({ from, to, classId } = {}) => request(() => expand(from, to).filter((x) => !classId || x.classId === Number(classId))),
  create: (d) => request(() => { const row = { ...check(d), id: nextId('schedules'), room: '-' }; db.schedules.push(row); return view(row) }),
  update: (id, d) => request(() => {
    const i = db.schedules.findIndex((x) => x.id === Number(id))
    if (i < 0) fail('Jadwal tidak ditemukan.')
    const cur = db.schedules[i]
    const merged = { classId: cur.classId, subjectId: cur.subjectId, teacherId: cur.teacherId, start: cur.time, end: endOf(cur), ...d, date: d.date || dayKey(new Date(2024, 0, cur.dayIndex)) }
    db.schedules[i] = { ...cur, ...check(merged, cur.id) }
    return view(db.schedules[i])
  }),
  remove: (id) => request(() => { db.schedules = db.schedules.filter((x) => x.id !== Number(id)); return true }),
  list: () => request(() => sorted(db.schedules)),
  forStudent: (uid) => request(() => sorted(db.schedules.filter((s) => studentClassIds(uid).includes(s.classId)))),
  forTeacher: (uid) => request(() => sorted(db.schedules.filter((s) => s.teacherId === Number(uid)))),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const scheduleService = pick(mockScheduleService, scheduleApi)
