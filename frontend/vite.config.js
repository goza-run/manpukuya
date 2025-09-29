import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendUrl="https://manpukuya.onrender.com";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ↓↓↓ この server の部分を丸ごと追加してください ↓↓↓
  server: {
    proxy: {
      // '/api'で始まるリクエストをバックエンドに転送する
      '/api': {
        target: 'http://localhost:4000', // あなたのバックエンドサーバー
        changeOrigin: true,
      },
      // ↓↓↓ 画像用の転送ルールを追加 ↓↓↓
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  },
  // ↓↓↓ この optimizeDeps の部分を丸ごと追加してください ↓↓↓
  optimizeDeps: {
    exclude: ['fsevents'],
  },
   // ↓↓↓ 本番環境用の設定を追加 ↓↓↓
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.NODE_ENV === 'production' ? backendUrl : ''),
    'process.env.VITE_UPLOADS_BASE_URL': JSON.stringify(process.env.NODE_ENV === 'production' ? backendUrl : '')
  }
})