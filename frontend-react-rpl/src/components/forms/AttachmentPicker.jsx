import { useRef, useState } from 'react'
import { Paperclip, X, FileText } from 'lucide-react'
import { ALLOWED_EXT, MAX_FILES, MAX_MB, extOf, fmtSize, validateFile } from '../../utils/fileValidation.js'

// Menyimpan hanya metadata berkas (nama, ukuran, tipe); unggah sungguhan menunggu backend.
export default function AttachmentPicker({ files, onChange, error, disabled }) {
  const ref = useRef(null)
  const [problems, setProblems] = useState([])

  const pick = (e) => {
    const next = [...files]
    const errs = []
    Array.from(e.target.files).forEach((f) => {
      const err = validateFile(f, next)
      if (err) errs.push(err)
      else next.push({ name: f.name, size: f.size, type: extOf(f.name) })
    })
    setProblems(errs)
    onChange(next)
    e.target.value = ''
  }
  const remove = (name) => { setProblems([]); onChange(files.filter((f) => f.name !== name)) }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">Lampiran (opsional)</span>
      <input ref={ref} type="file" multiple hidden accept={ALLOWED_EXT.map((e) => `.${e}`).join(',')} onChange={pick} />
      <button type="button" disabled={disabled} onClick={() => ref.current.click()} className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
        <Paperclip className="size-4" />Pilih berkas
      </button>
      <p className="mt-1 text-xs text-slate-500">Tipe: {ALLOWED_EXT.join(', ').toUpperCase()}. Maks. {MAX_MB} MB per berkas, {MAX_FILES} berkas.</p>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
              <FileText className="size-4 text-brand-600" /><span className="flex-1 truncate">{f.name}</span><span className="text-xs text-slate-500">{fmtSize(f.size)}</span>
              <button type="button" onClick={() => remove(f.name)} aria-label={`Hapus ${f.name}`}><X className="size-4 text-slate-400" /></button>
            </li>
          ))}
        </ul>
      )}
      {[...problems, ...(error ? [error] : [])].map((p) => <p key={p} className="mt-1 text-xs text-red-600" role="alert">{p}</p>)}
    </div>
  )
}
