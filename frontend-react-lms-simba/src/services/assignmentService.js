import { request } from './http'
import { db, nextId, className, subjectName, studentClassIds, isLate, fail } from './db'
import { pick } from './mode'
import { assignmentApi } from './api/contentApi'

const find = (id) => db.assignments.find((a) => a.id === Number(id))
export const view = (a) => ({ ...a, className: className(a.classId), subjectName: subjectName(a.subjectId) })
const subjectOfClass = (classId) => db.teachingClasses.find((t) => t.classId === classId)?.subjectId ?? 1

// Tampilan siswa: tugas + status pengumpulannya sendiri.
const forStudentView = (uid, a) => {
  const s = db.submissions.find((x) => x.assignmentId === a.id && x.studentId === uid)
  return { ...view(a), submission: s ? { ...s, late: isLate(s, a) } : null, state: !s ? 'missing' : s.status === 'graded' ? 'graded' : 'submitted' }
}
export const visibleTo = (uid) => db.assignments.filter((a) => a.status === 'published' && studentClassIds(uid).includes(a.classId))

const mockAssignmentService = {
  list: () => request(() => db.assignments.map(view)),
  get: (id) => request(() => { const a = find(id); return a ? view(a) : null }),
  forStudent: (uid) => request(() => visibleTo(uid).map((a) => forStudentView(uid, a))),
  getForStudent: (uid, id) => request(() => { const a = visibleTo(uid).find((x) => x.id === Number(id)); return a ? forStudentView(uid, a) : null }),
  save: (data) => request(() => {
    if (data.id) {
      const i = db.assignments.findIndex((a) => a.id === data.id)
      if (i < 0) fail('Tugas tidak ditemukan.')
      db.assignments[i] = { ...db.assignments[i], ...data }
      return db.assignments[i]
    }
    const a = { subjectId: subjectOfClass(data.classId), ...data, id: nextId('assignments') }
    db.assignments.push(a)
    return a
  }),
  setStatus: (id, status) => request(() => { const a = find(id); if (!a) fail('Tugas tidak ditemukan.'); a.status = status; return true }),
  remove: (id) => request(() => {
    db.assignments = db.assignments.filter((a) => a.id !== id)
    db.submissions = db.submissions.filter((s) => s.assignmentId !== id)
    return true
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const assignmentService = pick(mockAssignmentService, assignmentApi)
