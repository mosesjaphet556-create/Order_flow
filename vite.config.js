import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves from /Order_flow/ — must match repo name exactly
  base: '/Order_flow/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
          ],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
