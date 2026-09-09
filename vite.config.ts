import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    // Función pura sin DOM (mapearResultadoArasaac): entorno node alcanza.
    // passWithNoTests: el runner queda operativo aunque la Fase 1 no tenga tests.
    environment: 'node',
    passWithNoTests: true,
    // Los unit tests viven en src/ (co-located con el código). tests/ es el
    // testDir de Playwright (e2e) — vitest NO debe recolectar esos specs.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
