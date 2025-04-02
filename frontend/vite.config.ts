import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/bulmaca/app/', // Path includes repository name and app subdirectory
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
