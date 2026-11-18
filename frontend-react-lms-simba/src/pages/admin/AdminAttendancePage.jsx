import { useCallback, useMemo, useState } from 'react'
import { UserCheck, CircleCheck, FileHeart, UserX, Eye } from 'lucide-react'
import AdminHead from '../../components/admin/AdminHead'
import AdminStat, { StatGrid, Pill } from '../../components/admin/AdminStat'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/tables/DataTable'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { attendanceService, scheduleService, classService, serviceMode } from '../../services'
import { dayKey } from '../../services/api/adapt'

const STATUS = [['H', 'Hadir'], ['I', 'Izin'], ['S', 'Sakit'], ['A', 'Alpa']]
const searchKeys = ['name', 'nisn']
const monthStart = () => { const d = new Date(); return dayKey(new Date(d.getFullYear(), d.getMonth(), 1)) }
const sum = (rows, k) => rows.reduce((s, r) => s + (r[k] ?? 0), 0)

function RosterModal({ session, onClose }) {
  const { notify } = useToast()
  const state = useAsync(useCallback(() => attendanceService.roster(session.id), [session.id]))
  const [busy, setBusy] = useState(null)
  const change = async (r, status) => {
    setBusy(r.studentId)
    try { await attendanceService.correct(session.id, r.studentId, status); notify(`Presensi ${r.name} dikoreksi${serviceMode.mock ? ' (simulasi)' : ''}.`, 'success'); state.reload() }
    catch (e) { notify(e.message, 'error') } finally { setBusy(null) }
  }
  return (
    <Modal wide open title={`Presensi ${session.subjectName} · ${session.className}`} onClose={onClose} footer={<button className="btn-secondary" onClick={onClose}>Tutup</button>}>
      <p className="mb-3 text-slate-500">{session.date} · {session.time}–{session.endTime} · {session.teacherName}</p>
      <AsyncBoundary state={state}>
        {({ records, stats }) => records.length === 0 ? <EmptyState title="Belum ada siswa pada roster" /> : (
          <>
            <p className="mb-3 flex flex-wrap gap-2"><Pill>Hadir {stats.h}</Pill><Pill tone="warn">Izin {stats.i}</Pill><Pill tone="warn">Sakit {stats.s}</Pill><Pill tone="bad">Alpa {stats.a}</Pill><Pill tone="gray">{stats.pct}% hadir</Pill></p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead><tr className="bg-brand-50 text-xs uppercase tracking-wide text-slate-600"><th className="px-3 py-2">Siswa</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Jam</th><th className="px-3 py-2">Metode</th></tr></thead>
                <tbody>{records.map((r) => (
                  <tr key={r.studentId} className="odd:bg-white even:bg-slate-50/60">
                    <td className="px-3 py-2"><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-500">{r.nisn}</p></td>
                    <td className="px-3 py-2">
                      <select aria-label={`Status ${r.name}`} className="input w-auto py-1" value={r.status} disabled={busy === r.studentId} onChange={(e) => change(r, e.target.value)}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      {r.recorded === false && <span className="ml-2 text-xs text-slate-400">belum tercatat</span>}
                    </td>
                    <td className="px-3 py-2">{r.time ?? '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{r.method?.label ?? '-'}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </>
        )}
      </AsyncBoundary>
    </Modal>
  )
}

export default function AdminAttendancePage() {
  const today = dayKey()
  const [classId, setClassId] = useState('')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today)
  const [date, setDate] = useState(today)
  const [open, setOpen] = useState(null)
  const state = useAsync(useCallback(
    () => Promise.all([attendanceService.rekap({ classId, from, to }), scheduleService.sessions({ from: date, to: date, classId }), classService.list()]),
    [classId, from, to, date],
  ))
  return (
    <>
      <AdminHead group="Akademik & Penjadwalan" title="Monitoring Presensi" description="Pantau kehadiran siswa per sesi dan per periode, serta koreksi status bila ada kekeliruan pencatatan." />
      <section className="panel mb-6 flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium">Rombel
          <select aria-label="Filter rombel" className="input mt-1" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Semua rombel</option>
            {(state.data?.[2] ?? []).filter((c) => c.status === 'active').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Periode rekap: dari<input type="date" aria-label="Rekap dari" className="input mt-1" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
        <label className="text-sm font-medium">sampai<input type="date" aria-label="Rekap sampai" className="input mt-1" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
        <label className="text-sm font-medium">Tanggal sesi<input type="date" aria-label="Tanggal sesi" className="input mt-1" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
      </section>
      <AsyncBoundary state={state}>
        {([rekap, sessions]) => <Body rekap={rekap} sessions={sessions} date={date} onOpen={setOpen} />}
      </AsyncBoundary>
      {open && <RosterModal key={open.key} session={open} onClose={() => { setOpen(null); state.reload() }} />}
    </>
  )
}

function Body({ rekap, sessions, date, onOpen }) {
  const total = sum(rekap, 'total'), hadir = sum(rekap, 'h')
  const pct = total ? Math.round((hadir / total) * 1000) / 10 : 0
  const rows = useMemo(() => [...rekap].sort((a, b) => a.pct - b.pct), [rekap])
  const columns = [
    { key: 'name', header: 'Siswa', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
    { key: 'nisn', header: 'NISN' },
    { key: 'total', header: 'Sesi' }, { key: 'h', header: 'Hadir' }, { key: 'i', header: 'Izin' }, { key: 's', header: 'Sakit' }, { key: 'a', header: 'Alpa' },
    { key: 'pending', header: 'Belum tercatat' },
    { key: 'pct', header: 'Kehadiran', render: (r) => <Pill tone={r.total === 0 ? 'gray' : r.pct >= 90 ? 'brand' : r.pct >= 75 ? 'warn' : 'bad'}>{r.total === 0 ? '-' : `${r.pct}%`}</Pill> },
  ]
  return (
    <>
      <StatGrid>
        <AdminStat label="Kehadiran periode" value={`${pct}%`} icon={UserCheck} foot={`${hadir} dari ${total} catatan sesi`} />
        <AdminStat label="Izin & sakit" value={sum(rekap, 'i') + sum(rekap, 's')} unit="Catatan" icon={FileHeart} tone="warn" foot={`${sum(rekap, 'i')} izin · ${sum(rekap, 's')} sakit`} />
        <AdminStat label="Alpa" value={sum(rekap, 'a')} unit="Catatan" icon={UserX} tone="gray" foot="Tanpa keterangan" />
        <AdminStat label="Belum tercatat" value={sum(rekap, 'pending')} unit="Catatan" icon={CircleCheck} tone="gray" foot="Sesi yang belum diisi presensinya" />
      </StatGrid>
      <section className="panel mb-6">
        <h2 className="mb-4 text-lg font-bold">Sesi pada {date}</h2>
        {sessions.length === 0 ? <EmptyState title="Tidak ada sesi pada tanggal ini" /> : (
          <ul className="space-y-2">{sessions.map((s) => (
            <li key={s.key} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <b className="w-28 shrink-0">{s.time}–{s.endTime}</b>
              <span className="min-w-0 flex-1"><b>{s.subjectName}</b> <span className="text-slate-500">· {s.className} · {s.teacherName}</span></span>
              <button className="btn-secondary" onClick={() => onOpen(s)} aria-label={`Lihat presensi ${s.subjectName} ${s.className} ${s.time}`}><Eye size={16} /> Lihat & koreksi</button>
            </li>))}</ul>
        )}
      </section>
      <h2 className="mb-3 text-lg font-bold">Rekap per Siswa</h2>
      <DataTable variant="admin" pageSize={8} columns={columns} rows={rows} searchKeys={searchKeys} searchPlaceholder="Cari siswa atau NISN" />
      {serviceMode.mock && <p className="mt-3 text-xs text-slate-500">Mode demo: satu roster contoh dipakai untuk semua sesi.</p>}
    </>
  )
}
