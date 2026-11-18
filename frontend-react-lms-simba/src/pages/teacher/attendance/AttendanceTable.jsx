import { useState } from 'react'
import { Users, CalendarDays, Clock, CheckCheck, Search, Wifi, MapPin, Paperclip, Award, UserCheck, Info } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'
import NumberedPagination from '../../../components/tables/NumberedPagination'

const PAGE_SIZE = 8
const opts = [['H', 'Hadir', 'bg-brand-600 text-white'], ['I', 'Izin', 'bg-brand-700 text-white'], ['S', 'Sakit', 'bg-red-600 text-white'], ['A', 'Alpha', 'bg-slate-700 text-white']]
const icons = { wifi: [Wifi, 'bg-brand-100 text-brand-700'], geo: [MapPin, 'bg-slate-100 text-slate-700'], doc: [Paperclip, 'bg-red-100 text-red-700'], award: [Award, 'bg-brand-200 text-brand-700'], manual: [UserCheck, 'bg-slate-100 text-slate-700'], note: [Info, 'bg-slate-100 text-slate-600'] }

const Chip = ({ icon: I, children }) => <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs"><I size={13} />{children}</span>

function Row({ r, open, onStatus, onNote }) {
  const [note, setNote] = useState(r.note)
  const [Icon, tone] = icons[r.method.kind]
  return (
    <tr className={`border-b border-slate-100 ${r.status === 'S' ? 'bg-red-50/70' : r.status === 'I' ? 'bg-brand-50' : ''}`}>
      <td className="px-4 py-4 text-slate-500">{r.no}</td>
      <td className="px-4 py-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${r.status === 'S' ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'}`}>{r.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
        <div><p className="font-semibold">{r.name}</p><p className="font-mono text-xs text-slate-500">{r.nisn}</p></div></div></td>
      <td className="whitespace-nowrap px-4 py-4">{r.time ? <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-brand-700" />{r.time} WIB</span> : '—'}</td>
      <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${tone}`}><Icon size={13} />{r.method.label}</span></td>
      <td className="px-4 py-4"><div role="group" aria-label={`Status ${r.name}`} className="inline-flex rounded-lg bg-slate-100 p-1">
        {opts.map(([k, l, on]) => <button key={k} aria-label={`${r.name}: ${l}`} aria-pressed={r.status === k} disabled={!open} onClick={() => onStatus(r.studentId, k)} className={`h-7 w-8 rounded-md text-xs font-bold disabled:opacity-60 ${r.status === k ? on : 'text-slate-600 hover:bg-white'}`}>{k}</button>)}</div></td>
      <td className="px-4 py-4"><input aria-label={`Catatan ${r.name}`} readOnly={!open} value={note} placeholder="-" onChange={(e) => setNote(e.target.value)} onBlur={() => note !== r.note && onNote(r.studentId, note)} className="w-52 rounded-lg bg-transparent px-2 py-1.5 text-sm outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-200" /></td>
    </tr>
  )
}

export default function AttendanceTable({ session, records, open, q, onQ, page, onPage, onStatus, onNote, onAllPresent }) {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const shown = records.filter((r) => `${r.name} ${r.nisn}`.toLowerCase().includes(q.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  return (
    <>
      <section className="space-y-3 rounded-2xl bg-brand-50 p-4">
        <div className="flex flex-wrap gap-2"><Chip icon={Users}>Rombel: <b>{session.className} ({records.length} Siswa)</b></Chip><Chip icon={CalendarDays}>Tanggal: <b>Hari Ini ({today})</b></Chip><Chip icon={Clock}>Sesi: <b>{session.slot}</b></Chip></div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <button className="btn-secondary !bg-brand-100 !text-brand-700" disabled={!open} onClick={onAllPresent}><CheckCheck size={16} /> Tandai Semua Hadir</button>
          <div className="relative w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Cari nama / NISN" placeholder="Cari nama / NISN..." value={q} onChange={(e) => onQ(e.target.value)} className="w-full rounded-lg bg-white py-2 pl-9 pr-3 text-sm outline-none" /></div>
        </div>
      </section>
      <section className="panel !p-0 overflow-hidden">
        {shown.length === 0 ? <EmptyState title="Siswa tidak ditemukan" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-brand-50 text-xs font-semibold text-slate-700"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3">NISN & Nama Siswa</th><th className="px-4 py-3">Waktu Check-in</th><th className="px-4 py-3">Metode Verifikasi</th><th className="px-4 py-3">Status Kehadiran</th><th className="px-4 py-3">Catatan Guru / Keterangan</th></tr></thead>
            <tbody>{shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((r) => <Row key={r.studentId} r={r} open={open} onStatus={onStatus} onNote={onNote} />)}</tbody>
          </table></div>
        )}
        <NumberedPagination page={current} totalPages={totalPages} total={shown.length} pageSize={PAGE_SIZE} onChange={onPage} noun="siswa" />
      </section>
    </>
  )
}
