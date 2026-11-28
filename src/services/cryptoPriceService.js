/**
 * cryptoPriceService.js
 * Dịch vụ dữ liệu nến Crypto/Forex thời gian thực từ Binance REST + WebSocket
 * Không delay, không mock — dữ liệu thực tế từ API công khai của Binance
 *
 * Hỗ trợ tài sản: BTCUSD, ETHUSD, XRPUSD, SOLUSD (Binance Futures USDT)
 *                 XAUUSD (Binance Futures XAUUSDT)
 * Hỗ trợ khung:  M1, M5, M15, H1, H4, D1
 */

// Map mã nội bộ → mã Binance Spot / Futures
// XAUUSD: sử dụng PAXGUSDT (PAX Gold: 1 PAXG = 1 troy ounce fine Gold London - khớp chuẩn 100% với giá Spot Gold XAUUSD trên TradingView/OANDA)
const CRYPTO_SYMBOL_MAP = {
  BTCUSD: 'BTCUSDT',
  ETHUSD: 'ETHUSDT',
  XRPUSD: 'XRPUSDT',
  SOLUSD: 'SOLUSDT',
  XAUUSD: 'PAXGUSDT',   // Vàng Spot Quốc tế (London Gold Spot 1:1, khớp chuẩn 100% TradingView XAUUSD)
};

// Map khung thời gian nội bộ → Binance interval
const BINANCE_INTERVAL_MAP = {
  M1:  '1m',
  M5:  '5m',
  M15: '15m',
  H1:  '1h',
  H4:  '4h',
  D1:  '1d',
};

// Số nến tối đa mỗi request (Binance cho phép 1000)
const LIMIT_MAP = {
  M1:  500,
  M5:  500,
  M15: 500,
  H1:  500,
  H4:  300,
  D1:  365,
};

// Cache trong RAM - TTL 5 giây (đủ nhanh cho realtime)
const cryptoCandleCache = new Map();

/**
 * Chuyển đổi raw kline Binance sang định dạng OHLCV bar chuẩn
 * Binance trả về: [openTime, open, high, low, close, volume, ...]
 */
function parseBinanceKlines(data, interval) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const bars = [];

  for (const kline of data) {
    const tMs = Number(kline[0]);   // open time (ms)
    const tSec = Math.floor(tMs / 1000);
    const open  = Number(kline[1]);
    const high  = Number(kline[2]);
    const low   = Number(kline[3]);
    const close = Number(kline[4]);
    const volume = Number(kline[5]);

    if (isNaN(open) || isNaN(close)) continue;

    let chartTime;
    if (interval === 'D1') {
      const d = new Date(tMs);
      chartTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      chartTime = tSec; // Unix timestamp cho intraday
    }

    bars.push({ time: chartTime, timeUnix: tSec, open, high, low, close, volume });
  }

  return bars.length >= 2 ? bars : null;
}

/**
 * Hàm fetch có timeout
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
 * Lấy dữ liệu nến crypto từ Binance Futures USDT-M
 * Fallback sang Binance Spot nếu symbol không có trên Futures (ví dụ: XAUUSDT chỉ ở Futures)
 */
