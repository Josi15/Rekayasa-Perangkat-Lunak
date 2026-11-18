import { delay } from './api.js'
import * as d from '../data/student.js'
import { loadTasks } from './studentTasks.js'

// Rata-rata di sini hanya deskriptif untuk tugas yang sudah dinilai.
// Formula nilai akhir/rapor belum ditetapkan dan sengaja tidak dihitung.
const avg = (arr) => (arr.length ? Math.round((arr.reduce((s, t) => s + (t.score / t.maxScore) * 100, 0) / arr.length) * 10) / 10 : null)

export const studentGrades = {
  async get(uid) {
    const tasks = loadTasks(uid)
    const graded = tasks.filter((t) => t.status === 'graded').sort((a, b) => new Date(a.gradedAt) - new Date(b.gradedAt))
    const scores = graded.map((t) => t.score)
    return delay({
      summary: {
        gradedCount: graded.length,
        awaitingCount: tasks.filter((t) => t.status === 'submitted').length,
        notSubmittedCount: tasks.filter((t) => t.status === 'todo' || t.status === 'overdue').length,
        average: avg(graded), highest: scores.length ? Math.max(...scores) : null, lowest: scores.length ? Math.min(...scores) : null,
      },
      trend: graded.map((t) => ({ id: t.id, label: t.title, score: t.score, max: t.maxScore, courseName: t.courseName })),
      courses: d.courses.map((c) => {
        const mine = tasks.filter((t) => t.courseId === c.id)
        const g = mine.filter((t) => t.status === 'graded').sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt))
        return { ...c, average: avg(g), graded: g, awaiting: mine.filter((t) => t.status === 'submitted'), notSubmitted: mine.filter((t) => t.status === 'todo' || t.status === 'overdue') }
      }),
    })
  },
}
