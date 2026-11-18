import { useCallback, useState } from 'react'
import { Loader2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import AsyncBoundary from '../../components/common/AsyncBoundary'
import FormField from '../../components/forms/FormField'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../contexts/ToastContext'
import { settingService } from '../../services'

function SettingsForm({ initial, onSaved }) {
  const { notify } = useToast()
  const [f, setF] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try { await settingService.update(f); notify('Pengaturan disimpan (simulasi, hanya di memori).', 'success'); onSaved() } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return (
    <form onSubmit={submit} noValidate className="card max-w-xl space-y-4 p-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <FormField label="Nama sekolah" id="st-school"><input id="st-school" className="input" value={f.schoolName} onChange={set('schoolName')} /></FormField>
      <FormField label="Tahun ajaran" id="st-year"><input id="st-year" className="input" value={f.academicYear} onChange={set('academicYear')} placeholder="2026/2027" /></FormField>
      <FormField label="Semester" id="st-sem">
        <select id="st-sem" className="input" value={f.semester} onChange={set('semester')}><option>Ganjil</option><option>Genap</option></select>
      </FormField>
      <button className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Simpan pengaturan</button>
    </form>
  )
}

export default function AdminSettingsPage() {
  const state = useAsync(useCallback(() => settingService.get(), []))
  return (
    <>
      <PageHeader title="Pengaturan" description="Identitas sekolah dan tahun ajaran. Tahun ajaran juga tampil di halaman guru." breadcrumbs={[{ label: 'Beranda', to: '/admin/dashboard' }, { label: 'Pengaturan' }]} />
      <AsyncBoundary state={state}>{(s) => <SettingsForm initial={s} onSaved={state.reload} />}</AsyncBoundary>
    </>
  )
}
