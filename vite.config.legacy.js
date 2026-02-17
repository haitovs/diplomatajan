import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-legacy',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.legacy.html',
    },
  },
})
