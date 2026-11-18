import { request } from './http'
import { db, userName, findUser, className, classStudentIds, isLate } from './db'
import { assignmentService, view } from './assignmentService'
import { submissionService } from './submissionService'
import { pick } from './mode'
import { teacherAssignmentApi } from './api/contentApi'

export { isLate }
const findA = (id) => db.assignments.find((a) => a.id === Number(id))

const mockTeacherAssignmentService = {
  list: () => request(() => db.assignments.map((a) => ({ ...view(a), submitted: db.submissions.filter((s) => s.assignmentId === a.id).length, total: classStudentIds(a.classId).length }))),
  gradingOverview: (classId) => request(() => {
    const asgs = db.assignments.filter((a) => a.classId === classId && a.status === 'published').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    const subs = db.submissions.filter((s) => asgs.some((a) => a.id === s.assignmentId))
    const onTime = subs.filter((s) => !isLate(s, asgs.find((a) => a.id === s.assignmentId))).length
    return { assignments: asgs.map(view), pending: subs.filter((s) => s.status === 'submitted').length, onTimePct: subs.length ? Math.round((onTime / subs.length) * 1000) / 10 : null }
  }),
  get: assignmentService.get,
  save: assignmentService.save,
  setStatus: assignmentService.setStatus,
  remove: assignmentService.remove,
  grade: submissionService.grade,
  roster: (id) => request(() => {
    const a = findA(id)
    if (!a) return null
    const rows = classStudentIds(a.classId).map((sid) => {
      const s = db.submissions.find((x) => x.assignmentId === a.id && x.studentId === sid)
      return { id: sid, name: userName(sid), nisn: findUser(sid)?.nisn ?? '-', submission: s ? { ...s, late: isLate(s, a) } : null, state: !s ? 'missing' : s.status === 'graded' ? 'graded' : 'submitted' }
    })
    return { assignment: view(a), rows }
  }),
  recap: () => request(() => db.submissions.map((s) => {
    const a = findA(s.assignmentId)
    return { id: s.id, studentName: userName(s.studentId), classId: a.classId, className: className(a.classId), assignmentId: a.id, assignmentTitle: a.title, status: s.status, score: s.score, late: isLate(s, a) }
  })),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const teacherAssignmentService = pick(mockTeacherAssignmentService, teacherAssignmentApi)
