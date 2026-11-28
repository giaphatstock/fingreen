/**
 * /api/crypto-candles.js
 * Vercel Serverless Proxy cho Binance Klines API
 * Giải quyết CORS từ trình duyệt khi Binance bị block
 *
 * GET /api/crypto-candles?symbol=BTCUSDT&interval=1h&limit=300
 */

export default async function handler(req, res) {
  const { symbol = 'BTCUSDT', interval = '1d', limit = '300' } = req.query;

  // Chỉ cho phép các symbol hợp lệ (tránh abuse)
  const ALLOWED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'XAUUSDT'];
  const ALLOWED_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];

  if (!ALLOWED_SYMBOLS.includes(symbol.toUpperCase())) {
    return res.status(400).json({ error: `Symbol không hợp lệ: ${symbol}` });
  }
  if (!ALLOWED_INTERVALS.includes(interval)) {
    return res.status(400).json({ error: `Interval không hợp lệ: ${interval}` });
  }

  const cleanLimit = Math.min(Math.max(parseInt(limit) || 300, 10), 1500);

  // Thử Futures USDT-M trước → fallback Spot
  const urls = [
    `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${cleanLimit}`,
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${cleanLimit}`,
  ];

  for (const url of urls) {
    try {
      const upstream = await fetch(url, {
        headers: {
          'User-Agent': 'FinGreen/1.0 (Vietnam Trading Platform)',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!upstream.ok) continue;

      const data = await upstream.json();

      // Cache-control: giá trị realtime không cache lâu
      res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);
    } catch (_) {
      continue;
    }
  }

  return res.status(502).json({ error: 'Không kết nối được Binance API' });
}
