import { Link } from 'react-router-dom'
import { School, ClipboardList, Award, CalendarClock, Activity, Megaphone } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatisticCard from '../../components/common/StatisticCard.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import ProgressBar from '../../components/student/ProgressBar.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentService } from '../../services/index.js'
import { dayLabel, fmtDate, fmtDateTime, timeLeft } from '../../utils/date.js'
import { useCallback } from 'react'

function Card({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Icon className="size-5 text-brand-600" />{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const load = useCallback(() => studentService.getDashboard(user.id), [user.id])
  const state = useAsync(load)
  return (
    <>
      <PageHeader title={`Halo, ${user.name.split(' ')[0]}!`} description="Ringkasan belajar Anda hari ini." breadcrumb={[{ label: 'Beranda' }, { label: 'Dashboard' }]} />
      <AsyncBoundary state={state}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatisticCard label="Kelas diikuti" value={d.courseCount} icon={School} />
              <StatisticCard label="Tugas belum dikerjakan" value={d.todoCount} icon={ClipboardList} />
              <StatisticCard label="Tugas sudah dinilai" value={d.gradedCount} icon={Award} />
            </div>
            <Card title="Progres pembelajaran" icon={Activity} action={<Link to="/student/classes" className="text-sm text-brand-600 hover:underline">Lihat kelas</Link>}>
              <ProgressBar percent={d.progress.percent} label={`${d.progress.done} dari ${d.progress.total} materi dipelajari`} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {d.courses.map((c) => <Link key={c.id} to={`/student/classes/${c.id}`} className="block"><p className="mb-1 text-sm text-slate-700">{c.name}</p><ProgressBar percent={c.percent} /></Link>)}
              </div>
            </Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Jadwal terdekat" icon={CalendarClock} action={<Link to="/student/schedule" className="text-sm text-brand-600 hover:underline">Lihat jadwal</Link>}>
                <ul className="divide-y divide-slate-100">
                  {d.schedules.map((s) => (
                    <li key={s.id} className="flex justify-between py-2 text-sm">
                      <span><b className="text-slate-900">{s.courseName}</b><br /><span className="text-slate-500">{s.room}</span></span>
                      <span className="text-right text-slate-600">{dayLabel(new Date(s.when))}<br />{s.start} - {s.end}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Tugas mendekati tenggat" icon={ClipboardList} action={<Link to="/student/tasks" className="text-sm text-brand-600 hover:underline">Semua tugas</Link>}>
                {d.deadlines.length === 0 ? <EmptyState title="Tidak ada tugas tertunda" /> : (
                  <ul className="divide-y divide-slate-100">
                    {d.deadlines.map((a) => (
                      <li key={a.id}><Link to={`/student/tasks/${a.id}`} className="flex justify-between gap-3 py-2 text-sm hover:bg-slate-50">
                        <span><b className="text-slate-900">{a.title}</b><br /><span className="text-slate-500">{a.courseName}</span></span>
                        <span className="text-right text-amber-700">{timeLeft(a.due)}<br /><span className="text-slate-500">{fmtDate(a.due)}</span></span>
                      </Link></li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Aktivitas terbaru" icon={Activity}>
                <ul className="space-y-2 text-sm">
                  {d.activities.map((a) => <li key={a.id} className="flex justify-between gap-3"><span className="text-slate-700">{a.text}</span><span className="shrink-0 text-xs text-slate-500">{fmtDateTime(a.at)}</span></li>)}
                </ul>
              </Card>
              <Card title="Pengumuman terbaru" icon={Megaphone} action={<Link to="/student/announcements" className="text-sm text-brand-600 hover:underline">Semua</Link>}>
                <ul className="space-y-3 text-sm">
                  {d.announcements.map((a) => <li key={a.id}><Link to={`/student/announcements/${a.id}`} className="block hover:bg-slate-50"><b className="text-slate-900">{a.title}{!a.read && <span className="ml-2 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">Baru</span>}</b><p className="text-slate-600">{a.body}</p><span className="text-xs text-slate-500">{fmtDate(a.at)}</span></Link></li>)}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
