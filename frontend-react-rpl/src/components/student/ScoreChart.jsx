// Grafik batang SVG sederhana (tanpa dependency) untuk nilai tugas terurut waktu.
export default function ScoreChart({ items }) {
  const W = 640, H = 240, L = 32, B = 70, T = 12
  const plotH = H - B - T
  const step = (W - L) / items.length
  const bw = Math.min(40, step * 0.6)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik nilai tugas">
      {[0, 50, 100].map((v) => {
        const y = T + plotH - (v / 100) * plotH
        return <g key={v}><line x1={L} x2={W} y1={y} y2={y} stroke="#e2e8f0" /><text x={L - 6} y={y + 3} fontSize="10" textAnchor="end" fill="#94a3b8">{v}</text></g>
      })}
      {items.map((it, i) => {
        const h = (it.score / it.max) * plotH
        const x = L + i * step + (step - bw) / 2
        const label = it.label.length > 16 ? `${it.label.slice(0, 15)}…` : it.label
        return (
          <g key={it.id}>
            <title>{`${it.label} (${it.courseName}): ${it.score}`}</title>
            <rect x={x} y={T + plotH - h} width={bw} height={h} rx="4" fill="#6366f1" />
            <text x={x + bw / 2} y={T + plotH - h - 4} fontSize="10" textAnchor="middle" fill="#334155">{it.score}</text>
            <text transform={`translate(${x + bw / 2} ${T + plotH + 10}) rotate(35)`} fontSize="9" fill="#64748b">{label}</text>
          </g>
        )
      })}
    </svg>
  )
}
