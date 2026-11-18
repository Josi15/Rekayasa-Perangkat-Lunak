import { request } from './http'
import { db, nextId, findUser, userName, fail } from './db'
import { pick } from './mode'
import { subjectApi } from './api/masterApi'

const view = (s) => ({ ...s, teacherName: userName(s.teacherId), classCount: new Set(db.teachingClasses.filter((t) => t.subjectId === s.id).map((t) => t.classId)).size })

function validate(d, id) {
  if (!d.name?.trim()) fail('Nama mata pelajaran wajib diisi.')
  const code = String(d.code ?? '').trim().toUpperCase()
  if (!/^[A-Z0-9]{2,6}$/.test(code)) fail('Kode terdiri dari 2–6 huruf/angka.')
  if (db.subjects.some((s) => s.id !== id && s.code === code)) fail('Kode mapel sudah dipakai.')
  if (db.subjects.some((s) => s.id !== id && s.name.toLowerCase() === d.name.trim().toLowerCase())) fail('Nama mapel sudah ada.')
  if (findUser(d.teacherId)?.role !== 'teacher') fail('Guru pengampu harus seorang guru.')
  return code
}

const mockSubjectService = {
  list: () => request(() => db.subjects.map(view)),
  get: (id) => request(() => { const s = db.subjects.find((x) => x.id === Number(id)); return s ? view(s) : null }),
  create: (d) => request(() => {
    const code = validate(d)
    const s = { id: nextId('subjects'), name: d.name.trim(), code, teacherId: Number(d.teacherId), status: 'active' }
    db.subjects.push(s)
    return view(s)
  }),
  update: (id, d) => request(() => {
    const s = db.subjects.find((x) => x.id === Number(id))
    if (!s) fail('Mata pelajaran tidak ditemukan.')
    const code = validate({ ...s, ...d }, s.id)
    Object.assign(s, { name: (d.name ?? s.name).trim(), code, teacherId: Number(d.teacherId ?? s.teacherId) })
    return view(s)
  }),
  setStatus: (id, status) => request(() => {
    const s = db.subjects.find((x) => x.id === Number(id))
    if (!s) fail('Mata pelajaran tidak ditemukan.')
    if (!['active', 'archived'].includes(status)) fail('Status tidak valid.')
    if (status === 'archived' && db.teachingClasses.some((t) => t.subjectId === s.id && t.status === 'active')) fail('Mapel masih dipakai pengampuan aktif dan tidak dapat diarsipkan.')
    s.status = status
    return view(s)
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const subjectService = pick(mockSubjectService, subjectApi)
