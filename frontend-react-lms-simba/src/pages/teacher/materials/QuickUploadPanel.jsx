import { useRef, useState } from 'react'
import { CloudUpload, FileUp, X, Loader2 } from 'lucide-react'
import FormField from '../../../components/forms/FormField'
import { formatSize } from '../../../components/forms/AttachmentPicker'
import { useToast } from '../../../contexts/ToastContext'
import { teacherService } from '../../../services'

const EXT = ['pdf', 'pptx', 'docx']
const MAX = 25 * 1024 * 1024

// Hanya metadata (nama & ukuran) yang disimpan di mock; isi file TIDAK diunggah ke server.
export default function QuickUploadPanel({ classes, onDone }) {
  const { notify } = useToast()
  const input = useRef(null)
  const [file, setFile] = useState(null)
  const [f, setF] = useState({ title: '', classId: '', status: 'published' })
  const [er, setEr] = useState({})
  const [saving, setSaving] = useState(false)

  const choose = (files) => {
    const x = files?.[0]
    if (!x) return
    const ext = x.name.split('.').pop().toLowerCase()
    if (!EXT.includes(ext)) return setEr((e) => ({ ...e, file: `${x.name}: format tidak didukung (PDF, PPTX, DOCX).` }))
    if (x.size > MAX) return setEr((e) => ({ ...e, file: `${x.name}: melebihi 25 MB.` }))
    setFile({ name: x.name, size: x.size }); setEr((e) => ({ ...e, file: undefined }))
  }
  const submit = async () => {
    const x = {}
    if (!file) x.file = 'Pilih berkas modul.'
    if (!f.title.trim()) x.title = 'Judul materi wajib diisi.'
    if (!f.classId) x.classId = 'Pilih kelas sasaran.'
    setEr(x)
    if (Object.keys(x).length) return
    setSaving(true)
    try {
      await teacherService.saveMaterial({ title: f.title.trim(), description: `Berkas ${file.name}`, content: '', classIds: [Number(f.classId)], attachments: [file], status: f.status })
      notify(f.status === 'published' ? 'Modul dirilis (simulasi); file tidak diunggah ke server.' : 'Draf modul disimpan (simulasi).', 'success')
      setFile(null); setF({ title: '', classId: '', status: 'published' }); onDone()
    } catch (e) { notify(e.message, 'error') } finally { setSaving(false) }
  }

  return (
    <aside className="panel space-y-4">
      <h2 className="flex items-center gap-3 font-bold"><span className="rounded-xl bg-brand-200 p-2 text-brand-700"><CloudUpload size={20} /></span>Unggah Cepat Modul Ajar</h2>
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files) }}
        className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-brand-50 p-5 text-center">
        <span className="rounded-full bg-slate-200 p-3 text-slate-600"><FileUp size={20} /></span>
        <p className="text-xs font-medium">Tarik & lepas berkas di sini</p>
        <p className="text-xs text-slate-500">PDF, PPTX, DOCX hingga maksimal 25 MB. Mode simulasi: file tidak diunggah ke server.</p>
        <input ref={input} type="file" hidden aria-label="Pilih berkas modul" onChange={(e) => { choose(e.target.files); e.target.value = '' }} />
        <button type="button" className="rounded-md bg-brand-100 px-3 py-1.5 text-xs font-semibold hover:bg-brand-200" onClick={() => input.current.click()}>Pilih dari Komputer</button>
      </div>
      {file && <p className="flex items-center gap-2 rounded-lg bg-brand-50 p-2 text-xs"><span className="flex-1 truncate">{file.name}</span><span className="text-slate-500">{formatSize(file.size)}</span><button aria-label="Hapus berkas" onClick={() => setFile(null)}><X size={14} /></button></p>}
      {er.file && <p role="alert" className="text-xs text-red-600">{er.file}</p>}
      <FormField label="Judul Materi / Bab" id="qtitle" error={er.title}><input id="qtitle" className="input bg-brand-50" placeholder="Contoh: Bab 5 - Matriks" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></FormField>
      <FormField label="Target Kelas Rombel" id="qclass" error={er.classId}><select id="qclass" className="input bg-brand-50" value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}><option value="">Pilih kelas</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
      <fieldset><legend className="mb-1 text-sm font-medium">Visibilitas Publikasi</legend>
        <div className="grid grid-cols-2 gap-2 text-xs">{[['published', 'Publik Siswa'], ['draft', 'Simpan Draf']].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2"><input type="radio" name="vis" checked={f.status === v} onChange={() => setF({ ...f, status: v })} />{l}</label>))}</div></fieldset>
      <button className="btn-primary w-full py-3" disabled={saving} onClick={submit}>{saving ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}{f.status === 'published' ? 'Unggah & Rilis Modul' : 'Unggah & Simpan Draf'}</button>
    </aside>
  )
}
