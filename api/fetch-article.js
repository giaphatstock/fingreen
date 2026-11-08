export default async function handler(req, res) {
  try {
    const articleUrl = req.query.url || ''
    if (!articleUrl) {
      res.status(400).json({ error: 'Missing article url' })
      return
    }

    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch article: ' + response.statusText })
      return
    }

    const html = await response.text()
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
    res.status(200).json({
      success: true,
      fullContent: fullContent || '',
      paragraphCount: paragraphs.length,
      characterCount: fullContent.length
    })
  } catch (err) {
    console.error('Lỗi fetch article trên Vercel:', err)
    res.status(500).json({ error: err.message })
  }
}
