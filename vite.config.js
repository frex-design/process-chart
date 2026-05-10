import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/process-chart/',
  build: {
    rollupOptions: {
      output: {
        // ベンダーライブラリを個別チャンクに分割
        // → アプリコード変更時にReact/Supabaseの再DLが不要になる
        // ※ qrcode.react は GuideModal と同じチャンクに自動バンドルされる（lazy import）
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
