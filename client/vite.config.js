import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    watch: {
      usePolling: true, // Yeh system ko force karta hai changes check karne ke liye
    },
  }
})
