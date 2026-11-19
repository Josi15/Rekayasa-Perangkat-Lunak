import { Leaf } from 'lucide-react'

// src/assets/logo.png = logo berbingkai (panel hijau); src/assets/logo-mark.png = logo tanpa bingkai (latar putih).
const framed = Object.values(import.meta.glob('../../assets/logo.{png,svg,jpg,jpeg,webp}', { eager: true, import: 'default' }))[0]
const mark = Object.values(import.meta.glob('../../assets/logo-mark.{png,svg,jpg,jpeg,webp}', { eager: true, import: 'default' }))[0]

export default function Logo({ variant = 'framed', className = 'size-10', rounded = 'rounded-xl' }) {
  const src = variant === 'mark' ? mark ?? framed : framed ?? mark
  return src
    ? <img src={src} alt="Logo SIMBA SMAN 1 Teladan" className={`${className} ${rounded} object-contain`} />
    : <span className={`${className} ${rounded} grid place-items-center bg-white/15 text-simba-lime`}><Leaf className="size-1/2" /></span>
}
