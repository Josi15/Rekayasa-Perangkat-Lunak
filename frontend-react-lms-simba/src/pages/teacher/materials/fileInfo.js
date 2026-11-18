import { formatSize } from '../../../components/forms/AttachmentPicker'

// Format & ukuran diambil dari lampiran pertama; materi tanpa lampiran = teks.
export function fileInfo(m) {
  const f = m.attachments[0]
  if (!f) return { format: 'TEKS', label: 'TEKS' }
  const format = f.name.split('.').pop().toUpperCase()
  return { format, label: `${format} • ${formatSize(f.size)}` }
}
