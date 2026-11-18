// Pembantu tampilan siswa (murni, tanpa efek samping) — dipakai halaman siswa & diuji di test/student-5c.test.jsx.
export const DAY_LABEL = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 7: 'Minggu' }
// Indeks hari seperti data jadwal: 1 = Senin … 7 = Minggu (getDay() JS: 0 = Minggu).
export const dayIndexOf = (d = new Date()) => d.getDay() || 7

// Status tugas dari sisi siswa: todo | overdue | submitted | graded | closed (ditutup guru dan belum dikumpulkan).
export function taskState(a, now = Date.now()) {
  if (a.state === 'graded') return 'graded'
  if (a.state === 'submitted') return 'submitted'
  if (a.status === 'archived') return 'closed'
  return new Date(a.dueDate).getTime() < now ? 'overdue' : 'todo'
}
export const isOpen = (state) => state === 'todo' || state === 'overdue'

export function timeLeft(iso, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  const abs = Math.abs(diff)
  const day = Math.floor(abs / 864e5), hour = Math.floor(abs / 36e5), min = Math.floor(abs / 6e4)
  const span = day >= 1 ? `${day} hari` : hour >= 1 ? `${hour} jam` : `${Math.max(1, min)} menit`
  return diff >= 0 ? `${span} lagi` : `terlambat ${span}`
}

const toMin = (t) => Number(String(t).slice(0, 2)) * 60 + Number(String(t).slice(3, 5))
// Jadwal siswa berupa POLA MINGGUAN (hari + jam). Kembalikan kemunculan berikutnya (atau yang sedang berlangsung).
export function nextSession(list, now = new Date()) {
  let best = null
  for (const s of list) {
    const length = s.endTime ? Math.max(1, toMin(s.endTime) - toMin(s.time)) : 90
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() + ((s.dayIndex - dayIndexOf(now) + 7) % 7))
    start.setMinutes(toMin(s.time))
    if (start.getTime() + length * 6e4 <= now.getTime()) start.setDate(start.getDate() + 7)
    if (!best || start < best.when) best = { ...s, when: start, live: start <= now }
  }
  return best
}
export const sessionLabel = (n) => `${n.live ? 'sedang berlangsung' : DAY_LABEL[dayIndexOf(n.when)]} pukul ${n.time}`

export const average = (nums) => (nums.length ? Math.round((nums.reduce((s, x) => s + x, 0) / nums.length) * 10) / 10 : null)
