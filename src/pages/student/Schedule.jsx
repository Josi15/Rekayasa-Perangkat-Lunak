import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { EmptyState } from '../../components/common/States.jsx'
import Chips from '../../components/student/Chips.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentSchedule } from '../../services/index.js'
import { addDays, dateKey, dayLabel, fmtLongDate, fmtShortDay, fromKey, startOfWeek } from '../../utils/date.js'

function Entry({ e, isNext }) {
  return (
    <li className={`rounded-lg border p-3 text-sm ${isNext ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2"><b className="text-slate-900">{e.courseName}</b>{isNext && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">Berikutnya</span>}</div>
      <p className="text-slate-600">{e.start} - {e.end} · {e.room}</p><p className="text-slate-500">{e.teacher}</p>
    </li>
  )
}

export default function Schedule() {
  const { user } = useAuth()
  const [view, setView] = useState('week')
  const [date, setDate] = useState(() => new Date())
  const weekKey = dateKey(startOfWeek(date))
  const state = useAsync(useCallback(() => studentSchedule.getWeek(user.id, fromKey(weekKey)), [user.id, weekKey]))
  const step = view === 'day' ? 1 : 7
  const todayKey = dateKey(new Date())

  return (
    <>
      <PageHeader title="Jadwal Pelajaran" breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Jadwal' }]} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chips value={view} onChange={setView} options={[['day', 'Harian'], ['week', 'Mingguan']]} />
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setDate(addDays(date, -step))} className="rounded-lg border border-slate-300 bg-white p-2" aria-label="Sebelumnya"><ChevronLeft className="size-4" /></button>
          <input type="date" value={dateKey(date)} onChange={(e) => e.target.value && setDate(fromKey(e.target.value))} aria-label="Pilih tanggal" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" />
          <button onClick={() => setDate(addDays(date, step))} className="rounded-lg border border-slate-300 bg-white p-2" aria-label="Berikutnya"><ChevronRight className="size-4" /></button>
          <button onClick={() => setDate(new Date())} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">Hari ini</button>
        </div>
      </div>
      <AsyncBoundary state={state}>
        {({ days, next }) => {
          const isNext = (e, key) => e.id === next.id && key === next.key
          const nextBanner = <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">Jadwal berikutnya: <b>{next.courseName}</b>, {dayLabel(new Date(next.when))} pukul {next.start} ({next.room}).</p>
          if (view === 'day') {
            const day = days.find((x) => x.key === dateKey(date))
            return (
              <>
                {nextBanner}
                <h2 className="mb-2 font-semibold text-slate-900">{fmtLongDate(date)}</h2>
                {!day || day.entries.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white"><EmptyState title="Tidak ada jadwal" description="Tidak ada pelajaran pada hari ini." /></div>
                  : <ul className="grid gap-2 sm:grid-cols-2">{day.entries.map((e) => <Entry key={e.id} e={e} isNext={isNext(e, day.key)} />)}</ul>}
              </>
            )
          }
          return (
            <>
              {nextBanner}
              <div className="grid gap-3 md:grid-cols-5">
                {days.map((day) => (
                  <section key={day.key} className={`rounded-xl border p-3 ${day.key === todayKey ? 'border-brand-500' : 'border-slate-200'} bg-slate-50`}>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">{fmtShortDay(day.date)}{day.key === todayKey && <span className="ml-1 text-xs font-normal text-brand-600">(hari ini)</span>}</h3>
                    {day.entries.length === 0 ? <p className="text-sm text-slate-500">Tidak ada jadwal</p> : <ul className="space-y-2">{day.entries.map((e) => <Entry key={e.id} e={e} isNext={isNext(e, day.key)} />)}</ul>}
                  </section>
                ))}
              </div>
            </>
          )
        }}
      </AsyncBoundary>
    </>
  )
}
