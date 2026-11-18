import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, BarChart3, Hourglass, BookOpen, CalendarClock, Megaphone, CalendarDays } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatisticCard from '../../components/common/StatisticCard'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { studentService, scheduleService, announcementService } from '../../services'
import { formatDate, formatDateTime } from '../../utils/format'
import { taskState, isOpen, timeLeft, dayIndexOf, nextSession, sessionLabel, average } from '../../utils/student'

function Panel({ title, icon: Icon, to, link, label, children }) {
  return (
    <section className="card p-5" aria-label={label ?? title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Icon size={18} className="text-brand-600" />{title}</h2>
        {to && <Link to={to} className="text-sm text-brand-600 hover:underline">{link}</Link>}
      </div>
      {children}
    </section>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const load = useCallback(() => Promise.all([
    studentService.listAssignments(user.id), studentService.listGrades(user.id), studentService.listSubjects(user.id),
    scheduleService.forStudent(user.id), announcementService.forRole('student'),
  ]), [user.id])
  const state = useAsync(load)
  const [now] = useState(() => Date.now())
  return (
    <>
      <PageHeader title={`Halo, ${String(user.name).split(' ')[0]}!`} description="Ringkasan belajar Anda hari ini." breadcrumbs={[{ label: 'Beranda' }, { label: 'Dashboard' }]} />
      <AsyncBoundary state={state}>
        {([assignments, grades, subjects, schedule, announcements]) => {
          const states = assignments.map((a) => [a, taskState(a, now)])
          const open = states.filter(([, s]) => isOpen(s)).map(([a]) => a).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          const waiting = states.filter(([, s]) => s === 'submitted').length
          const avg = average(grades.map((g) => g.score))
          const todays = schedule.filter((x) => x.dayIndex === dayIndexOf())
          const next = nextSession(schedule)
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatisticCard label="Mata pelajaran" value={subjects.length} icon={BookOpen} />
                <StatisticCard label="Tugas belum dikumpulkan" value={open.length} icon={ClipboardList} />
                <StatisticCard label="Menunggu penilaian" value={waiting} icon={Hourglass} />
                <StatisticCard label="Rata-rata nilai" value={avg === null ? '-' : `${avg} / 100`} icon={BarChart3} hint={grades.length ? `dari ${grades.length} nilai` : 'Belum ada nilai'} />
              </div>
              {next && <p role="note" className="rounded-lg bg-brand-100 px-4 py-3 text-sm text-brand-700">{`Pelajaran berikutnya: ${next.subjectName}, ${sessionLabel(next)}${next.room && next.room !== '-' ? ` (${next.room})` : ''}.`}</p>}
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Jadwal hari ini" icon={CalendarDays} to="/student/schedule" link="Lihat jadwal">
                  {todays.length === 0 ? <p className="text-sm text-slate-500">Tidak ada jadwal hari ini.</p> : (
                    <ul className="divide-y divide-slate-100 text-sm">{todays.map((x) => (
                      <li key={x.id} className="flex justify-between gap-3 py-2"><span className="font-medium text-slate-900">{x.subjectName}</span><span className="text-right text-slate-500">{x.time}{x.endTime ? ` - ${x.endTime}` : ''}{x.room && x.room !== '-' ? ` · ${x.room}` : ''}</span></li>
                    ))}</ul>
                  )}
                </Panel>
                <Panel title="Tugas mendekati tenggat" icon={CalendarClock} to="/student/assignments" link="Semua tugas">
                  {open.length === 0 ? <p className="text-sm text-slate-500">Tidak ada tugas tertunda.</p> : (
                    <ul className="divide-y divide-slate-100 text-sm">{open.slice(0, 5).map((a) => (
                      <li key={a.id}><Link to={`/student/assignments/${a.id}`} className="flex justify-between gap-3 py-2 hover:bg-slate-50">
                        <span><span className="block font-medium text-slate-900">{a.title}</span><span className="text-slate-500">{a.subjectName}</span></span>
                        <span className="text-right"><span className={`block ${new Date(a.dueDate) < now ? 'text-red-600' : 'text-amber-700'}`}>{timeLeft(a.dueDate, now)}</span><span className="text-xs text-slate-500">{formatDateTime(a.dueDate)}</span></span>
                      </Link></li>
                    ))}</ul>
                  )}
                </Panel>
                <Panel title="Mata pelajaran" icon={BookOpen} to="/student/subjects" link="Lihat semua">
                  {subjects.length === 0 ? <p className="text-sm text-slate-500">Belum terdaftar pada mata pelajaran.</p> : (
                    <ul className="divide-y divide-slate-100 text-sm">{subjects.slice(0, 5).map((s) => (
                      <li key={`${s.id}-${s.classId}`} className="flex justify-between gap-3 py-2"><span className="font-medium text-slate-900">{s.name}</span><span className="text-slate-500">{s.materialCount} materi · {s.openAssignments} tugas terbuka</span></li>
                    ))}</ul>
                  )}
                </Panel>
                <Panel title="Pengumuman terbaru" icon={Megaphone} to="/student/announcements" link="Semua">
                  {announcements.length === 0 ? <p className="text-sm text-slate-500">Belum ada pengumuman.</p> : (
                    <ul className="space-y-3 text-sm">{announcements.slice(0, 3).map((x) => (
                      <li key={x.id}><Link to={`/student/announcements/${x.id}`} className="block hover:bg-slate-50"><span className="block font-medium text-slate-900">{x.title}</span><span className="line-clamp-2 text-slate-600">{x.body}</span><span className="text-xs text-slate-500">{formatDate(x.createdAt)}</span></Link></li>
                    ))}</ul>
                  )}
                </Panel>
              </div>
            </div>
          )
        }}
      </AsyncBoundary>
    </>
  )
}
