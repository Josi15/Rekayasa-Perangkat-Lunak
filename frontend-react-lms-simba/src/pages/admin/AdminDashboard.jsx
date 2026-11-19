import { Link } from 'react-router-dom'
import { School, Users, UserRound, CalendarDays } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatisticCard from '../../components/common/StatisticCard.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { classScheduleService } from '../../services/index.js'
import { scheduleMeta } from '../../services/classSchedules.js'

export default function AdminDashboard() {
  const { user } = useAuth()
  const state = useAsync(classScheduleService.listClasses)
  return (
    <>
      <PageHeader title="Dashboard Admin" description={`Selamat datang, ${user.name}.`} breadcrumb={[{ label: 'Beranda' }, { label: 'Dashboard' }]} />
      <AsyncBoundary state={state}>
        {(classes) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatisticCard label="Kelas" value={classes.length} icon={School} />
              <StatisticCard label="Total siswa" value={classes.reduce((a, c) => a + c.students, 0)} icon={Users} />
              <StatisticCard label="Guru" value={scheduleMeta.teachers.length} icon={UserRound} />
              <StatisticCard label="Jadwal terdaftar" value={classes.reduce((a, c) => a + c.scheduleCount, 0)} icon={CalendarDays} />
            </div>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Kelengkapan jadwal per kelas</h2><Link to="/admin/classes" className="text-sm text-brand-600 hover:underline">Semua kelas</Link></div>
              <ul className="divide-y divide-slate-100 text-sm">
                {classes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <span><b className="text-slate-900">{c.name}</b> <span className="text-slate-500">· {c.homeroom}</span></span>
                    <span className="flex items-center gap-3">
                      <span className={c.scheduleCount ? 'text-slate-600' : 'text-amber-700'}>{c.scheduleCount ? `${c.scheduleCount} jadwal` : 'Belum ada jadwal'}</span>
                      <Link to={`/admin/schedules?class=${c.id}`} className="text-brand-600 hover:underline">Atur jadwal</Link>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
