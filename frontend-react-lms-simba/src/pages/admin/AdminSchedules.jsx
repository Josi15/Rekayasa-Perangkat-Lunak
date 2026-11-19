import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader.jsx'
import { ConfirmationDialog } from '../../components/common/Modal.jsx'
import { useToast } from '../../components/common/Toast.jsx'
import ScheduleFormModal from '../../components/admin/ScheduleFormModal.jsx'
import FilterSelect from '../../components/student/FilterSelect.jsx'
import AsyncBoundary from '../../components/student/AsyncBoundary.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { classScheduleService } from '../../services/index.js'
import { scheduleMeta } from '../../services/classSchedules.js'

export default function AdminSchedules() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const classId = Number(params.get('class')) || scheduleMeta.classes[0].id
  const cls = scheduleMeta.classes.find((c) => c.id === classId)
  const state = useAsync(useCallback(() => classScheduleService.getOverview(classId), [classId]))
  const [form, setForm] = useState(null) // { entry } saat modal terbuka
  const [toDelete, setToDelete] = useState(null)

  const save = async (v) => {
    if (form.entry) await classScheduleService.update(form.entry.id, v); else await classScheduleService.create(v)
    toast(form.entry ? 'Jadwal diperbarui.' : 'Jadwal ditambahkan.')
    setForm(null); state.reload()
  }
  const remove = async () => {
    await classScheduleService.remove(toDelete.id)
    toast('Jadwal dihapus.'); setToDelete(null); state.reload()
  }

  return (
    <>
      <PageHeader title="Jadwal Kelas" description="Atur jadwal pelajaran per kelas. Perubahan langsung terlihat di jadwal siswa kelas tersebut." breadcrumb={[{ label: 'Beranda', to: '/admin' }, { label: 'Jadwal Kelas' }]}
        actions={<button onClick={() => setForm({ entry: null })} className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"><Plus className="size-4" />Tambah jadwal</button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterSelect label="Pilih kelas" value={String(classId)} onChange={(v) => setParams({ class: v })} options={scheduleMeta.classes.map((c) => [String(c.id), c.name])} />
        <span className="text-sm text-slate-500">Wali kelas: {cls.homeroom} · {cls.students} siswa</span>
      </div>
      <AsyncBoundary state={state}>
        {({ entries, all }) => (
          <>
            {entries.length === 0 && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Kelas {cls.name} belum memiliki jadwal. Klik "Tambah jadwal" untuk mengatur.</p>}
            <div className="grid gap-3 md:grid-cols-5">
              {scheduleMeta.dayOptions.map(([d, label]) => (
                <section key={d} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{label}</h3>
                  {entries.filter((e) => e.day === d).length === 0 ? <p className="text-sm text-slate-500">Kosong</p> : (
                    <ul className="space-y-2">
                      {entries.filter((e) => e.day === d).map((e) => (
                        <li key={e.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                          <b className="text-slate-900">{e.courseName}</b>
                          <p className="text-slate-600">{e.start} - {e.end} · {e.room}</p><p className="text-slate-500">{e.teacher}</p>
                          <div className="mt-2 flex gap-3 text-xs">
                            <button onClick={() => setForm({ entry: e })} className="flex items-center gap-1 text-brand-600 hover:underline"><Pencil className="size-3" />Ubah</button>
                            <button onClick={() => setToDelete(e)} className="flex items-center gap-1 text-red-600 hover:underline"><Trash2 className="size-3" />Hapus</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
            {form && <ScheduleFormModal key={form.entry?.id ?? 'new'} initial={form.entry} classId={classId} all={all} onSave={save} onClose={() => setForm(null)} />}
          </>
        )}
      </AsyncBoundary>
      <ConfirmationDialog open={!!toDelete} title="Hapus jadwal?" message={toDelete ? `${toDelete.courseName} (${toDelete.start}-${toDelete.end}) akan dihapus dari jadwal ${cls.name}.` : ''} confirmLabel="Hapus" onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  )
}
