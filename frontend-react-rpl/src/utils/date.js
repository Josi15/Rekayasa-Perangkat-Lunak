export const daysFromNow = (n, hour = 23) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 59, 0, 0)
  return d.toISOString()
}
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtDateTime = (iso) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export function timeLeft(iso) {
  const h = (new Date(iso) - new Date()) / 36e5
  if (h < 0) return 'Lewat tenggat'
  if (h < 24) return `${Math.ceil(h)} jam lagi`
  return `${Math.ceil(h / 24)} hari lagi`
}
// Kemunculan berikutnya sebuah jadwal mingguan (day: 1=Senin..5=Jumat).
export function nextOccurrence(day, start, end, now = new Date()) {
  const [h, m] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const d = new Date(now); d.setHours(h, m, 0, 0)
  const e = new Date(now); e.setHours(eh, em, 0, 0)
  let diff = (day - now.getDay() + 7) % 7
  if (diff === 0 && e <= now) diff = 7
  d.setDate(d.getDate() + diff)
  return d
}
export function dayLabel(d, now = new Date()) {
  const a = new Date(now); a.setHours(0, 0, 0, 0)
  const b = new Date(d); b.setHours(0, 0, 0, 0)
  const diff = Math.round((b - a) / 864e5)
  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Besok'
  return d.toLocaleDateString('id-ID', { weekday: 'long' })
}

export const dateKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
export const fromKey = (k) => new Date(`${k}T00:00:00`)
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
export const fmtLongDate = (d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const fmtShortDay = (d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
