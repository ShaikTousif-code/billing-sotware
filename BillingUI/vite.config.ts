import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get API URL from environment or use default
const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT || '3000', 10),
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: false
      }
    }
  }
})

