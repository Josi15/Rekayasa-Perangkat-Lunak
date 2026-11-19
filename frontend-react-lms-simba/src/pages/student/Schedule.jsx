import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Download, MapPin, MessageSquare, User } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { Card, Eyebrow, Pill } from '../../components/student/ui.jsx'
import MessageTeacherModal from '../../components/student/MessageTeacherModal.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentSchedule } from '../../services/index.js'
import { profileSeed } from '../../data/student.js'
import { addDays, dateKey, dayLabel, fmtShortDay, fromKey, startOfWeek } from '../../utils/date.js'
import { btnGhost, btnPrimary } from '../../utils/styles.js'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

export default function Schedule() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const p = profileSeed[user.id]
  const [anchor, setAnchor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => { const g = new Date().getDay(); return g >= 1 && g <= 5 ? g : 1 })
  const [msg, setMsg] = useState(false)
  const weekKey = dateKey(startOfWeek(anchor))
  const state = useAsync(useCallback(() => Promise.all([studentSchedule.getWeek(user.id, fromKey(weekKey)), studentSchedule.getToday(user.id)]), [user.id, weekKey]))
  const todayKey = dateKey(new Date())
  const weekStart = fromKey(weekKey)

  return (
    <>
      <PageHeader title="Jadwal Pelajaran & Agenda KBM Siswa" description="SIMBA LMS • Modul Akademik Siswa" breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Jadwal KBM' }]}
        actions={<button onClick={() => window.print()} className={`${btnPrimary} no-print`}><Download className="size-4" />Unduh Jadwal (PDF)</button>} />
      <AsyncBoundary state={state}>
        {([{ days, next }, today]) => {
          const slots = [...new Map(days.flatMap((d) => d.entries).map((e) => [`${e.start}-${e.end}`, { start: e.start, end: e.end }])).values()].sort((a, b) => a.start.localeCompare(b.start))
          const selDay = days[selected - 1]
          const rooms = [...new Map(days.flatMap((d) => d.entries).map((e) => [e.room, e.courseName])).entries()]
          const hero = today.current ?? today.next
          return (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  {hero ? (
                    <>
                      <p className="flex flex-wrap items-center gap-2"><Pill>{today.current ? '● SEDANG BERLANGSUNG' : 'BERIKUTNYA HARI INI'}</Pill>{today.current && <span className="text-xs font-semibold text-brand-700">Sisa waktu: {today.current.remaining} menit</span>}</p>
                      <p className="mt-2 text-xs text-slate-500">Jam {hero.start} - {hero.end} WIB</p>
                      <h2 className="text-2xl font-bold text-slate-900">{hero.courseName}</h2>
                      <p className="mt-1 flex flex-wrap gap-4 text-sm text-slate-600"><span className="flex items-center gap-1"><MapPin className="size-4" />{hero.room}</span><span className="flex items-center gap-1"><User className="size-4" />{hero.teacher}</span></p>
                      <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => navigate('/student/attendance')} className={btnPrimary}>Buka Presensi Sesi</button><button onClick={() => navigate(`/student/classes/${hero.courseId}`)} className={btnGhost}>Buka Materi Mapel</button></div>
                    </>
                  ) : (
                    <p className="py-4 text-sm text-slate-600">{today.sessions.length ? 'Seluruh sesi hari ini telah selesai.' : 'Tidak ada sesi pada hari ini.'}{next && <> Jadwal berikutnya: <b>{next.courseName}</b>, {dayLabel(new Date(next.when))} pukul {next.start} ({next.room}).</>}{!next && ' Jadwal kelas Anda belum diatur oleh admin.'}</p>
                  )}
                </Card>
                <Card title="Jadwal Hari Ini" icon={CalendarDays}>
                  <p className="text-3xl font-extrabold text-slate-900">{today.sessions.length} <span className="text-base font-semibold text-slate-500">Sesi ({today.jp} jam pelajaran)</span></p>
                  <p className="mt-2 text-sm text-slate-600">{today.sessions.map((s) => s.courseName).join(', ') || 'Tidak ada sesi.'}</p>
                </Card>
              </div>

              <Card className="no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Pilih hari</span>
                  {DAYS.map((n, i) => <button key={n} onClick={() => setSelected(i + 1)} aria-pressed={selected === i + 1} className={`rounded-full px-3 py-1 text-sm font-semibold ${selected === i + 1 ? 'bg-simba-dark text-white' : 'bg-simba-bg text-slate-600 hover:bg-brand-100'}`}>{n}</button>)}
                  <span className="ml-auto flex items-center gap-1 text-sm text-slate-500">
                    <button onClick={() => setAnchor(addDays(weekStart, -7))} className="rounded-lg border border-simba-line p-1.5" aria-label="Pekan sebelumnya"><ChevronLeft className="size-4" /></button>
                    {fmtShortDay(weekStart)} - {fmtShortDay(addDays(weekStart, 4))}
                    <button onClick={() => setAnchor(addDays(weekStart, 7))} className="rounded-lg border border-simba-line p-1.5" aria-label="Pekan berikutnya"><ChevronRight className="size-4" /></button>
                    <button onClick={() => { setAnchor(new Date()); const g = new Date().getDay(); setSelected(g >= 1 && g <= 5 ? g : 1) }} className="ml-1 rounded-lg border border-simba-line px-2.5 py-1.5 text-xs font-semibold">Hari ini</button>
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{DAYS[selected - 1]}: {selDay.entries.length} sesi{selDay.key === todayKey ? ' (hari berjalan)' : ''}</p>
              </Card>

              {slots.length === 0 ? <Card><p className="text-sm text-slate-600">Jadwal kelas Anda belum diatur oleh admin.</p></Card> : (
                <div className="overflow-x-auto rounded-2xl border border-simba-line bg-white shadow-sm">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead><tr className="bg-simba-bg text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Waktu & Sesi</th>
                      {days.map((d, i) => <th key={d.key} className={`px-3 py-3 ${selected === i + 1 ? 'bg-brand-100 text-brand-700' : ''}`}>{DAYS[i]} {d.key === todayKey && <Pill>Hari ini</Pill>}</th>)}
                    </tr></thead>
                    <tbody>
                      {slots.map((s) => (
                        <tr key={`${s.start}-${s.end}`} className="border-t border-simba-line align-top">
                          <td className="whitespace-nowrap px-3 py-3 text-xs"><b className="block text-slate-900">{s.start} - {s.end}</b><span className="text-slate-500">{(parseInt(s.end) * 60 + parseInt(s.end.slice(3)) - parseInt(s.start) * 60 - parseInt(s.start.slice(3)))} menit</span></td>
                          {days.map((d, i) => {
                            const e = d.entries.find((x) => x.start === s.start && x.end === s.end)
                            const live = e && d.key === todayKey && today.current?.id === e.id
                            const isNext = e && next && e.id === next.id && d.key === next.key
                            return (
                              <td key={d.key} className={`px-3 py-3 ${selected === i + 1 ? 'bg-brand-50/60' : ''}`}>
                                {e ? <div className={`rounded-xl border p-2.5 ${live ? 'border-brand-600 bg-brand-100' : 'border-simba-line bg-white'}`}>
                                  <p className="text-[11px] text-slate-500">{e.room}</p><b className="block text-slate-900">{e.courseName}</b><span className="text-xs text-slate-500">{e.teacher}</span>
                                  {live && <p className="mt-1"><Pill>Live</Pill></p>}{isNext && !live && <p className="mt-1"><Pill tone="amber">Berikutnya</Pill></p>}
                                </div> : <span className="text-slate-300">—</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid gap-5 lg:grid-cols-2">
                <Card title="Informasi Ruang & Lab" icon={MapPin}>
                  {rooms.length === 0 ? <p className="text-sm text-slate-500">Belum ada data ruang.</p> : <ul className="divide-y divide-simba-line text-sm">{rooms.map(([room, course]) => <li key={room} className="flex justify-between py-2"><b className="text-slate-900">{room}</b><span className="text-slate-500">{course}</span></li>)}</ul>}
                </Card>
                <Card title="Wali Kelas & Konsultasi" icon={MessageSquare}>
                  <div className="flex items-center gap-3 rounded-xl bg-simba-bg p-3"><span className="grid size-10 place-items-center rounded-full bg-simba-dark font-bold text-white">{p.homeroom[0]}</span><div><Eyebrow>Wali Kelas {p.className}</Eyebrow><b className="text-slate-900">Ibu {p.homeroom}</b></div></div>
                  <button onClick={() => setMsg(true)} className={`${btnPrimary} mt-3 w-full`}><MessageSquare className="size-4" />Kirim Pesan</button>
                </Card>
              </div>
              {msg && <MessageTeacherModal teacher={p.homeroom} onClose={() => setMsg(false)} />}
            </div>
          )
        }}
      </AsyncBoundary>
    </>
  )
}
