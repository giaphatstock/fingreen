import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { EdgeTTS } from 'node-edge-tts'

// Plugin cung cấp endpoint TTS tiếng Việt Neural chất lượng cao chuẩn VTV / TikTok Financial Studio
function ttsProxyPlugin() {
  const cache = new Map()
  return {
    name: 'tts-proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost:5173')
          const text = url.searchParams.get('text') || ''
          const voiceParam = url.searchParams.get('voice') || 'nam'
          if (!text) {
            res.statusCode = 400
            res.end('Missing text')
            return
          }

          // Làm sạch văn bản và chuẩn hóa từ vựng tài chính
          const cleanText = text
            .replace(/[\n\r]+/g, ' ')
            .replace(/VN-INDEX/gi, 'Vê En In Đếch')
            .replace(/VNINDEX/gi, 'Vê En In Đếch')
            .replace(/\bVND\b/g, 'đồng')
            .slice(0, 300)
            .trim()

          const cacheKey = `${voiceParam}:${cleanText}`
          if (cache.has(cacheKey)) {
            res.setHeader('Content-Type', 'audio/mpeg')
            res.setHeader('Cache-Control', 'public, max-age=86400')
            res.end(cache.get(cacheKey))
            return
          }

          // 'nam': vi-VN-NamMinhNeural (BTV Nam thời sự tài chính, uy tín, dứt khoát)
          // 'nu': vi-VN-HoaiMyNeural (BTV Nữ truyền cảm, cuốn hút)
          const voiceName = voiceParam === 'nu' ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural'

          const tts = new EdgeTTS({
            voice: voiceName,
            lang: 'vi-VN',
            rate: '+16%', // Nhịp điệu dứt khoát, nhanh nhẹn cuốn hút chuẩn TikTok
            outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
          })

          const chunks = []
          for await (const chunk of tts.streamAudio(cleanText)) {
            if (Buffer.isBuffer(chunk)) chunks.push(chunk)
          }

          const buf = Buffer.concat(chunks)
          cache.set(cacheKey, buf)
          res.setHeader('Content-Type', 'audio/mpeg')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.end(buf)
        } catch (err) {
          console.error('Lỗi TTS Proxy:', err)
          res.statusCode = 500
          res.end(err.message)
        }
      })
    }
  }
}

// Plugin cào toàn bộ nội dung chi tiết bài báo (Full Article Content) không bị cụt
function articleScraperPlugin() {
  return {
    name: 'article-scraper-middleware',
    configureServer(server) {
      server.middlewares.use('/api/fetch-article', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173')
          const articleUrl = urlObj.searchParams.get('url') || ''
          if (!articleUrl) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing article url' }))
            return
          }

          const response = await fetch(articleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          })

          if (!response.ok) {
            res.statusCode = response.status
            res.end(JSON.stringify({ error: 'Failed to fetch article: ' + response.statusText }))
            return
          }

          const html = await response.text()

          // Trích xuất các đoạn văn bản trong bài báo
          const paragraphs = []
          const regex = /<p[^>]*>([\s\S]*?)<\/p>/gi
          let match
          while ((match = regex.exec(html)) !== null) {
            const text = match[1].replace(/<[^>]*>?/gm, '').trim()
            if (
              text.length > 25 &&
              !text.includes('function(') &&
              !text.includes('var ') &&
              !text.includes('Watchlist') &&
              !text.includes('MỚI NHẤT') &&
              !text.includes('Bình luận') &&
              !text.includes('Ý kiến của bạn')
            ) {
              paragraphs.push(text)
            }
          }

          const fullContent = paragraphs.join('\n\n')

          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            success: true,
            fullContent: fullContent || '',
            paragraphCount: paragraphs.length,
            characterCount: fullContent.length
          }))
        } catch (err) {
          console.error('Lỗi fetch article:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ttsProxyPlugin(), articleScraperPlugin()],
  server: {
    proxy: {
      '/api/stock-candles': {
        target: 'https://services.entrade.com.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stock-candles/, '/chart-api/v2/ohlcs/stock')
      },
      '/api/cafef': {
        target: 'https://cafef.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cafef/, '')
      },
      '/api/vietstock': {
        target: 'https://vietstock.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vietstock/, '')
      },
      '/api/vneconomy': {
        target: 'https://vneconomy.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vneconomy/, '')
      }
    }
  }
})
