import { Coffee, DoorOpen } from 'lucide-react'

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const Room = ({ children, dark }) => <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${dark ? 'bg-white/15 text-white' : 'bg-white text-slate-800'}`}>{children}</span>

function Cell({ cell: c, running, students }) {
  if (running) return (
    <div className="flex min-h-32 flex-col justify-between gap-2 rounded-lg bg-brand-600 p-3 text-white">
      <div className="space-y-1"><div className="flex flex-wrap items-center gap-1.5"><b className="text-sm">{c.className}</b><span className="inline-flex items-center gap-1 rounded-full bg-brand-200 px-2 py-0.5 text-[10px] font-bold text-brand-700"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" />Berlangsung</span></div><p className="text-xs">{c.topic}</p></div>
      <div className="flex items-center gap-2"><Room dark><DoorOpen size={12} />{c.room}</Room><span className="text-xs">{students} Siswa</span></div>
    </div>
  )
  if (c.kind === 'note') return <div className="flex min-h-32 flex-col items-center justify-center rounded-lg bg-brand-50 p-3 text-center text-xs italic text-slate-500"><span>{c.title}</span><span>{c.topic}</span></div>
  const lab = c.kind === 'lab', duty = c.kind === 'duty'
  return (
    <div className={`flex min-h-32 flex-col justify-between gap-2 rounded-lg p-3 text-xs ${lab ? 'bg-brand-200' : duty ? 'bg-slate-100' : 'bg-brand-50'}`}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5"><b className="text-sm">{duty ? c.title : c.className}</b>{lab && <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold">{c.tag}</span>}</div>
        <p className="text-slate-600">{c.topic}</p>
      </div>
      <div><Room>{c.room}</Room></div>
    </div>
  )
}

export default function ScheduleMatrix({ data, now }) {
  const today = now.getDay(), nowMin = now.getHours() * 60 + now.getMinutes()
  return (
    <div className="overflow-x-auto print:overflow-visible">
      <div className="grid min-w-[780px] gap-2" style={{ gridTemplateColumns: '110px repeat(5, minmax(120px, 1fr))' }}>
        <div className="flex items-center text-xs font-semibold">Slot Jam KBM</div>
        {data.days.map((d) => (
          <div key={d.index} className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold ${today === d.index ? 'bg-brand-600 text-white' : 'bg-brand-50 text-slate-700'}`}>
            {d.label}{today === d.index && <span className="h-1.5 w-1.5 rounded-full bg-brand-200" aria-label="hari ini" />}
          </div>
        ))}
        {data.rows.map((r) => r.type === 'break' ? (
          <div key={r.id} style={{ gridColumn: '1 / -1' }} className="flex items-center justify-between rounded-md bg-slate-100 px-4 py-2 text-xs text-slate-600">
            <b>{r.start} - {r.end}</b><span className="flex items-center gap-2"><Coffee size={14} />{r.label}</span>
          </div>
        ) : (
          <div key={r.id} className="contents">
            <div className="flex flex-col justify-center gap-1 rounded-lg bg-brand-50 p-3 text-xs text-slate-600"><b className="text-sm text-slate-900">{r.label}</b><span>{r.start} - {r.end}</span><span>{r.jp} JP ({toMin(r.end) - toMin(r.start)} Menit)</span></div>
            {data.days.map((d) => {
              const cell = data.cells[`${r.id}-${d.index}`]
              const running = today === d.index && nowMin >= toMin(r.start) && nowMin < toMin(r.end) && (cell.kind === 'teach' || cell.kind === 'lab')
              return <Cell key={d.index} cell={cell} running={running} students={data.studentCount[cell.className]} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
