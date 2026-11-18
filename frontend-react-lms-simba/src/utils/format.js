export const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
export const roleLabel = { admin: 'Administrator', teacher: 'Guru', student: 'Siswa' }
export const roleHome = { admin: '/admin/dashboard', teacher: '/teacher/dashboard', student: '/student/dashboard' }
export const formatDateTime = (d) => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export function timeAgo(iso, now = Date.now()) {
  const m = Math.max(0, Math.floor((now - new Date(iso)) / 60000))
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}j lalu` : `${Math.floor(h / 24)}h lalu`
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const p2 = (n) => String(n).padStart(2, '0')
export const formatSentTime = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} • ${p2(d.getHours())}:${p2(d.getMinutes())} WIB` }
export const formatDeadline = (iso) => { const d = new Date(iso); return `${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} (${p2(d.getHours())}:${p2(d.getMinutes())} WIB)` }
export const lateHours = (sent, due) => Math.max(0, Math.ceil((new Date(sent) - new Date(due)) / 3.6e6))
export function formatDue(iso, now = new Date()) {
  const d = new Date(iso)
  return d.toDateString() === now.toDateString() ? `Hari ini ${p2(d.getHours())}:${p2(d.getMinutes())}` : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
