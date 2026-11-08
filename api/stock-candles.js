/**
 * Vercel Serverless Function Proxy
 * Nạp dữ liệu nến OHLCV thời gian thực từ Entrade/DNSE cho toàn bộ cổ phiếu VN
 * Giải quyết 100% triệt để lỗi CORS phía trình duyệt
 */

export default async function handler(req, res) {
  // Cho phép mọi Origin gọi API (CORS headers)
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

  const resParam = resolution === '1H' ? '1H' : resolution === '15' ? '15' : '1D';

  const targetUrl = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?symbol=${cleanSymbol}&from=${fromSec}&to=${toSec}&resolution=${resParam}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: `Upstream error ${upstreamRes.status}` });
    }

    const data = await upstreamRes.json();
    // Cache 60s trên edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
