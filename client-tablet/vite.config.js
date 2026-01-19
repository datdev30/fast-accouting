import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Tablet client configuration - optimized for tablet devices
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-tablet',
    assetsDir: 'assets',
  },
  server: {
    port: 5173, // Same as CORS allowed; kill desktop client if using 5173
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
