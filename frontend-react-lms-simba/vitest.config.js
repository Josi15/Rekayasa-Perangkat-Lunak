import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

// Tes selalu memakai mode MOCK (data simulasi); tes lapisan API (src/test/api.test.js) memanggil modul services/api langsung dengan fetch stub.
export default defineConfig((env) => mergeConfig(viteConfig(env), defineConfig({ test: { env: { VITE_USE_MOCK: 'true' }, environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js', testTimeout: 15000 } })))
