import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/stock-candles': {
        target: 'https://services.entrade.com.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stock-candles/, '/chart-api/v2/ohlcs/stock')
      }
    }
  }
})
