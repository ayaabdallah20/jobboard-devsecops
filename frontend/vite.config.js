import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Le proxy redirige /api et /uploads vers le backend FastAPI
const API = process.env.VITE_API_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': API, '/uploads': API },
  },
})
