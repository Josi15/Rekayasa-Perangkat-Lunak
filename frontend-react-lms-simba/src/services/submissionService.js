import { request } from './http'
import { db, nextId, userName, isLate, fail } from './db'
import { visibleTo } from './assignmentService'
import { pick } from './mode'
import { submissionApi } from './api/contentApi'

const mockSubmissionService = {
  list: (assignmentId) => request(() => db.submissions.filter((s) => assignmentId === undefined || s.assignmentId === Number(assignmentId)).map((s) => ({ ...s, studentName: userName(s.studentId) }))),
  mine: (uid) => request(() => db.submissions.filter((s) => s.studentId === Number(uid)).map((s) => ({ ...s, late: isLate(s, db.assignments.find((a) => a.id === s.assignmentId) ?? { dueDate: s.submittedAt }) }))),
  submit: (uid, assignmentId, { answer = '', attachments = [] }) => request(() => {
    const a = visibleTo(uid).find((x) => x.id === Number(assignmentId))
    if (!a) fail('Tugas tidak tersedia.')
    if (db.submissions.some((s) => s.assignmentId === a.id && s.studentId === uid)) fail('Tugas sudah dikumpulkan.')
    if (!answer.trim() && attachments.length === 0) fail('Isi jawaban atau pilih lampiran.')
    db.submissions.push({ id: nextId('submissions'), assignmentId: a.id, studentId: uid, answer, attachments, submittedAt: new Date().toISOString(), status: 'submitted', score: null, feedback: '' })
    return true
  }),
  grade: (submissionId, { score, feedback }) => request(() => {
    const s = db.submissions.find((x) => x.id === Number(submissionId))
    if (!s) fail('Pengumpulan tidak ditemukan.')
    const n = Number(score)
    if (score === '' || !Number.isFinite(n) || n < 0 || n > 100) fail('Nilai harus antara 0 dan 100.')
    Object.assign(s, { score: n, feedback, status: 'graded', gradedAt: new Date().toISOString() })
    return true
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const submissionService = pick(mockSubmissionService, submissionApi)
