import { useEffect, useState } from 'react'
import { MapPin, UserCheck } from 'lucide-react'
import { Card } from './ui.jsx'
import { useToast } from '../common/Toast.jsx'
import { studentAttendance } from '../../services/index.js'
import { btnPrimary } from '../../utils/styles.js'

export default function CheckInCard({ uid, checkedIn, onChanged }) {
  const toast = useToast()
  const [now, setNow] = useState(() => new Date())
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const check = async () => {
    setBusy(true)
    try { await studentAttendance.checkIn(uid); toast('Check-in kehadiran berhasil dicatat.'); onChanged() } catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }
  const clock = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':')
  return (
    <Card title="Presensi Mandiri Cepat" icon={UserCheck}>
      <p className="text-sm text-slate-600">Verifikasi kehadiran saat berada di dalam radius zona kelas.</p>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-simba-bg p-3 text-sm">
        <MapPin className="mt-0.5 size-4 text-brand-600" />
        <div><b className="text-slate-900">Gedung Laboratorium Sains Lt. 2</b><p className="text-xs text-slate-500">Zona terdeteksi: Lab Biologi 2 (radius 4 m) · lokasi simulasi</p></div>
      </div>
      <p className="mt-3 text-right font-mono text-sm text-slate-500">{clock} WIB</p>
      {checkedIn
        ? <p className="mt-2 rounded-xl bg-brand-50 py-2.5 text-center text-sm font-semibold text-brand-700">Sudah check-in pukul {checkedIn.time} WIB</p>
        : <button onClick={check} disabled={busy} className={`${btnPrimary} mt-2 w-full`}><UserCheck className="size-4" />{busy ? 'Memproses...' : 'Check-in Hadir Sekarang'}</button>}
    </Card>
  )
}
