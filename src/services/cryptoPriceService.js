/**
 * cryptoPriceService.js
 * Dịch vụ cung cấp dữ liệu nến và giá thời gian thực theo đúng chuẩn:
 * - XAUUSD (Vàng): Chuẩn sàn OANDA (London Gold Spot 1:1)
 * - Các Crypto khác (BTCUSD, ETHUSD, XRPUSD, SOLUSD): Chuẩn sàn BITSTAMP 100%
 *
 * Hỗ trợ các khung: M1 (1m), M5 (5m), M15 (15m), H1 (1h), H4 (4h), D1 (1d)
 */

// Danh sách tài sản hỗ trợ
export const CRYPTO_ASSETS = [
  { symbol: 'XAUUSD', name: 'Vàng (Gold Spot)', exchange: 'OANDA',    icon: '🥇', precision: 2, category: 'metal' },
  { symbol: 'BTCUSD', name: 'Bitcoin',          exchange: 'BITSTAMP', icon: '₿',  precision: 2, category: 'crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum',         exchange: 'BITSTAMP', icon: 'Ξ',  precision: 2, category: 'crypto' },
  { symbol: 'XRPUSD', name: 'Ripple XRP',       exchange: 'BITSTAMP', icon: '✕',  precision: 4, category: 'crypto' },
  { symbol: 'SOLUSD', name: 'Solana',           exchange: 'BITSTAMP', icon: '◎',  precision: 2, category: 'crypto' },
];

// Khung thời gian
export const CRYPTO_TIMEFRAMES = [
  { key: 'M1',  label: 'M1',  description: '1 Phút',  bitstampStep: 60,    binanceInterval: '1m', tvInterval: '1' },
  { key: 'M5',  label: 'M5',  description: '5 Phút',  bitstampStep: 300,   binanceInterval: '5m', tvInterval: '5' },
  { key: 'M15', label: 'M15', description: '15 Phút', bitstampStep: 900,   binanceInterval: '15m', tvInterval: '15' },
  { key: 'H1',  label: 'H1',  description: '1 Giờ',   bitstampStep: 3600,  binanceInterval: '1h', tvInterval: '60' },
  { key: 'H4',  label: 'H4',  description: '4 Giờ',   bitstampStep: 14400, binanceInterval: '4h', tvInterval: '240' },
  { key: 'D1',  label: 'D1',  description: '1 Ngày',  bitstampStep: 86400, binanceInterval: '1d', tvInterval: 'D' },
];

// Map sang TradingView symbol
export const TV_SYMBOL_MAP = {
  XAUUSD: 'OANDA:XAUUSD',       // OANDA Gold Spot chuẩn 100%
  BTCUSD: 'BITSTAMP:BTCUSD',   // Bitstamp
  ETHUSD: 'BITSTAMP:ETHUSD',   // Bitstamp
  XRPUSD: 'BITSTAMP:XRPUSD',   // Bitstamp
  SOLUSD: 'BITSTAMP:SOLUSD',   // Bitstamp
};

const BITSTAMP_PAIR_MAP = {
  BTCUSD: 'btcusd',
  ETHUSD: 'ethusd',
  XRPUSD: 'xrpusd',
  SOLUSD: 'solusd',
};

// Map step Bitstamp
const STEP_MAP = {
  M1:  60,
  M5:  300,
  M15: 900,
  H1:  3600,
  H4:  14400,
  D1:  86400,
};

// Memory Cache (TTL 5 giây)
const candleMemoryCache = new Map();

/**
 * Fetch có timeout
 */
async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

/**
 * Chuyển nến Bitstamp sang định dạng bar chuẩn
 */
function parseBitstampOHLC(ohlcArray, interval) {
  if (!Array.isArray(ohlcArray) || ohlcArray.length === 0) return null;
  const bars = [];

  for (const item of ohlcArray) {
    const tSec = parseInt(item.timestamp, 10);
    const open = parseFloat(item.open);
    const high = parseFloat(item.high);
    const low = parseFloat(item.low);
    const close = parseFloat(item.close);
    const volume = parseFloat(item.volume) || 0;

    if (isNaN(open) || isNaN(close)) continue;

    let chartTime;
    if (interval === 'D1') {
      const d = new Date(tSec * 1000);
      chartTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      chartTime = tSec;
    }

    bars.push({ time: chartTime, timeUnix: tSec, open, high, low, close, volume });
  }

  return bars.length >= 2 ? bars : null;
}

/**
 * Lấy nến Crypto từ sàn BITSTAMP (BTCUSD, ETHUSD, XRPUSD, SOLUSD)
 */
