// Pemeriksa statis rute & tautan (tanpa dependensi): `npm run check:routes`
//  1) setiap item menu di navigation.js punya rute di <peran>Routes.jsx;
//  2) setiap tautan literal ("/student/..." pada to=, navigate(), Navigate, breadcrumb, roleHome) menuju rute yang ada.
// Keterbatasan: hanya membaca string literal; tautan yang dirangkai dinamis penuh tidak terperiksa.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname
const read = (f) => readFileSync(join(SRC, f), 'utf8')
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(n) ? [p] : [] })

const roles = ['student', 'teacher', 'admin']
const nav = read('routes/navigation.js')
const routes = new Set(['/', '/login', '/forgot-password', '/reset-password', '/403'])
const errors = []

for (const role of roles) {
  const block = nav.split(new RegExp(`\\b${role}: \\[`))[1].split(/\n  \],/)[0]
  const menu = [...block.matchAll(/path: '([^']+)'/g)].map((m) => m[1])
  const rsrc = read(`routes/${role}Routes.jsx`)
  const defined = [...rsrc.matchAll(/path: '([^']+)'/g)].map((m) => m[1]).filter((p) => !p.startsWith('/'))
  routes.add(`/${role}`)
  defined.forEach((p) => routes.add(`/${role}/${p}`))
  menu.forEach((p) => { if (!defined.includes(p)) errors.push(`menu ${role}/${p} tidak punya rute di ${role}Routes.jsx`) })
}

const patterns = [/\bto=["'`]([^"'`]+)["'`]/g, /\bto=\{["'`]([^"'`]+)["'`]\}/g, /\bto: ["'`]([^"'`]+)["'`]/g, /navigate\(["'`]([^"'`]+)["'`]/g, /\bhref=["'`](\/[^"'`]+)["'`]/g, /: '(\/(?:student|teacher|admin)\/[^']+)'/g]
const matches = (link) => {
  const segs = link.split('/')
  return [...routes].some((r) => { const rs = r.split('/'); return rs.length === segs.length && rs.every((s, i) => s.startsWith(':') || s === segs[i]) })
}
let checked = 0
for (const file of walk(SRC)) {
  if (file.includes('/test/') || file.includes('/services/')) continue // services/ berisi path API, bukan rute UI
  const text = readFileSync(file, 'utf8')
  for (const re of patterns) for (const m of text.matchAll(re)) {
    let link = m[1]
    if (!link.startsWith('/')) continue
    link = link.split(/[?#]/)[0].replace(/\$\{[^}]*\}/g, ':p').replace(/\/+$/, '') || '/'
    // pola `/${role}` dinamis penuh tidak bisa diperiksa
    if (link.startsWith('/:p') ) continue
    checked++
    if (!matches(link)) errors.push(`${file.replace(SRC, 'src/')}: tautan "${m[1]}" tidak cocok dengan rute mana pun`)
  }
}
console.log(`Rute terdaftar: ${routes.size}. Tautan literal diperiksa: ${checked}.`)
if (errors.length) { console.error(errors.map((e) => ` ✗ ${e}`).join('\n')); process.exit(1) }
console.log('OK: semua menu punya rute dan semua tautan literal valid.')
