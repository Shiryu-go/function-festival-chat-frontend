import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/function-festival-chat-frontend/", // ← GitHub Pages のURLに合わせる
  build: {
    outDir: "docs", // ← ここが重要
    emptyOutDir: true
  }
})
