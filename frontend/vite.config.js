import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/transactions': 'http://localhost:4000',
      '/alerts': 'http://localhost:4000',
      '/stats': 'http://localhost:4000',
      '/inject': 'http://localhost:4000',
    },
  },
})
