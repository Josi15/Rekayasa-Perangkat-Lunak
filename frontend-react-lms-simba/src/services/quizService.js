import { request } from './http'
import { quizStore as st } from './quizStore'
import { db, className as cname } from './db'
import { pick } from './mode'
import { quizApi } from './api/activityApi'
const view = (q) => ({ ...q, classNames: q.classIds.map(cname), rombel: q.classIds.length ? q.classIds.map(cname).join(', ') : q.audience ?? '-' })
const touch = () => { st.updatedAt = Date.now() }
const get = (id) => { const q = st.quizzes.find((x) => x.id === id); if (!q) throw new Error('Kuis tidak ditemukan.'); return q }

// Simulasi: tidak ada koneksi ke Google Forms API; semua perubahan hanya di memori.
const mockQuizService = {
  list: () => request(() => {
    const quizzes = st.quizzes.map(view)
    const running = quizzes.filter((q) => q.status === 'running')
    const done = running.reduce((s, q) => s + q.done, 0), total = running.reduce((s, q) => s + q.total, 0)
    const scored = quizzes.filter((q) => q.avg != null && q.done > 0), w = scored.reduce((s, q) => s + q.done, 0)
    return {
      quizzes, updatedAt: st.updatedAt, token: st.token.value,
      stats: { running: running.length, done, total, pct: total ? Math.round((done / total) * 1000) / 10 : 0, avg: w ? Math.round((scored.reduce((s, q) => s + q.avg * q.done, 0) / w) * 10) / 10 : null },
      classOptions: db.teachingClasses.filter((c) => c.status === 'active' && c.teacherId === 2).map((c) => ({ id: c.classId, name: cname(c.classId) })),
    }
  }),
  create: (d) => request(() => {
    const total = d.classIds.reduce((s, id) => s + (db.classes.find((c) => c.id === id)?.size ?? 0), 0)
    const q = { ...d, id: st.nextId++, done: 0, total, avg: null, syncedAt: null }
    st.quizzes.push(q); touch(); return q
  }),
  setStatus: (id, status) => request(() => { get(id).status = status; touch(); return true }),
  sync: (id) => request(() => {
    const q = get(id)
    if (q.done === 0) throw new Error('Belum ada respon untuk disinkronkan.')
    q.syncedAt = Date.now(); touch(); return true
  }),
  remove: (id) => request(() => { get(id); st.quizzes = st.quizzes.filter((q) => q.id !== id); touch(); return true }),
  newToken: () => request(() => {
    let v
    do { v = `MTK-${1000 + Math.floor(Math.random() * 9000)}` } while (v === st.token.value)
    st.token = { value: v, issuedAt: Date.now() }; return v
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const quizService = pick(mockQuizService, quizApi)
