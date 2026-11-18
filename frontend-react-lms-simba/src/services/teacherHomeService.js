import { request } from './http'
import { db, userName, className } from './db'
import { teacherHome } from '../data/teacherHome'
import { attendance, statsOf } from './attendanceStore'
import { profileStore } from './profileStore'
import { pick } from './mode'
import { teacherHomeApi } from './api/teacherViewApi'

const classOf = (s) => db.assignments.find((a) => a.id === s.assignmentId)?.classId

// Antrean evaluasi & pengumpulan terbaru diturunkan dari store bersama; sisanya statis.
const mockTeacherHomeService = {
  get: () => request(() => {
    const ungraded = db.submissions.filter((s) => s.status === 'submitted')
    const recent = [...db.submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 3).map((s) => {
      const a = db.assignments.find((x) => x.id === s.assignmentId)
      return { id: s.id, assignmentId: a.id, name: userName(s.studentId), file: s.attachments[0]?.name ?? a.title, className: className(a.classId), submittedAt: s.submittedAt }
    })
    const st = statsOf(attendance.records)
    const sick = attendance.records.find((r) => r.status === 'S' || r.status === 'I')
    const homeroom = { ...teacherHome.homeroom, total: st.total, present: st.h, permit: st.i, sick: st.s, note: sick ? `${sick.name} (${sick.status === 'S' ? 'Sakit' : 'Izin'} - ${sick.method.label})` : 'Tidak ada siswa sakit/izin hari ini' }
    return { ...teacherHome, nip: profileStore.nip, homeroom, queue: { count: ungraded.length, classCount: new Set(ungraded.map(classOf)).size }, recent }
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const teacherHomeService = pick(mockTeacherHomeService, teacherHomeApi)
