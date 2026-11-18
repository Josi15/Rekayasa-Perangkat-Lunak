// Penyimpanan simulasi di localStorage (diganti API pada fase backend).
export const store = {
  get(key, fallback) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* penyimpanan tidak tersedia */ }
  },
}
export const emitNoticeChange = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('simba:notices')) }
