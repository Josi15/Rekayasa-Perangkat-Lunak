import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Printer, CalendarRange, Users, Radio, TriangleAlert, ChevronLeft, ChevronRight, Pencil, Trash2, UserRound, DoorOpen } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import EmptyState from '../../components/common/EmptyState'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import FormModal from '../../components/forms/FormModal'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { scheduleService, classService, subjectService, userService, serviceMode } from '../../services'
import { dayKey, weekDays, conflictIds } from '../../services/api/adapt'

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const shift = (date, days) => { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + days); return dayKey(d) }
const longDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
const minutes = (s) => Math.max(0, Math.round((new Date(s.endsAt) - new Date(s.startsAt)) / 60000))
const phase = (s, now) => (new Date(s.endsAt) <= now ? 'done' : new Date(s.startsAt) <= now ? 'live' : 'next')
const PHASE = { done: ['Selesai', 'gray'], live: ['Sedang berlangsung', 'brand'], next: ['Terjadwal', 'warn'] }

function Session({ s, now, bad, onEdit, onDelete }) {
  const [label, tone] = PHASE[phase(s, now)]
  const locked = serviceMode.live && new Date(s.startsAt) <= now // backend menolak ubah/hapus sesi yang sudah mulai
  return (
    <article className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${phase(s, now) === 'live' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
      <div className="w-24 shrink-0"><b className="block text-lg">{s.time}</b><span className="text-xs text-slate-500">s.d. {s.endTime} · {minutes(s)} mnt</span></div>
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-center gap-2 font-bold text-slate-900">{s.subjectName} {bad && <Pill tone="bad"><TriangleAlert size={12} /> Bentrok</Pill>}</h3>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><DoorOpen size={14} /> {s.className}</span><span className="inline-flex items-center gap-1.5"><UserRound size={14} /> {s.teacherName}</span></p>
      </div>
      <Pill tone={tone}>{label}</Pill>
      <span className="flex gap-1 print:hidden">
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40" disabled={locked} title={locked ? 'Sesi yang sudah dimulai tidak bisa diubah' : undefined} onClick={() => onEdit(s)} aria-label={`Ubah sesi ${s.subjectName} ${s.className} ${s.time}`}><Pencil size={16} /></button>
        <button className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40" disabled={locked} title={locked ? 'Sesi yang sudah dimulai tidak bisa dihapus' : undefined} onClick={() => onDelete(s)} aria-label={`Hapus sesi ${s.subjectName} ${s.className} ${s.time}`}><Trash2 size={16} /></button>
      </span>
    </article>
  )
}

function Side({ sessions }) {
  const teachers = useMemo(() => {
    const m = new Map()
    sessions.forEach((s) => { const x = m.get(s.teacherName) ?? { name: s.teacherName, n: 0, min: 0 }; x.n += 1; x.min += minutes(s); m.set(s.teacherName, x) })
    return [...m.values()].sort((a, b) => b.n - a.n)
  }, [sessions])
  const subjects = useMemo(() => {
    const m = new Map()
    sessions.forEach((s) => m.set(s.subjectName, (m.get(s.subjectName) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [sessions])
  const top = subjects[0]?.[1] ?? 1
  return (
    <aside className="space-y-6">
      <section className="panel">
        <h2 className="text-lg font-bold">Beban Mengajar Pekan Ini</h2>
        {teachers.length === 0 ? <p className="mt-3 text-sm text-slate-500">Belum ada sesi pada pekan ini.</p> : (
          <ul className="mt-4 space-y-2 text-sm">{teachers.map((t) => <li key={t.name} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"><span className="truncate font-medium">{t.name}</span><span className="shrink-0 text-slate-600">{t.n} sesi · {Math.round((t.min / 60) * 10) / 10} jam</span></li>)}</ul>
        )}
      </section>
      <section className="panel">
        <h2 className="text-lg font-bold">Sebaran Mata Pelajaran</h2>
        {subjects.length === 0 ? <p className="mt-3 text-sm text-slate-500">Belum ada sesi pada pekan ini.</p> : (
          <ul className="mt-4 space-y-3 text-sm">{subjects.map(([name, n]) => (
            <li key={name}><p className="mb-1 flex justify-between"><span className="font-medium">{name}</span><b>{n}</b></p><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.round((n / top) * 100)}%` }} /></div></li>))}</ul>
        )}
      </section>
    </aside>
  )
}

export default function AdminSchedulePage() {
  const { notify } = useToast()
  const todayKey = dayKey()
  const [weekOf, setWeekOf] = useState(todayKey)
  const [day, setDay] = useState(todayKey)
  const [classId, setClassId] = useState('')
  const [form, setForm] = useState(null) // null | 'new' | sesi
  const [del, setDel] = useState(null)
  const days = useMemo(() => weekDays(weekOf), [weekOf])
  const state = useAsync(useCallback(
    () => Promise.all([scheduleService.sessions({ from: days[0], to: days[6], classId }), classService.list(), subjectService.list(), userService.list()]),
    [days, classId],
  ))
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])
  const suffix = serviceMode.mock ? ' (simulasi)' : ''

  const move = (by) => { const next = shift(weekOf, by); setWeekOf(next); setDay(weekDays(next).includes(todayKey) ? todayKey : weekDays(next)[0]) }
  const save = async (v) => {
    if (form === 'new') await scheduleService.create(v); else await scheduleService.update(form.id, v)
    notify(`${form === 'new' ? 'Sesi ditambahkan' : 'Sesi diperbarui'}${suffix}.`, 'success')
    setForm(null); state.reload()
  }
  const remove = async () => {
    try { await scheduleService.remove(del.id); notify(`Sesi dihapus${suffix}.`, 'success'); state.reload() } catch (e) { notify(e.message, 'error') }
    setDel(null)
  }

  return (
    <>
      <AdminHead group="Akademik & Penjadwalan" title="Jadwal & Kalender KBM" description="Atur sesi belajar-mengajar per rombel. Sistem menolak sesi yang bentrok untuk kelas atau guru yang sama."
        actions={<>
          <button className="btn-secondary print:hidden" onClick={() => window.print()}><Printer size={16} /> Cetak jadwal</button>
          <button className="btn-primary print:hidden" onClick={() => setForm('new')}><Plus size={16} /> Buat sesi baru</button>
        </>} />
      <AsyncBoundary state={state}>
        {([sessions, classes, subjects, users]) => {
          const bad = conflictIds(sessions)
          const teachers = new Set(sessions.map((s) => s.teacherId))
          const live = sessions.filter((s) => phase(s, now) === 'live')
          const today = sessions.filter((s) => s.date === todayKey)
          const daySessions = sessions.filter((s) => s.date === day)
          const options = {
            classes: classes.filter((c) => c.status === 'active').map((c) => ({ value: c.id, label: c.name })),
            subjects: subjects.filter((s) => s.status === 'active').map((s) => ({ value: s.id, label: s.name })),
            teachers: users.filter((u) => u.role === 'teacher' && u.status === 'active').map((u) => ({ value: u.id, label: u.name })),
          }
          const fields = [
            { name: 'classId', label: 'Kelas', type: 'select', options: options.classes, required: true },
            { name: 'subjectId', label: 'Mata pelajaran', type: 'select', options: options.subjects, required: true },
            { name: 'teacherId', label: 'Guru pengajar', type: 'select', options: options.teachers, hint: 'Kosongkan untuk memakai guru pengampu mata pelajaran.' },
            { name: 'date', label: 'Tanggal', type: 'date', required: true, hint: serviceMode.mock ? 'Mode demo: sesi berulang setiap pekan pada hari yang sama.' : 'Harus tanggal yang akan datang.' },
            { name: 'start', label: 'Jam mulai', type: 'time', required: true },
            { name: 'end', label: 'Jam selesai', type: 'time', required: true },
          ]
          const initial = form && form !== 'new' ? { classId: form.classId, subjectId: form.subjectId, teacherId: form.teacherId, date: form.date, start: form.time, end: form.endTime } : { date: day }
          return (
            <>
              <StatGrid>
                <AdminStat label="Sesi pekan ini" value={sessions.length} unit="Sesi" icon={CalendarRange} foot={`${shortDate(days[0])} – ${shortDate(days[6])} · ${new Set(sessions.map((s) => s.classId)).size} rombel`} />
                <AdminStat label="Guru mengajar" value={teachers.size} unit="Guru" icon={Users} tone="gray" foot={teachers.size ? `Rerata ${Math.round((sessions.length / teachers.size) * 10) / 10} sesi per guru` : 'Belum ada sesi'} />
                <AdminStat label="Berlangsung sekarang" value={live.length} unit="Sesi" icon={Radio} foot={`${today.length} sesi terjadwal hari ini`} />
                <AdminStat label="Deteksi bentrok" value={bad.size} unit="Sesi" icon={TriangleAlert} tone={bad.size ? 'warn' : 'brand'} foot={bad.size ? 'Kelas atau guru ganda pada jam yang sama' : 'Tidak ada tumpang tindih pada pekan ini'} />
              </StatGrid>

              <section className="panel mb-6 flex flex-wrap items-center gap-4 print:hidden">
                <label className="flex items-center gap-2 text-sm font-medium">Pilih rombel:
                  <select aria-label="Pilih rombel" className="input w-auto" value={classId} onChange={(e) => setClassId(e.target.value)}>
                    <option value="">Semua rombel</option>
                    {options.classes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <div className="flex items-center gap-1">
                  <button className="btn-secondary px-2" onClick={() => move(-7)} aria-label="Pekan sebelumnya"><ChevronLeft size={16} /></button>
                  <button className="btn-secondary" onClick={() => { setWeekOf(todayKey); setDay(todayKey) }}>Pekan ini</button>
                  <button className="btn-secondary px-2" onClick={() => move(7)} aria-label="Pekan berikutnya"><ChevronRight size={16} /></button>
                </div>
                <div className="ml-auto flex flex-wrap rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Hari">
                  {days.map((d, i) => {
                    const n = sessions.filter((s) => s.date === d).length
                    return <button key={d} role="tab" aria-selected={day === d} onClick={() => setDay(d)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${day === d ? 'bg-white text-slate-900 shadow-card' : 'text-slate-600'}`}>{DAY_NAMES[i]}{n > 0 && <span className="ml-1 text-xs text-brand-700">({n})</span>}</button>
                  })}
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-3">
                <section className="panel xl:col-span-2">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Jadwal KBM · {DAY_NAMES[days.indexOf(day)] ?? ''}, {longDate(day)}</h2>
                    <Pill tone={day === todayKey ? 'brand' : 'gray'}>{daySessions.length} sesi</Pill>
                  </div>
                  {daySessions.length === 0 ? <EmptyState title="Tidak ada sesi pada hari ini" description="Gunakan “Buat sesi baru” untuk menambahkan jadwal." /> : (
                    <div className="space-y-3">{daySessions.map((s) => <Session key={s.key} s={s} now={now} bad={bad.has(s.key)} onEdit={setForm} onDelete={setDel} />)}</div>
                  )}
                </section>
                <Side sessions={sessions} />
              </div>

              {form && <FormModal key={form === 'new' ? 'new' : form.key} open title={form === 'new' ? 'Buat sesi baru' : 'Ubah sesi'} fields={fields} initial={initial} onSubmit={save} onClose={() => setForm(null)} />}
            </>
          )
        }}
      </AsyncBoundary>
      <ConfirmationDialog open={!!del} title="Hapus sesi?" message={del && `Sesi ${del.subjectName} untuk ${del.className} (${del.time}) akan dihapus.`} confirmLabel="Hapus" onCancel={() => setDel(null)} onConfirm={remove} />
    </>
  )
}
