/**
 * Vercel Serverless Function Proxy
 * Nạp dữ liệu nến OHLCV thời gian thực từ Entrade/DNSE & VNDirect cho toàn bộ cổ phiếu VN
 * Giải quyết triệt để lỗi CORS và độ trễ trên mọi thiết bị
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { symbol = 'FPT', resolution = '1D', from, to } = req.query;
  const cleanSymbol = String(symbol).toUpperCase().trim();
  const toSec = to ? parseInt(to, 10) : Math.floor(Date.now() / 1000);
  const fromSec = from ? parseInt(from, 10) : toSec - (365 * 86400);

  const resParam = resolution === '60' ? '1H' : (resolution || '1D');
  const vndRes = resolution === '1H' ? '60' : (resolution === '1D' ? 'D' : (resolution || 'D'));

  const urls = [
    `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?symbol=${cleanSymbol}&from=${fromSec}&to=${toSec}&resolution=${resParam}`,
    `https://dchart-api.vndirect.com.vn/dchart/history?resolution=${vndRes}&symbol=${cleanSymbol}&from=${fromSec}&to=${toSec}`
  ];

  for (const targetUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const upstreamRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        if (data && data.t && Array.isArray(data.t) && data.t.length > 0) {
          res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60');
          return res.status(200).json(data);
        }
      }
    } catch (_) {
      // Thử nguồn tiếp theo
    }
  }

  return res.status(500).json({ error: 'Failed to fetch candles from all upstream sources' });
}
