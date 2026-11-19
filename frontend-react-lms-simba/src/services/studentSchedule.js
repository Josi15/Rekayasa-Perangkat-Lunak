import { delay } from './api.js'
import * as d from '../data/student.js'
import { scheduleForClass } from './classSchedules.js'
import { addDays, dateKey, nextOccurrence, startOfWeek } from '../utils/date.js'
import { toMin } from './classSchedules.js'

export const studentSchedule = {
  // Jadwal Senin-Jumat sesuai kelas siswa, plus penanda jadwal berikutnya dari sekarang.
  async getWeek(uid, date) {
    const list = scheduleForClass(d.profileSeed[uid]?.classId)
    const start = startOfWeek(date)
    const days = [0, 1, 2, 3, 4].map((i) => {
      const day = addDays(start, i)
      return { key: dateKey(day), date: day.toISOString(), entries: list.filter((s) => s.day === i + 1).sort((a, b) => a.start.localeCompare(b.start)) }
    })
    const now = new Date()
    const nxt = list.map((s) => ({ s, when: nextOccurrence(s.day, s.start, s.end, now) })).sort((a, b) => a.when - b.when)[0]
    return delay({ days, next: nxt ? { ...nxt.s, key: dateKey(nxt.when), when: nxt.when.toISOString() } : null })
  },
  // Sesi hari ini beserta status berlangsung/berikutnya/selesai.
  async getToday(uid) {
    const list = scheduleForClass(d.profileSeed[uid]?.classId)
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const sessions = list.filter((s) => s.day === now.getDay()).sort((a, b) => a.start.localeCompare(b.start))
      .map((s) => ({ ...s, state: nowMin >= toMin(s.end) ? 'done' : nowMin >= toMin(s.start) ? 'ongoing' : 'upcoming', remaining: toMin(s.end) - nowMin }))
    const minutes = sessions.reduce((a, s) => a + toMin(s.end) - toMin(s.start), 0)
    return delay({ date: now.toISOString(), sessions, current: sessions.find((s) => s.state === 'ongoing') ?? null, next: sessions.find((s) => s.state === 'upcoming') ?? null, jp: Math.round(minutes / 45) })
  },
  forCourse: (uid, courseId) => delay(scheduleForClass(d.profileSeed[uid]?.classId).filter((s) => s.courseId === courseId).sort((a, b) => a.day - b.day)),
}
