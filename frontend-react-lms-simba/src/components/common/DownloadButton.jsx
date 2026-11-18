import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { fileService, serviceMode } from '../../services'
import { useToast } from '../../contexts/ToastContext'

// Unduh berkas ber-otorisasi (cookie sesi). Hanya tampil di mode API untuk lampiran yang sudah tersimpan di server (`remote`).
export default function DownloadButton({ attachment }) {
  const { notify } = useToast()
  const [busy, setBusy] = useState(false)
  if (serviceMode.mock || !attachment?.remote) return null
  const go = async () => { setBusy(true); try { await fileService.download(attachment) } catch (e) { notify(e.message, 'error') } finally { setBusy(false) } }
  return <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={go} disabled={busy} aria-label={`Unduh ${attachment.name}`}>{busy ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Unduh</button>
}
