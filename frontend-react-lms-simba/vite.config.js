import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev: proxy /api dan /sanctum ke Laravel agar peramban hanya melihat SATU origin (sama seperti produksi di Railway).
// Pakai VITE_API_BASE_URL=/api/v1 di .env. Target proxy: VITE_DEV_PROXY_TARGET (default http://localhost:8000).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'
  return { plugins: [react(), tailwindcss()], server: { proxy: { '/api': { target, changeOrigin: false }, '/sanctum': { target, changeOrigin: false } } } }
})
