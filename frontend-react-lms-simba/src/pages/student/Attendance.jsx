import { useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { Card, Pill } from '../../components/student/ui.jsx'
import CheckInCard from '../../components/student/CheckInCard.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useAuth } from '../../hooks/useAuth.js'
import { studentAttendance } from '../../services/index.js'
import { fmtDate } from '../../utils/date.js'

export default function Attendance() {
  const { user } = useAuth()
  const state = useAsync(useCallback(() => studentAttendance.get(user.id), [user.id]))
  return (
    <>
      <PageHeader title="Presensi Mandiri" description="Catat kehadiran harian dan pantau rekap semester." breadcrumb={[{ label: 'Beranda', to: '/student' }, { label: 'Presensi Mandiri' }]} />
      <AsyncBoundary state={state}>
        {(a) => (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-1">
              <CheckInCard uid={user.id} checkedIn={a.checkedIn} onChanged={state.reload} />
              <Card title="Rekap semester">
                <p className="text-3xl font-extrabold text-slate-900">{String(a.pct).replace('.', ',')}% <Pill>{a.label}</Pill></p>
                <div className="my-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${a.pct}%` }} /></div>
                <p className="text-sm text-slate-600">Hadir {a.present} dari {a.total} sesi tatap muka · {a.permit} izin</p>
              </Card>
            </div>
            <Card title="Riwayat presensi terbaru" className="lg:col-span-2">
              <ul className="divide-y divide-simba-line text-sm">
                {a.history.map((h) => <li key={h.date} className="flex items-center justify-between py-2.5"><span>{fmtDate(h.date)}</span><span className="text-slate-500">{h.time !== '-' ? `${h.time} WIB` : ''}</span><Pill tone={h.status === 'Hadir' ? 'green' : 'amber'}>{h.status}</Pill></li>)}
              </ul>
            </Card>
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
