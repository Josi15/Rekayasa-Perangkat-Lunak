// Grafik batang sederhana nilai terbaru (0–100). Sengaja tanpa angka sebagai teks: nilai ada di judul/aria batang,
// angka lengkapnya tampil di daftar nilai.
export default function ScoreBars({ items }) {
  return (
    <div role="img" aria-label="Grafik nilai tugas terbaru" className="flex h-36 items-end gap-2">
      {items.map((x) => (
        <div key={x.id} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${x.title}: ${x.score}`}>
          <div className="rounded-t-md bg-brand-500" style={{ height: `${Math.max(4, Math.min(100, x.score))}%` }} />
        </div>
      ))}
    </div>
  )
}
