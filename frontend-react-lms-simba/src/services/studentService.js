// Service modul siswa. Progres disimpan di localStorage (simulasi); saat API Laravel
// tersedia, ganti isi fungsi-fungsi ini dengan pemanggilan HTTP.
import { delay } from './api.js'
import * as d from '../data/student.js'
import { nextOccurrence } from '../utils/date.js'
import { loadTasks } from './studentTasks.js'
import { scheduleForClass } from './classSchedules.js'
import { announcementsFor } from './studentNotices.js'

const key = (uid) => `simba_progress_${uid}`
function readProgress(uid) {
  try {
    const raw = localStorage.getItem(key(uid))
    if (raw) return JSON.parse(raw)
  } catch { /* abaikan, pakai data awal */ }
  writeProgress(uid, d.initialProgress)
  return { ...d.initialProgress }
}
function writeProgress(uid, p) {
  try { localStorage.setItem(key(uid), JSON.stringify(p)) } catch { /* penyimpanan tidak tersedia */ }
}

const courseName = (id) => d.courses.find((c) => c.id === id)?.name ?? '-'

function summarize(course, progress) {
  const mats = d.materials.filter((x) => x.courseId === course.id).sort((a, b) => a.order - b.order)
  const done = mats.filter((x) => progress[x.id]).length
  const percent = mats.length ? Math.round((done / mats.length) * 100) : 0
  const status = done === 0 ? 'not_started' : done === mats.length ? 'completed' : 'in_progress'
  return { ...course, total: mats.length, done, percent, status, materials: mats.map((x) => ({ ...x, done: !!progress[x.id], doneAt: progress[x.id] ?? null })) }
}

export const studentService = {
  async listCourses(uid) {
    const p = readProgress(uid)
    return delay(d.courses.map((c) => { const { materials: _m, ...rest } = summarize(c, p); return rest }))
  },
  async getCourse(uid, courseId) {
    const c = d.courses.find((x) => x.id === courseId)
    if (!c) throw new Error('Kelas tidak ditemukan.')
    return delay(summarize(c, readProgress(uid)))
  },
  async listMaterials(uid) {
    const p = readProgress(uid)
    return delay(d.materials.map((x) => ({ ...x, blocks: undefined, courseName: courseName(x.courseId), done: !!p[x.id] })))
  },
  async getMaterial(uid, materialId) {
    const mat = d.materials.find((x) => x.id === materialId)
    if (!mat) throw new Error('Materi tidak ditemukan.')
    const p = readProgress(uid)
    const course = summarize(d.courses.find((c) => c.id === mat.courseId), p)
    const i = course.materials.findIndex((x) => x.id === mat.id)
    return delay({ ...mat, done: !!p[mat.id], course: { id: course.id, name: course.name, percent: course.percent, done: course.done, total: course.total }, index: i + 1, prev: course.materials[i - 1] ?? null, next: course.materials[i + 1] ?? null })
  },
  async setMaterialDone(uid, materialId, done) {
    const p = readProgress(uid)
    if (done) p[materialId] = new Date().toISOString()
    else delete p[materialId]
    writeProgress(uid, p)
    const mat = d.materials.find((x) => x.id === materialId)
    return delay(summarize(d.courses.find((c) => c.id === mat.courseId), p))
  },
  async getDashboard(uid) {
    const p = readProgress(uid)
    const courses = d.courses.map((c) => { const { materials: _m, ...rest } = summarize(c, p); return rest })
    const totalMats = d.materials.length
    const doneMats = d.materials.filter((x) => p[x.id]).length
    const now = new Date()
    const schedules = scheduleForClass(d.profileSeed[uid]?.classId)
      .map((s) => ({ ...s, courseName: courseName(s.courseId), when: nextOccurrence(s.day, s.start, s.end, now).toISOString() }))
      .sort((a, b) => new Date(a.when) - new Date(b.when)).slice(0, 3)
    const tasks = loadTasks(uid)
    const todo = tasks.filter((a) => a.status === 'todo' || a.status === 'overdue').sort((a, b) => new Date(a.due) - new Date(b.due))
    const derived = d.materials.filter((x) => p[x.id]).map((x) => ({ id: `m${x.id}`, text: `Mempelajari materi "${x.title}"`, at: p[x.id] }))
    const taskActs = tasks.flatMap((t) => [t.submission?.submittedAt && { id: `s${t.id}`, text: `Mengumpulkan tugas "${t.title}"`, at: t.submission.submittedAt }, t.gradedAt && { id: `g${t.id}`, text: `Menerima nilai "${t.title}" (${t.score})`, at: t.gradedAt }].filter(Boolean))
    const activities = [...taskActs, ...derived].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5)
    return delay({
      courseCount: courses.length,
      todoCount: todo.length,
      gradedCount: tasks.filter((a) => a.status === 'graded').length,
      progress: { done: doneMats, total: totalMats, percent: Math.round((doneMats / totalMats) * 100) },
      courses, schedules, deadlines: todo.slice(0, 4),
      activities, announcements: announcementsFor(uid).slice(0, 3),
    })
  },
}
