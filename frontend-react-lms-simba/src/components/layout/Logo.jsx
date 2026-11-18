import logo from '../../assets/logo.png'

// Logo resmi SIMBA (src/assets/logo.png) + wordmark teks.
export default function Logo({ size = 'md' }) {
  const big = size === 'lg'
  return (
    <div className={`flex items-center ${big ? 'gap-3' : 'gap-2'}`}>
      <img src={logo} alt="" className={big ? 'h-14 w-auto' : 'h-9 w-auto'} />
      <span className={`font-extrabold lowercase tracking-tight text-[#0f2b46] ${big ? 'text-4xl' : 'text-2xl'}`}>simba</span>
    </div>
  )
}
