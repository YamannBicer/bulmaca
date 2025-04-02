import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/bulmaca/', // Path includes only repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
