const tones = [['#6366f1', '#a5b4fc'], ['#0ea5e9', '#7dd3fc'], ['#10b981', '#6ee7b7'], ['#f59e0b', '#fcd34d']]

function Illustration({ cap, tone }) {
  const [a, b] = tones[tone]
  return (
    <figure className="my-4">
      <svg viewBox="0 0 640 240" className="w-full rounded-xl" role="img" aria-label={cap}>
        <defs><linearGradient id={`g${tone}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
        <rect width="640" height="240" fill={`url(#g${tone})`} />
        <circle cx="500" cy="70" r="46" fill="#fff" opacity=".35" />
        <path d="M0 200 Q160 100 320 170 T640 130 V240 H0Z" fill="#fff" opacity=".4" />
        <path d="M80 60h200M80 90h140M80 120h170" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity=".8" />
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">{cap}</figcaption>
    </figure>
  )
}

export default function MaterialBlocks({ blocks }) {
  return (
    <div className="text-slate-700">
      {blocks.map((b, i) => {
        if (b.t === 'h') return <h2 key={i} className="mb-2 mt-5 text-lg font-semibold text-slate-900">{b.v}</h2>
        if (b.t === 'p') return <p key={i} className="my-3 leading-relaxed">{b.v}</p>
        if (b.t === 'list') return <ul key={i} className="my-3 list-disc space-y-1 pl-6">{b.v.map((x) => <li key={x}>{x}</li>)}</ul>
        return <Illustration key={i} cap={b.cap} tone={b.tone} />
      })}
    </div>
  )
}
