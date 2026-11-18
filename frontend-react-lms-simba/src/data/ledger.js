// Konfigurasi leger SESUAI DESAIN UI/UX: NA = Tugas×30% + Kuis CBT×30% + PTS×40%; KKTP 75; A ≥ 90, B 75–89,9.
// Predikat untuk NA < 75 BELUM ditentukan di desain → ditampilkan "-". Mohon tim analyst melengkapi.
export const ledgerConfig = {
  weights: { tugas: 0.3, cbt: 0.3, pts: 0.4 }, kktp: 75, prevAvg: 86.6,
  predikat: [{ min: 90, label: 'A' }, { min: 75, label: 'B' }],
}
export const round1 = (n) => Math.round(n * 10) / 10
export const computeNA = (t, c, p) => round1(t * ledgerConfig.weights.tugas + c * ledgerConfig.weights.cbt + p * ledgerConfig.weights.pts)
export const predikatOf = (na) => ledgerConfig.predikat.find((p) => na >= p.min)?.label ?? '-'
export const isTuntas = (na) => na >= ledgerConfig.kktp

const head = [[95, 97, 97], [90, 92, 91], [92, 89, 90], [88, 86, 87.5], [93, 91, 94], [85, 84, 86], [89, 88, 89], [94, 95, 93]]
export const seedScores = (i) => (head[i] ? { tugas: head[i][0], cbt: head[i][1], pts: head[i][2] } : { tugas: 82 + ((i * 5) % 14), cbt: 80 + ((i * 7) % 16), pts: 78 + ((i * 3) % 18) })

// Ringkasan kelas dari baris { na, name, nisn }.
export function summarize(rows) {
  const n = rows.length
  const top = rows.reduce((b, r) => (!b || r.na > b.na ? r : b), null)
  const tuntas = rows.filter((r) => isTuntas(r.na)).length
  const avg = n ? round1(rows.reduce((s, r) => s + r.na, 0) / n) : null
  return { n, avg, delta: avg == null ? null : round1(avg - ledgerConfig.prevAvg), tuntas, tuntasPct: n ? round1((tuntas / n) * 100) : 0, top }
}
