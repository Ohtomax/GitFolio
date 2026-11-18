import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // The root NODE_ENV belongs to the API. Loading it during a client build
  // would make Vite bundle React's development runtime into production output.
  const environment = command === 'serve' ? loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), 'SERVER_') : {}
  return {
  plugins: [react()],
  build: { manifest: true },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: `http://${environment.SERVER_HOST || '127.0.0.1'}:${environment.SERVER_PORT || '3001'}` } },
  },
  }
})
