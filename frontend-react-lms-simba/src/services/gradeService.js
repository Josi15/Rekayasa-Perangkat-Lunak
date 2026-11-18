import { request } from './http'
import { db, userName, className, subjectName } from './db'
import { pick } from './mode'
import { gradeApi } from './api/contentApi'

// Nilai DITURUNKAN dari pengumpulan yang sudah dinilai (satu sumber: db.submissions), bukan tabel terpisah.
const rows = () => db.submissions.filter((s) => s.status === 'graded').map((s) => {
  const a = db.assignments.find((x) => x.id === s.assignmentId)
  return {
    id: s.id, studentId: s.studentId, studentName: userName(s.studentId), assignmentId: s.assignmentId,
    assignmentTitle: a?.title ?? '-', classId: a?.classId, className: className(a?.classId), subjectName: subjectName(a?.subjectId),
    score: s.score, feedback: s.feedback, gradedAt: s.gradedAt ?? null,
  }
})
const avg = (list) => (list.length ? Math.round((list.reduce((s, r) => s + r.score, 0) / list.length) * 10) / 10 : null)

const mockGradeService = {
  list: () => request(() => rows()),
  forStudent: (uid) => request(() => rows().filter((r) => r.studentId === Number(uid))),
  summary: () => request(() => { const r = rows(); return { count: r.length, average: avg(r), highest: r.length ? Math.max(...r.map((x) => x.score)) : null } }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const gradeService = pick(mockGradeService, gradeApi)
