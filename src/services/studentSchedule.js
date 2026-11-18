import { delay } from './api.js'
import * as d from '../data/student.js'
import { addDays, dateKey, nextOccurrence, startOfWeek } from '../utils/date.js'

const decorate = (s) => { const c = d.courses.find((x) => x.id === s.courseId); return { ...s, courseName: c.name, teacher: c.teacher } }

export const studentSchedule = {
  // Jadwal Senin-Jumat untuk pekan yang memuat `date`, plus penanda jadwal berikutnya dari sekarang.
  async getWeek(uid, date) {
    const start = startOfWeek(date)
    const days = [0, 1, 2, 3, 4].map((i) => {
      const day = addDays(start, i)
      return { key: dateKey(day), date: day.toISOString(), entries: d.studentSchedules.filter((s) => s.day === i + 1).map(decorate).sort((a, b) => a.start.localeCompare(b.start)) }
    })
    const now = new Date()
    const nxt = d.studentSchedules.map((s) => ({ s, when: nextOccurrence(s.day, s.start, s.end, now) })).sort((a, b) => a.when - b.when)[0]
    return delay({ days, next: { ...decorate(nxt.s), key: dateKey(nxt.when), when: nxt.when.toISOString() } })
  },
}
