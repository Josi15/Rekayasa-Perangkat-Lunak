import { useCallback, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import Chips from '../../components/student/Chips'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { scheduleService } from '../../services'
import { DAY_LABEL, dayIndexOf, nextSession, sessionLabel } from '../../utils/student'

function Entry({ s, next }) {
  const isNext = next && next.id === s.id
  return (
    <li className={`rounded-lg border p-3 text-sm ${isNext ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-slate-900">{s.subjectName}</p>
        {isNext && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">{next.live ? 'Berlangsung' : 'Berikutnya'}</span>}
      </div>
      <p className="text-slate-600">{s.time}{s.endTime ? ` - ${s.endTime}` : ''}{s.room && s.room !== '-' ? ` · ${s.room}` : ''}</p>
      <p className="text-xs text-slate-500">{s.teacherName}</p>
    </li>
  )
}

export default function StudentSchedulePage() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => scheduleService.forStudent(user.id), [user.id]))
  const today = dayIndexOf()
  const [view, setView] = useState('week')
  const [picked, setPicked] = useState(null)
  const day = picked ?? today

  return (
    <>
      <PageHeader title="Jadwal Pelajaran" description="Jadwal mingguan kelas Anda." breadcrumbs={[{ label: 'Beranda', to: '/student/dashboard' }, { label: 'Jadwal' }]} />
      <AsyncBoundary state={state}>
        {(list) => <Body list={list} view={view} setView={setView} day={day} setDay={setPicked} today={today} />}
      </AsyncBoundary>
    </>
  )
}

function Body({ list, view, setView, day, setDay, today }) {
  const next = useMemo(() => nextSession(list), [list])
  // Senin–Jumat selalu tampil; Sabtu/Minggu hanya bila ada sesi.
  const days = useMemo(() => [1, 2, 3, 4, 5, ...[6, 7].filter((d) => list.some((s) => s.dayIndex === d))], [list])
  if (list.length === 0) return <div className="card"><EmptyState title="Belum ada jadwal" /></div>
  const of = (d) => list.filter((s) => s.dayIndex === d)
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Chips label="Tampilan jadwal" value={view} onChange={setView} options={[['day', 'Harian'], ['week', 'Mingguan']]} />
        {view === 'day' && (
          <div role="tablist" aria-label="Pilih hari" className="flex flex-wrap gap-1">
            {days.map((d) => <button key={d} role="tab" aria-selected={day === d} onClick={() => setDay(d)} className={`rounded-lg px-3 py-1.5 text-sm ${day === d ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 hover:bg-brand-50'}`}>{DAY_LABEL[d]}{d === today ? ' (hari ini)' : ''}</button>)}
          </div>
        )}
      </div>
      {next && <p role="note" className="mb-4 rounded-lg bg-brand-100 px-4 py-3 text-sm text-brand-700">{`Jadwal berikutnya: ${next.subjectName}, ${sessionLabel(next)}${next.room && next.room !== '-' ? ` (${next.room})` : ''}.`}</p>}
      {view === 'day' ? (
        <section aria-label={DAY_LABEL[day]}>
          {of(day).length === 0 ? <div className="card"><EmptyState title="Tidak ada jadwal" description={`Tidak ada pelajaran pada hari ${DAY_LABEL[day]}.`} /></div> : <ul className="grid gap-2 sm:grid-cols-2">{of(day).map((s) => <Entry key={s.id} s={s} next={next} />)}</ul>}
        </section>
      ) : (
        <div className={`grid gap-3 ${days.length >= 6 ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-5'}`}>
          {days.map((d) => (
            <section key={d} aria-label={DAY_LABEL[d]} className={`card p-3 ${d === today ? 'border-brand-500 ring-1 ring-brand-500' : ''}`}>
              <h2 className="mb-2 text-sm font-semibold text-slate-900">{DAY_LABEL[d]}{d === today && <span className="ml-1 text-xs font-normal text-brand-600">(hari ini)</span>}</h2>
              {of(d).length === 0 ? <p className="text-sm text-slate-400">Tidak ada jadwal</p> : <ul className="space-y-2">{of(d).map((s) => <Entry key={s.id} s={s} next={next} />)}</ul>}
            </section>
          ))}
        </div>
      )}
    </>
  )
}
