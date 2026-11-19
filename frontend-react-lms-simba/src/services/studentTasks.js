import { delay } from './api.js'
import * as d from '../data/student.js'
import { store, emitNoticeChange } from './studentStore.js'
import { validateSubmission } from '../utils/fileValidation.js'

const SUB = (uid) => `simba_submissions_${uid}`
const course = (id) => d.courses.find((c) => c.id === id)

// Status efektif: graded | submitted | overdue | todo. Pengumpulan baru disimpan terpisah dari data awal.
export function loadTasks(uid) {
  const subs = store.get(SUB(uid), {})
  const now = new Date()
  return d.studentAssignments.map((a) => {
    const stored = subs[a.id]
    const seeded = a.state !== 'todo' ? { answer: a.answer ?? '', attachments: a.attachments ?? [], submittedAt: a.submittedAt } : null
    const submission = stored ?? seeded
    const status = a.state === 'graded' ? 'graded' : submission ? 'submitted' : new Date(a.due) < now ? 'overdue' : 'todo'
    const isLate = !!submission?.submittedAt && new Date(submission.submittedAt) > new Date(a.due)
    const c = course(a.courseId)
    return { ...a, courseName: c.name, teacher: c.teacher, status, submission, isLate, late: status === 'overdue' || isLate }
  })
}

export const studentTasks = {
  list: (uid) => delay(loadTasks(uid)),
  async get(uid, id) {
    const t = loadTasks(uid).find((x) => x.id === id)
    if (!t) throw new Error('Tugas tidak ditemukan.')
    return delay(t)
  },
  async submit(uid, id, { answer, attachments }) {
    const t = loadTasks(uid).find((x) => x.id === id)
    if (!t) throw new Error('Tugas tidak ditemukan.')
    if (t.status === 'submitted' || t.status === 'graded') throw new Error('Tugas ini sudah dikumpulkan.')
    if (new Date(t.due) < new Date()) throw new Error('Batas waktu pengumpulan telah berakhir.')
    if (Object.keys(validateSubmission({ answer, files: attachments })).length) throw new Error('Data pengumpulan tidak valid.')
    const subs = store.get(SUB(uid), {})
    subs[id] = { answer: answer.trim(), attachments, submittedAt: new Date().toISOString() }
    store.set(SUB(uid), subs)
    emitNoticeChange()
    return delay(loadTasks(uid).find((x) => x.id === id))
  },
}
