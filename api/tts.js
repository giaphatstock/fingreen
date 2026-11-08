import { EdgeTTS } from 'node-edge-tts'

const cache = new Map()

export default async function handler(req, res) {
  try {
    const text = req.query.text || ''
    const voice = req.query.voice || 'nam'

    if (!text) {
      res.status(400).send('Missing text')
      return
    }

    const voiceName = voice === 'nu' ? 'vi-VN-HoaiMyNeural' : 'vi-VN-NamMinhNeural'
    const cacheKey = `${voiceName}:${text}`

    if (cache.has(cacheKey)) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.send(cache.get(cacheKey))
      return
    }

    // Chuẩn hóa tên viết tắt tài chính
    const cleanText = text
      .replace(/VN-?Index/gi, 'Vê En In Đếch')
      .replace(/VSC/gi, 'Vê Ét Xê')
      .replace(/HPG/gi, 'Hát Pê Gờ')
      .replace(/SSI/gi, 'Ét Ét I')
      .replace(/FPT/gi, 'Ép Pê Tê')
      .replace(/MWG/gi, 'Mờ Kép Gờ')
      .replace(/VND/gi, 'Vê En Đê')
      .replace(/TAL/gi, 'Tê A Lờ')
      .replace(/VHM/gi, 'Vê Hát Mờ')
      .replace(/VIC/gi, 'Vê I Xê')
      .replace(/CEO/gi, 'Xê E O')
      .replace(/Shark/gi, 'Sác')
      .replace(/đồng/gi, 'đồng')

    const tts = new EdgeTTS({
      voice: voiceName,
      lang: 'vi-VN',
      rate: '+16%'
    })

    const chunks = []
    for await (const chunk of tts.streamAudio(cleanText)) {
      if (Buffer.isBuffer(chunk)) chunks.push(chunk)
    }

    const buf = Buffer.concat(chunks)
    cache.set(cacheKey, buf)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(buf)
  } catch (err) {
    console.error('Lỗi TTS trên Vercel:', err)
    res.status(500).send(err.message)
  }
}