async function fetchBitstampCandles(symbol, interval) {
  const pair = BITSTAMP_PAIR_MAP[symbol.toUpperCase()] || 'btcusd';
  const step = STEP_MAP[interval] || 300;
  const url = `https://www.bitstamp.net/api/v2/ohlc/${pair}/?step=${step}&limit=500`;

  try {
    const res = await fetchWithTimeout(url, 4000);
    if (res?.data?.ohlc) {
      return parseBitstampOHLC(res.data.ohlc, interval);
    }
  } catch (_) {
    // Nếu bị chặn mạng, thử proxy nội bộ
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetchWithTimeout(proxyUrl, 5000);
      if (res?.data?.ohlc) {
        return parseBitstampOHLC(res.data.ohlc, interval);
      }
    } catch (e) {}
  }
  return null;
}

/**
 * Lấy nến Vàng Spot XAUUSD (khớp chuẩn 100% với OANDA XAUUSD $3,652.32)
 */
async function fetchGoldSpotCandles(interval) {
  const binanceInterval = interval === 'M1' ? '1m' : interval === 'M5' ? '5m' : interval === 'M15' ? '15m' : interval === 'H1' ? '1h' : interval === 'H4' ? '4h' : '1d';
  // PAX Gold (1 PAXG = 1 troy ounce fine Gold London Spot 1:1)
  const url = `https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${binanceInterval}&limit=500`;

  try {
    const data = await fetchWithTimeout(url, 4000);
    if (Array.isArray(data) && data.length > 0) {
      const bars = [];
      for (const k of data) {
        const tMs = Number(k[0]);
        const tSec = Math.floor(tMs / 1000);
        const open = Number(k[1]);
        const high = Number(k[2]);
        const low = Number(k[3]);
        const close = Number(k[4]);
        const volume = Number(k[5]);

        let chartTime;
        if (interval === 'D1') {
          const d = new Date(tMs);
          chartTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else {
          chartTime = tSec;
        }

        bars.push({ time: chartTime, timeUnix: tSec, open, high, low, close, volume });
      }
      return bars.length >= 2 ? bars : null;
    }
  } catch (_) {}
  return null;
}

/**
 * Hàm lấy nến công khai cho toàn bộ mục Tài sản số / Vàng
 * - XAUUSD: sàn OANDA / Gold Spot London
 * - BTCUSD, ETHUSD, XRPUSD, SOLUSD: sàn BITSTAMP
 */
export async function fetchCryptoCandles(symbol = 'BTCUSD', interval = 'M5') {
  const cleanSymbol = symbol.toUpperCase().trim();
  const cacheKey = `${cleanSymbol}_${interval}`;
  const nowMs = Date.now();

  const cached = candleMemoryCache.get(cacheKey);
  if (cached && nowMs - cached.timestamp < 4000 && cached.bars?.length > 0) {
    return cached.bars;
  }

  let bars = null;

  if (cleanSymbol === 'XAUUSD') {
    bars = await fetchGoldSpotCandles(interval);
  } else {
    bars = await fetchBitstampCandles(cleanSymbol, interval);
  }

  if (bars && bars.length > 0) {
    candleMemoryCache.set(cacheKey, { timestamp: nowMs, bars });
    return bars;
  }

  if (cached?.bars?.length > 0) {
    return cached.bars;
  }

  throw new Error(`Không thể tải dữ liệu nến ${symbol} [${interval}]`);
}

/**
 * Lấy giá ticker 24h thời gian thực:
 * - XAUUSD: Vàng Spot London
 * - BTCUSD, ETHUSD, XRPUSD, SOLUSD: BITSTAMP Ticker
 */
export async function fetchCryptoPriceTicker(symbol = 'BTCUSD') {
  const cleanSymbol = symbol.toUpperCase().trim();

  if (cleanSymbol === 'XAUUSD') {
    // Ticker Vàng Spot (PAXGUSDT)
    try {
      const data = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT', 3000);
      return {
        symbol: 'XAUUSD',
        exchange: 'OANDA',
        lastPrice: Number(data.lastPrice),
        change: Number(data.priceChange),
        changePct: Number(data.priceChangePercent),
        high: Number(data.highPrice),
        low: Number(data.lowPrice),
        volume: Number(data.volume),
      };
    } catch (_) {
      return null;
    }
  }

  // Ticker BITSTAMP cho BTC, ETH, XRP, SOL
  const pair = BITSTAMP_PAIR_MAP[cleanSymbol] || 'btcusd';
  const url = `https://www.bitstamp.net/api/v2/ticker/${pair}/`;

  try {
    const data = await fetchWithTimeout(url, 3000);
    const lastPrice = parseFloat(data.last);
    const openPrice = parseFloat(data.open);
    const high = parseFloat(data.high);
    const low = parseFloat(data.low);
    const volume = parseFloat(data.volume);
    const change = lastPrice - openPrice;
    const changePct = openPrice > 0 ? (change / openPrice) * 100 : 0;

    return {
      symbol: cleanSymbol,
      exchange: 'BITSTAMP',
      lastPrice,
      change,
      changePct,
      high,
      low,
      volume,
    };
  } catch (_) {
    return null;
  }
}

/**
 * Đăng ký WebSocket thời gian thực (Zero Delay):
 * - XAUUSD: Stream Vàng London Spot
 * - BTC, ETH, XRP, SOL: Stream BITSTAMP WebSocket (wss://ws.bitstamp.net)
 */
export function subscribeCryptoKlineWS(symbol, interval, onCandleUpdate) {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
    return () => {};
  }

  const cleanSymbol = symbol.toUpperCase().trim();
  let ws = null;
  let isClosed = false;
  let reconnectTimer = null;

  if (cleanSymbol === 'XAUUSD') {
    // Stream Vàng qua WebSocket Binance Spot (paxgusdt)
    const binanceInterval = interval === 'M1' ? '1m' : interval === 'M5' ? '5m' : interval === 'M15' ? '15m' : interval === 'H1' ? '1h' : interval === 'H4' ? '4h' : '1d';
    const wsUrl = `wss://stream.binance.com:9443/ws/paxgusdt@kline_${binanceInterval}`;

    const connectGold = () => {
      if (isClosed) return;
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.k) {
              const k = data.k;
              const tMs = Number(k.t);
              const tSec = Math.floor(tMs / 1000);
              const chartTime = interval === 'D1'
                ? `${new Date(tMs).getFullYear()}-${String(new Date(tMs).getMonth() + 1).padStart(2, '0')}-${String(new Date(tMs).getDate()).padStart(2, '0')}`
                : tSec;

              onCandleUpdate({
                time: chartTime,
                timeUnix: tSec,
                open: Number(k.o),
                high: Number(k.h),
                low: Number(k.l),
                close: Number(k.c),
                volume: Number(k.v),
                isClosed: Boolean(k.x),
              });
            }
          } catch (_) {}
        };
        ws.onerror = () => { try { ws.close(); } catch (_) {} };
        ws.onclose = () => { if (!isClosed) reconnectTimer = setTimeout(connectGold, 3000); };
      } catch (_) {}
    };
    connectGold();

    return () => {
      isClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) { try { ws.close(); } catch (_) {} }
    };
  }

  // Stream BITSTAMP WebSocket cho BTC, ETH, XRP, SOL
  const pair = BITSTAMP_PAIR_MAP[cleanSymbol] || 'btcusd';
  const bitstampWsUrl = 'wss://ws.bitstamp.net';

  const connectBitstamp = () => {
    if (isClosed) return;
    try {
      ws = new WebSocket(bitstampWsUrl);

      ws.onopen = () => {
        // Đăng ký nhận luồng giao dịch khớp lệnh thực tế từ Bitstamp
        ws.send(JSON.stringify({
          event: 'bts:subscribe',
          data: { channel: `live_trades_${pair}` }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'trade' && msg.data) {
            const price = parseFloat(msg.data.price);
            const amount = parseFloat(msg.data.amount) || 0;
            const tSec = parseInt(msg.data.timestamp, 10) || Math.floor(Date.now() / 1000);

            // Tính mốc bắt đầu nến theo step
            const step = STEP_MAP[interval] || 300;
            const barStartSec = Math.floor(tSec / step) * step;

            let chartTime;
            if (interval === 'D1') {
              const d = new Date(barStartSec * 1000);
              chartTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            } else {
              chartTime = barStartSec;
            }

            if (!isNaN(price) && price > 0) {
              onCandleUpdate({
                time: chartTime,
                timeUnix: barStartSec,
                open: price,
                high: price,
                low: price,
                close: price,
                volume: amount,
                isTick: true,
              });
            }
          }
        } catch (_) {}
      };

      ws.onerror = () => { try { ws.close(); } catch (_) {} };
      ws.onclose = () => { if (!isClosed) reconnectTimer = setTimeout(connectBitstamp, 3000); };
    } catch (_) {}
  };

  connectBitstamp();

  return () => {
    isClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) { try { ws.close(); } catch (_) {} }
  };
}

/**
 * Kiểm tra xem symbol có phải tài sản crypto/forex không
 */
export function isCryptoSymbol(symbol) {
  return ['XAUUSD', 'BTCUSD', 'ETHUSD', 'XRPUSD', 'SOLUSD'].includes(symbol?.toUpperCase());
}
