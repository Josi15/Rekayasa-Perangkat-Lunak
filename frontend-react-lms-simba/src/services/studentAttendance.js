import { delay } from './api.js'
import * as d from '../data/student.js'
import { store } from './studentStore.js'
import { addDays, dateKey } from '../utils/date.js'

const KEY = (uid) => `simba_attendance_${uid}`
const label = (pct) => (pct >= 95 ? 'Sangat Baik' : pct >= 85 ? 'Baik' : 'Perlu Perhatian')

function summary(uid) {
  const checkins = store.get(KEY(uid), {})
  const n = Object.keys(checkins).length
  const present = d.attendanceSeed.present + n
  const total = d.attendanceSeed.total + n
  const pct = Math.round((present / total) * 1000) / 10
  const history = [
    ...Object.entries(checkins).map(([date, v]) => ({ date, status: 'Hadir', time: v.time })),
    ...d.attendanceHistorySeed.map((h) => ({ date: dateKey(addDays(new Date(), h.offset)), status: h.status, time: h.time })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  return { present, total, permit: d.attendanceSeed.permit, pct, label: label(pct), checkedIn: checkins[dateKey(new Date())] ?? null, history }
}

export const studentAttendance = {
  get: (uid) => delay(summary(uid)),
  // Simulasi: tidak ada verifikasi lokasi nyata.
  async checkIn(uid) {
    const now = new Date()
    if (now.getDay() === 0 || now.getDay() === 6) throw new Error('Presensi hanya tersedia pada hari sekolah (Senin-Jumat).')
    const checkins = store.get(KEY(uid), {})
    const key = dateKey(now)
    if (checkins[key]) throw new Error('Anda sudah check-in hari ini.')
    checkins[key] = { time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':') }
    store.set(KEY(uid), checkins)
    return delay(summary(uid))
  },
  courseSummary: (courseId) => d.courseAttendance[courseId] ?? { present: 11, total: 12 },
}
