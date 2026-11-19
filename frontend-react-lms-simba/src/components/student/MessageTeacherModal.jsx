import { useState } from 'react'
import { Modal } from '../common/Modal.jsx'
import { useToast } from '../common/Toast.jsx'
import TextArea from '../forms/TextArea.jsx'
import { btnPrimary } from '../../utils/styles.js'

export default function MessageTeacherModal({ teacher, onClose }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const send = (e) => {
    e.preventDefault()
    if (text.trim().length < 10) return setError('Pesan minimal 10 karakter.')
    toast(`Pesan untuk ${teacher} tercatat (simulasi, belum terkirim ke server).`)
    onClose()
  }
  return (
    <Modal open title={`Kirim pesan ke ${teacher}`} onClose={onClose}>
      <form onSubmit={send} noValidate className="space-y-3">
        <TextArea label="Pesan" rows={4} value={text} onChange={(e) => setText(e.target.value)} error={error} hint={`${text.length}/500`} maxLength={500} />
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">Batal</button><button className={btnPrimary}>Kirim pesan</button></div>
      </form>
    </Modal>
  )
}
