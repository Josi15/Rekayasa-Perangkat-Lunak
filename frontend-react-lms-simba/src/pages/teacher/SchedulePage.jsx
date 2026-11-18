import { useState } from 'react'
import { FileDown, Timer, Users, CheckCircle2 } from 'lucide-react'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import { useAsync } from '../../hooks/useAsync'
import { teacherScheduleService } from '../../services'
import ScheduleMatrix from './schedule/ScheduleMatrix'
import LabStatusPanel from './schedule/LabStatusPanel'

const Legend = ({ color, children }) => <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{children}</span>

export default function SchedulePage() {
  const { data, loading, error, reload } = useAsync(teacherScheduleService.get)
  const [now] = useState(() => new Date())
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <div className="space-y-6">
      <section className="panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Tahun Ajaran {data.academicYear} <span className="font-normal normal-case text-slate-600">• Semester {data.semester} (KBM Aktif)</span></p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Jadwal Mengajar & Agenda KBM</h1>
        </div>
        <button className="btn-primary print:hidden" onClick={() => window.print()}><FileDown size={16} /> Unduh Jadwal (PDF)</button>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel flex gap-4"><div className="h-fit rounded-xl bg-brand-200 p-3 text-brand-700"><Timer size={24} /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Beban Ajar Mingguan</p><p className="mt-1 text-4xl font-extrabold">{data.jp} <span className="text-sm font-normal text-slate-500">/ {data.standardJp} Standar JP</span></p>
            {data.jp >= data.standardJp && <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-700"><CheckCircle2 size={14} />Memenuhi Sertifikasi Nasional</p>}</div></div>
        <div className="panel flex gap-4"><div className="h-fit rounded-xl bg-brand-100 p-3 text-brand-700"><Users size={24} /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Kelas Binaan</p><p className="mt-1 text-4xl font-extrabold">{data.classes.length} Kelas</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{data.classes.map((c) => <span key={c} className="rounded bg-brand-100 px-2 py-0.5 text-xs">{c}</span>)}</div></div></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="panel min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Matriks Mingguan KBM (Senin - Jumat)</h2>
            <div className="flex flex-wrap gap-4"><Legend color="bg-brand-600">Sesi Mengajar</Legend><Legend color="bg-brand-200">Praktikum Lab</Legend><Legend color="bg-slate-200">Rehat / Kosong</Legend></div></div>
          <ScheduleMatrix data={data} now={now} />
        </section>
        <LabStatusPanel labs={data.labs} slots={data.rows.filter((r) => r.type === 'slot')} />
      </div>
    </div>
  )
}
