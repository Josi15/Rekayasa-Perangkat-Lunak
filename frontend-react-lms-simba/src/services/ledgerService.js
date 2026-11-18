import { request } from './http'
import { db } from './db'
import { attendance } from './attendanceStore'
import { quizStore } from './quizStore'
import { ledgerStore as st } from './ledgerStore'
import { computeNA, predikatOf, isTuntas, seedScores } from '../data/ledger'
import { pick } from './mode'
import { ledgerApi } from './api/activityApi'

// Leger kelas X IPA 1. Rata Tugas diturunkan dari nilai tugas yang sudah diberikan guru (jika ada);
// Kuis CBT & PTS adalah data simulasi. Hanya PTS yang dapat disunting.
const validPts = (v) => v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100

const mockLedgerService = {
  get: () => request(() => {
    const rows = attendance.records.map((r, i) => {
      const seed = seedScores(i)
      const graded = db.submissions.filter((s) => s.studentId === r.studentId && s.status === 'graded')
      const tugas = graded.length ? Math.round((graded.reduce((s, g) => s + g.score, 0) / graded.length) * 10) / 10 : seed.tugas
      const pts = st.pts[r.studentId] ?? seed.pts
      const na = computeNA(tugas, seed.cbt, pts)
      return { no: i + 1, studentId: r.studentId, nisn: r.nisn, name: r.name, tugas, cbt: seed.cbt, pts, na, predikat: predikatOf(na), tuntas: isTuntas(na) }
    })
    return { className: attendance.session.className, rows, locked: st.locked, cbtSyncedAt: st.cbtSyncedAt, savedAt: st.savedAt }
  }),
  savePts: (map) => request(() => {
    if (st.locked) throw new Error('Leger terkunci. Buka kunci untuk mengubah nilai.')
    for (const [id, v] of Object.entries(map)) if (!validPts(v)) throw new Error('Skor PTS harus antara 0 dan 100.')
    for (const [id, v] of Object.entries(map)) st.pts[id] = Number(v)
    st.savedAt = Date.now(); return Object.keys(map).length
  }),
  setLocked: (locked) => request(() => { st.locked = locked; return locked }),
  pullCbt: () => request(() => {
    const quizzes = quizStore.quizzes.filter((q) => q.classIds.includes(1) && q.done > 0)
    quizzes.forEach((q) => { q.syncedAt = Date.now() })
    st.cbtSyncedAt = Date.now(); quizStore.updatedAt = Date.now()
    return quizzes.length
  }),
}

// Mode ditentukan VITE_USE_MOCK: mock = data simulasi (demo/vitest), selain itu = API Laravel (services/api).
export const ledgerService = pick(mockLedgerService, ledgerApi)
