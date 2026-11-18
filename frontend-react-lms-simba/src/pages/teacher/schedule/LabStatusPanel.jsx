import { useState } from 'react'
import { Monitor, CalendarPlus } from 'lucide-react'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/forms/FormField'
import { useToast } from '../../../contexts/ToastContext'

function ReservationModal({ labs, slots, onClose }) {
  const { notify } = useToast()
  const [f, setF] = useState({ lab: '', slot: '', purpose: '' })
  const [er, setEr] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = () => {
    const x = {}
    if (!f.lab) x.lab = 'Pilih lab.'
    if (!f.slot) x.slot = 'Pilih slot jam.'
    if (!f.purpose.trim()) x.purpose = 'Keperluan wajib diisi.'
    setEr(x)
    if (Object.keys(x).length) return
    notify('Permintaan reservasi dicatat (simulasi); belum dikirim ke server.', 'success'); onClose()
  }
  return (
    <Modal open title="Reservasi Jadwal Lab" onClose={onClose} footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button className="btn-primary" onClick={submit}>Kirim permintaan</button></>}>
      <div className="space-y-3">
        <FormField label="Lab" id="rlab" error={er.lab}><select id="rlab" className="input" value={f.lab} onChange={set('lab')}><option value="">Pilih lab</option>{labs.map((x) => <option key={x.id}>{x.name}</option>)}</select></FormField>
        <FormField label="Slot jam" id="rslot" error={er.slot}><select id="rslot" className="input" value={f.slot} onChange={set('slot')}><option value="">Pilih slot</option>{slots.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.start} - {s.end})</option>)}</select></FormField>
        <FormField label="Keperluan" id="rpurpose" error={er.purpose}><input id="rpurpose" className="input" value={f.purpose} onChange={set('purpose')} /></FormField>
      </div>
    </Modal>
  )
}

export default function LabStatusPanel({ labs, slots }) {
  const [open, setOpen] = useState(false)
  return (
    <aside className="panel space-y-4 print:hidden">
      <div className="flex items-start justify-between gap-2"><h2 className="flex items-center gap-2 font-bold"><Monitor size={18} className="text-brand-700" />Status Lab Komputer Hari Ini</h2><span className="text-xs font-semibold text-brand-700">Simulasi</span></div>
      {labs.map((l) => (
        <div key={l.id} className="space-y-1.5 rounded-xl bg-brand-50 p-3 text-xs">
          <div className="flex items-center justify-between gap-2"><b className="text-sm">{l.name}</b>
            <span className={`rounded px-2 py-0.5 font-semibold ${l.status === 'available' ? 'bg-brand-200 text-brand-700' : 'bg-red-100 text-red-700'}`}>{l.status === 'available' ? 'Tersedia' : `Terpakai (${l.usedBy})`}</span></div>
          <p className="text-slate-600">{l.note}</p>
        </div>
      ))}
      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-100 py-2.5 text-sm font-semibold hover:bg-brand-200" onClick={() => setOpen(true)}><CalendarPlus size={16} /> Reservasi Jadwal Lab</button>
      {open && <ReservationModal labs={labs} slots={slots} onClose={() => setOpen(false)} />}
    </aside>
  )
}
