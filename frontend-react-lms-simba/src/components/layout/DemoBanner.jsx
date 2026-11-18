import { Info } from 'lucide-react'
import { serviceMode } from '../../services'

// Pengingat tetap bahwa aplikasi masih memakai data simulasi dan pembatasan peran hanya di sisi klien.
export default function DemoBanner() {
  if (serviceMode.live) return null // data sungguhan dari backend: tidak ada banner demo
  return (
    <p role="note" className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 print:hidden">
      <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span><b>Mode demo:</b> data hanya simulasi di memori (bukan database sebenarnya) dan kembali ke awal saat halaman dimuat ulang. Pembatasan peran di antarmuka ini hanya untuk UX; otorisasi sesungguhnya dilakukan backend.</span>
    </p>
  )
}