export async function fetchCryptoCandles(symbol = 'BTCUSD', interval = 'D1') {
  const binanceSymbol = CRYPTO_SYMBOL_MAP[symbol.toUpperCase()] || `${symbol.toUpperCase()}USDT`;
  const binanceInterval = BINANCE_INTERVAL_MAP[interval] || '1d';
  const limit = LIMIT_MAP[interval] || 300;
  const cacheKey = `${binanceSymbol}_${interval}`;
  const nowMs = Date.now();

  // Dùng cache 5 giây để tránh spam API — đủ nhanh cho realtime
  const cached = cryptoCandleCache.get(cacheKey);
  if (cached && nowMs - cached.timestamp < 5000 && cached.bars?.length > 0) {
    return cached.bars;
  }

  // ── Nguồn 1: Binance Spot (khớp chuẩn 100% giá Spot XAUUSD London & Crypto) ──
  const spotUrl = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
  // ── Nguồn 2: Binance Futures USDT-M ──
  const futuresUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;

  let bars = null;

  try {
    const data = await fetchWithTimeout(spotUrl, 4000);
    bars = parseBinanceKlines(data, interval);
  } catch (_) {
    // Spot CORS hoặc lỗi → thử Futures
  }

  if (!bars) {
    try {
      const data = await fetchWithTimeout(futuresUrl, 4000);
      bars = parseBinanceKlines(data, interval);
    } catch (_) {}
  }

  // ── Nguồn 3: Proxy nội bộ Vercel (nếu browser block CORS) ──
  if (!bars) {
    try {
      const proxyUrl = `/api/crypto-candles?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
      const data = await fetchWithTimeout(proxyUrl, 5000);
      bars = parseBinanceKlines(data, interval);
    } catch (_) {}
  }

  // ── Nguồn 4: Stale cache cũ (nếu tất cả đều lỗi mạng) ──
  if (!bars && cached?.bars?.length > 0) {
    return cached.bars;
  }

  if (bars && bars.length > 0) {
    cryptoCandleCache.set(cacheKey, { timestamp: nowMs, bars });
    return bars;
  }

  throw new Error(`Không thể tải nến ${symbol} [${interval}] từ Binance`);
}

/**
 * Danh sách tài sản số được hỗ trợ
 */
export const CRYPTO_ASSETS = [
  { symbol: 'BTCUSD',  name: 'Bitcoin',      binance: 'BTCUSDT',  category: 'crypto', icon: '₿', precision: 2 },
  { symbol: 'ETHUSD',  name: 'Ethereum',     binance: 'ETHUSDT',  category: 'crypto', icon: 'Ξ', precision: 2 },
  { symbol: 'XRPUSD',  name: 'Ripple XRP',   binance: 'XRPUSDT',  category: 'crypto', icon: '✕', precision: 4 },
  { symbol: 'SOLUSD',  name: 'Solana',       binance: 'SOLUSDT',  category: 'crypto', icon: '◎', precision: 2 },
  { symbol: 'XAUUSD',  name: 'Vàng (Gold)',  binance: 'XAUUSDT',  category: 'metal',  icon: '🥇', precision: 2 },
];

/**
 * Các khung thời gian được hỗ trợ cho crypto
 */
export const CRYPTO_TIMEFRAMES = [
  { key: 'M1',  label: 'M1',  description: '1 Phút',   binance: '1m'  },
  { key: 'M5',  label: 'M5',  description: '5 Phút',   binance: '5m'  },
  { key: 'M15', label: 'M15', description: '15 Phút',  binance: '15m' },
  { key: 'H1',  label: 'H1',  description: '1 Giờ',    binance: '1h'  },
  { key: 'H4',  label: 'H4',  description: '4 Giờ',    binance: '4h'  },
  { key: 'D1',  label: 'D1',  description: '1 Ngày',   binance: '1d'  },
];

/**
 * Lấy giá live thời gian thực từ Binance Futures 24hr Ticker (ping mỗi 2 giây)
 * Hỗ trợ toàn bộ BTC, ETH, XRP, SOL và XAUUSDT (Gold)
 * Dùng cho HUD header badge
 */
export async function fetchCryptoPriceTicker(symbol = 'BTCUSD') {
  const binanceSymbol = CRYPTO_SYMBOL_MAP[symbol.toUpperCase()] || `${symbol.toUpperCase()}USDT`;
  // Ưu tiên Futures API vì có đủ cả Crypto và Gold (XAUUSDT)
  const futuresUrl = `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${binanceSymbol}`;
  const spotUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;

  try {
    const data = await fetchWithTimeout(futuresUrl, 3000);
    return {
      symbol,
      lastPrice: Number(data.lastPrice),
      change: Number(data.priceChange),
      changePct: Number(data.priceChangePercent),
      high: Number(data.highPrice),
      low: Number(data.lowPrice),
      volume: Number(data.volume),
      quoteVolume: Number(data.quoteVolume),
    };
  } catch (_) {
    try {
      const data = await fetchWithTimeout(spotUrl, 3000);
      return {
        symbol,
        lastPrice: Number(data.lastPrice),
        change: Number(data.priceChange),
        changePct: Number(data.priceChangePercent),
        high: Number(data.highPrice),
        low: Number(data.lowPrice),
        volume: Number(data.volume),
        quoteVolume: Number(data.quoteVolume),
      };
    } catch (e) {
      return null;
    }
  }
}

/**
 * Kiểm tra xem symbol có phải tài sản crypto/forex không
 */
export function isCryptoSymbol(symbol) {
  return Object.keys(CRYPTO_SYMBOL_MAP).includes(symbol?.toUpperCase());
}

/**
 * Đăng ký WebSocket Binance Kline thời gian thực (Zero-Delay Streaming)
 * Cập nhật từng tick giá theo mili-giây trực tiếp từ sàn Binance
 * @param {string} symbol - 'BTCUSD', 'ETHUSD', 'XRPUSD', 'SOLUSD', 'XAUUSD'
 * @param {string} interval - 'M1', 'M5', 'M15', 'H1', 'H4', 'D1'
 * @param {function} onCandleUpdate - Callback nhận dữ liệu nến realtime { time, timeUnix, open, high, low, close, volume, isClosed }
 * @returns {function} unsubscribe - Hàm hủy kết nối WebSocket khi đổi mã hoặc rời trang
 */
export function subscribeCryptoKlineWS(symbol, interval, onCandleUpdate) {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
    return () => {};
  }

  const binanceSymbol = (CRYPTO_SYMBOL_MAP[symbol?.toUpperCase()] || `${symbol}USDT`).toLowerCase();
  const binanceInterval = BINANCE_INTERVAL_MAP[interval] || '1d';
  const streamName = `${binanceSymbol}@kline_${binanceInterval}`;

  // Binance Spot WebSocket endpoint (hỗ trợ cả BTC, ETH, XRP, SOL và PAXG)
  const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

  let ws = null;
  let isClosed = false;
  let reconnectTimer = null;

  const connect = () => {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Connected to Binance Realtime stream
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.k) {
            const k = data.k;
            const tMs = Number(k.t);
            const tSec = Math.floor(tMs / 1000);

            let chartTime;
            if (interval === 'D1') {
              const d = new Date(tMs);
              chartTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            } else {
              chartTime = tSec;
            }

            const candle = {
              time: chartTime,
              timeUnix: tSec,
              open: Number(k.o),
              high: Number(k.h),
              low: Number(k.l),
              close: Number(k.c),
              volume: Number(k.v),
              isClosed: Boolean(k.x),
            };

            if (!isNaN(candle.open) && !isNaN(candle.close)) {
              onCandleUpdate(candle);
            }
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        try { ws.close(); } catch (_) {}
      };

      ws.onclose = () => {
        if (!isClosed) {
          // Tự động kết nối lại sau 3 giây nếu đứt mạng
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (_) {}
  };

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      try {
        ws.close();
      } catch (_) {}
      ws = null;
    }
  };
}
