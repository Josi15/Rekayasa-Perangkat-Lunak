import { useRef, useState } from 'react'
import { Paperclip, X, FileText } from 'lucide-react'
import { ALLOWED_EXT, MAX_FILES, MAX_MB, extOf, fmtSize, validateFile } from '../../utils/fileValidation.js'

// Menyimpan hanya metadata berkas (nama, ukuran, tipe); unggah sungguhan menunggu backend.
export default function AttachmentPicker({ files, onChange, error, disabled }) {
  const ref = useRef(null)
  const [problems, setProblems] = useState([])

  const add = (list) => {
    const next = [...files]
    const errs = []
    Array.from(list).forEach((f) => {
      const err = validateFile(f, next)
      if (err) errs.push(err)
      else next.push({ name: f.name, size: f.size, type: extOf(f.name) })
    })
    setProblems(errs)
    onChange(next)
  }
  const pick = (e) => { add(e.target.files); e.target.value = '' }
  const drop = (e) => { e.preventDefault(); if (!disabled) add(e.dataTransfer.files) }
  const remove = (name) => { setProblems([]); onChange(files.filter((f) => f.name !== name)) }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">Lampiran (opsional)</span>
      <input ref={ref} type="file" multiple hidden accept={ALLOWED_EXT.map((e) => `.${e}`).join(',')} onChange={pick} />
      <button type="button" disabled={disabled} onClick={() => ref.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={drop}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-simba-line bg-simba-bg/60 px-4 py-6 text-center text-sm text-slate-600 hover:bg-brand-50 disabled:opacity-50">
        <Paperclip className="size-6 text-brand-600" /><b className="text-slate-800">Tarik & jatuhkan dokumen ke sini</b>atau klik untuk memilih dokumen dari perangkat
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
