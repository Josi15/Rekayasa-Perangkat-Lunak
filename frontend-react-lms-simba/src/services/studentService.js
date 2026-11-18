import { assignmentService } from './assignmentService'
import { submissionService } from './submissionService'
import { gradeService } from './gradeService'
import { request } from './http'
import { db, className, subjectName, userName, activeTeachings } from './db'
import { pick } from './mode'
import { studentApi } from './api/contentApi'

// Fasad tampilan siswa; seluruh data berasal dari domain service (satu sumber: db).
const mockStudentService = {
  listAssignments: assignmentService.forStudent,
  getAssignment: assignmentService.getForStudent,
  submit: submissionService.submit,
  listGrades: gradeService.forStudent,
  // Mapel yang diikuti = pengampuan aktif pada kelas siswa.
  listSubjects: (uid) => request(() => activeTeachings().filter((t) => t.studentIds.includes(Number(uid))).map((t) => {
    const subject = db.subjects.find((s) => s.id === t.subjectId)
    return {
      id: t.subjectId, name: subjectName(t.subjectId), code: subject?.code ?? '', teacherName: userName(t.teacherId), classId: t.classId, className: className(t.classId),
      materialCount: db.materials.filter((m) => m.status === 'published' && m.subjectId === t.subjectId && m.classIds.includes(t.classId)).length,
      openAssignments: db.assignments.filter((a) => a.status === 'published' && a.classId === t.classId && !db.submissions.some((x) => x.assignmentId === a.id && x.studentId === Number(uid))).length,
    }
  })),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const studentService = pick(mockStudentService, studentApi)
