import { request } from './http'
import { db, findUser, className, subjectName } from './db'
import { materialService } from './materialService'
import { pick } from './mode'
import { teacherApi } from './api/contentApi'

// Tampilan khusus guru. Data tetap dari db bersama; operasi materi didelegasikan ke materialService.
const TEACHER_ID = 2 // guru demo yang login; pada fase API diganti user dari sesi
const mine = () => db.teachingClasses.filter((t) => t.teacherId === TEACHER_ID)
const students = (ids) => ids.map((id) => findUser(id)).filter((u) => u?.role === 'student')

const enrich = (tc) => ({
  ...tc, id: tc.classId, name: className(tc.classId), subject: subjectName(tc.subjectId),
  students: students(tc.studentIds),
})
const classOptions = () => mine().filter((c) => c.status === 'active').map((c) => ({ id: c.classId, name: className(c.classId) }))

const mockTeacherService = {
  listClasses: () => request(() => mine().map(enrich)),
  getClass: (id) => request(() => {
    const tc = mine().find((c) => c.classId === Number(id))
    if (!tc) return null
    return { ...enrich(tc), materials: db.materials.filter((m) => m.classIds.includes(tc.classId)).map((m) => ({ ...m, classNames: m.classIds.map(className) })) }
  }),
  classOptions: () => request(classOptions),

  materialsOverview: () => request(() => {
    const items = db.materials.map((m) => ({ ...m, classNames: m.classIds.map(className) }))
    const active = mine().filter((c) => c.status === 'active')
    const reached = new Set(db.materials.filter((m) => m.status === 'published').flatMap((m) => m.classIds))
    const reach = new Set(active.filter((c) => reached.has(c.classId)).flatMap((c) => c.studentIds)).size
    return { items, reach, classOptions: classOptions() }
  }),
  listMaterials: materialService.list,
  getMaterial: materialService.get,
  saveMaterial: materialService.save,
  deleteMaterial: materialService.remove,
  moveMaterial: materialService.move,
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const teacherService = pick(mockTeacherService, teacherApi)
