import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CalendarDays, ClipboardList, Megaphone, DoorOpen, UserCheck } from 'lucide-react'
import { Card, Pill } from '../../components/student/ui.jsx'
import CheckInCard from '../../components/student/CheckInCard.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentAttendance, studentNotices, studentSchedule, studentTasks } from '../../services/index.js'
import { profileSeed } from '../../data/student.js'
import { fmtDate, timeLeft } from '../../utils/date.js'
import { btnPrimary } from '../../utils/styles.js'

const greeting = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam' }

export default function StudentDashboard() {
  const { user } = useAuth()
  const p = profileSeed[user.id]
  const state = useAsync(useCallback(() => Promise.all([studentSchedule.getToday(user.id), studentAttendance.get(user.id), studentTasks.list(user.id), studentNotices.listAnnouncements(user.id)]), [user.id]))
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600"><span className="size-2 rounded-full bg-simba-lime" />{today}</p>
        <h1 className="text-3xl font-extrabold text-slate-900">{greeting()},<br />{user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Kelas {p.className} · NISN {p.nisn}</p>
      </div>
      <AsyncBoundary state={state}>
        {([today_, att, tasks, notices]) => {
          const pending = tasks.filter((t) => t.status !== 'graded').sort((a, b) => (a.status === 'submitted') - (b.status === 'submitted') || new Date(a.due) - new Date(b.due)).slice(0, 4)
          const range = today_.sessions.length ? `${today_.sessions[0].start} - ${today_.sessions.at(-1).end} WIB` : ''
          return (
            <>
              <Card>
                <div className="flex items-start justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Presensi semester</p><UserCheck className="size-5 text-brand-600" /></div>
                <p className="mt-1 flex items-center gap-3 text-3xl font-extrabold text-slate-900">{String(att.pct).replace('.', ',')}% <Pill>{att.label}</Pill></p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${att.pct}%` }} /></div>
                <p className="mt-2 flex justify-between text-xs text-slate-500"><span>Hadir {att.present} dari {att.total} sesi tatap muka</span><span>{att.permit} izin</span></p>
              </Card>
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                  <Card title="Jadwal Pembelajaran Hari Ini" icon={CalendarDays} action={<span className="text-xs text-slate-500">{today_.sessions.length ? `${today_.sessions.length} Mapel • ${range}` : ''}</span>}>
                    {today_.sessions.length === 0 ? <EmptyState title="Tidak ada jadwal hari ini" description="Nikmati hari libur Anda." /> : (
                      <>
                        {today_.current ? (
                          <div className="rounded-xl border-l-4 border-brand-600 bg-simba-bg p-4">
                            <p className="flex items-center gap-2 text-xs"><Pill>● SESI BERLANGSUNG</Pill><span className="text-slate-500">{today_.current.start} - {today_.current.end} WIB · sisa {today_.current.remaining} menit</span></p>
                            <h3 className="mt-2 text-xl font-bold text-slate-900">{today_.current.courseName}</h3>
                            <p className="text-sm text-slate-600">{today_.current.room} · {today_.current.teacher}</p>
                            <Link to={`/student/classes/${today_.current.courseId}`} className={`${btnPrimary} mt-3`}><DoorOpen className="size-4" />Masuk Ruang Kelas</Link>
                          </div>
                        ) : <p className="rounded-xl bg-simba-bg p-4 text-sm text-slate-600">{today_.next ? `Belum ada sesi berlangsung. Sesi berikutnya pukul ${today_.next.start} WIB.` : 'Seluruh sesi hari ini telah selesai.'}</p>}
                        <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mata pelajaran berikutnya</p>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {today_.sessions.filter((s) => s.state === 'upcoming').map((s) => (
                            <li key={s.id}><Link to={`/student/classes/${s.courseId}`} className="flex items-center justify-between rounded-xl border border-simba-line p-3 text-sm hover:bg-simba-bg"><span><b className="block text-slate-900">{s.courseName}</b><span className="text-xs text-slate-500">{s.room} · {s.teacher}</span></span><span className="flex items-center gap-1 text-xs text-slate-500">{s.start}-{s.end}<ChevronRight className="size-4" /></span></Link></li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Card>
                  <Card title="Daftar Tugas Penting Mendatang" icon={ClipboardList} action={<Link to="/student/tasks" className="text-xs font-semibold text-brand-600 hover:underline">Semua Tugas ›</Link>}>
                    {pending.length === 0 ? <EmptyState title="Tidak ada tugas tertunda" /> : (
                      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-simba-bg text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Mata Pelajaran</th><th className="px-3 py-2">Tugas</th><th className="px-3 py-2">Batas Waktu</th><th className="px-3 py-2">Status & Aksi</th></tr></thead>
                        <tbody className="divide-y divide-simba-line">
                          {pending.map((t) => (
                            <tr key={t.id}>
                              <td className="px-3 py-3 font-semibold text-slate-900">{t.courseName}</td>
                              <td className="px-3 py-3"><Link to={`/student/tasks/${t.id}`} className="hover:text-brand-700">{t.title}</Link></td>
                              <td className="px-3 py-3 text-xs"><span className={t.status === 'todo' ? 'font-semibold text-red-600' : 'text-slate-500'}>{fmtDate(t.due)}</span><br />{t.status === 'todo' ? timeLeft(t.due) : ''}</td>
                              <td className="px-3 py-3">{t.status === 'todo' ? <Link to={`/student/tasks/${t.id}`} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">Unggah Berkas</Link> : <Pill tone={t.status === 'overdue' ? 'red' : 'green'}>{t.status === 'overdue' ? 'Terlambat' : 'Terkumpul'}</Pill>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    )}
                  </Card>
                </div>
                <div className="space-y-5">
                  <CheckInCard uid={user.id} checkedIn={att.checkedIn} onChanged={state.reload} />
                  <Card title="Warta & Pengumuman" icon={Megaphone} action={<Link to="/student/announcements" className="text-xs font-semibold text-brand-600 hover:underline">Semua</Link>}>
                    <ul className="space-y-3">
                      {notices.slice(0, 2).map((a) => (
                        <li key={a.id}><Link to={`/student/announcements/${a.id}`} className="block rounded-xl bg-simba-bg p-3 hover:bg-brand-100">
                          <p className="flex justify-between text-[10px] font-bold uppercase text-brand-700"><span>{a.category}{!a.read && ' · BARU'}</span><span className="font-normal text-slate-500">{fmtDate(a.at)}</span></p>
                          <b className="mt-1 block text-sm text-slate-900">{a.title}</b><p className="line-clamp-2 text-xs text-slate-600">{a.body.replace(/\n+/g, ' ')}</p>
                        </Link></li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            </>
          )
        }}
      </AsyncBoundary>
    </div>
  )
}
