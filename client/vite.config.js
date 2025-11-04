import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',   // critical: ensures /assets/... not absolute http://...
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.20.130:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})