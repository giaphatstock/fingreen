import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap, Search, RefreshCw, Sliders, ShieldCheck, ShieldAlert,
  TrendingUp, TrendingDown, Layers, Sparkles, BarChart2,
  Calendar, Info, Check, ChevronDown, Activity, Globe, Coins, Bitcoin
} from 'lucide-react';
import toast from 'react-hot-toast';
import GreenSmartOneChart from '../components/chart/GreenSmartOneChart';
import SmartAdaptiveHUD from '../components/chart/SmartAdaptiveHUD';
import IndicatorSettingsModal from '../components/chart/IndicatorSettingsModal';
import ExpiredLicenseModal from '../components/chart/ExpiredLicenseModal';
import DisclaimerModal from '../components/chart/DisclaimerModal';
import TradingViewClassicWidget from '../components/chart/TradingViewClassicWidget';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchStockCandles, POPULAR_STOCKS } from '../services/stockPriceService';
import {
  fetchCryptoCandles,
  fetchCryptoPriceTicker,
  subscribeCryptoKlineWS,
  CRYPTO_ASSETS,
  CRYPTO_TIMEFRAMES,
  isCryptoSymbol,
} from '../services/cryptoPriceService';
import { computeGreenSmartOne, validateLicense } from '../services/greenSmartOneEngine';
import ALL_LISTED_STOCKS from '../data/allStockCodes.json';

// ─── Khung thời gian chứng khoán VN ─────────────────────────────────────────
const VN_TIMEFRAMES = [
  { key: '1D', label: '1D', description: '1 Ngày' },
  { key: '1H', label: '1H', description: '1 Giờ' },
];

export default function GreenSmartOnePage() {
  const { theme } = useTheme();
  const { user, profile, isAdmin, loading: authLoading } = useAuth();

  // Kiểm tra hạn sử dụng GreenSmartOne
  const expiresAt = profile?.greensmartone_expires_at;
  const isExpired = useMemo(() => {
    if (authLoading) return false;
    if (isAdmin) return false;
    if (!user) return true;
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() < Date.now();
  }, [authLoading, isAdmin, user, expiresAt]);

  // Chuyển đổi thủ công độ nhạy Sens & Chế độ Tự Động
  const handleSelectSens = (sens) => {
    setConfig(prev => ({ ...prev, smartAdaptive: false, sensManual: sens }));
    toast.success(`Đã chuyển sang Sens ${sens.toFixed(1)}`);
  };
  const handleToggleAutoMode = () => {
    setConfig(prev => ({ ...prev, smartAdaptive: true }));
    toast.success('Đã kích hoạt chế độ Tự Động (SmartAdaptive AI)');
  };

  // ── Trạng thái loại tài sản: 'stock' hoặc 'crypto' ──
  const [assetMode, setAssetMode] = useState('stock'); // 'stock' | 'crypto'

  // ── Symbol & timeframe ──
  const [symbol, setSymbol] = useState('FPT');
  const [timeframe, setTimeframe] = useState('1D');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'tv_widget'

  // ── Giá ticker crypto thời gian thực (badge header) ──
  const [cryptoTicker, setCryptoTicker] = useState(null);
  const cryptoTickerRef = useRef(null);

  // Trạng thái tải dữ liệu nến
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [crosshairInfo, setCrosshairInfo] = useState(null);

  // Cấu hình chỉ báo & Động cơ SmartAdaptive
  const [config, setConfig] = useState({
    licenseKey: 'PSOL-20261231-9',
    enSignals: true,
    sensManual: 2.0,
    smartAdaptive: true,
    learnRate: 0.90,
    evalBars: 10,
    recalibBars: 10,
    warmupBars: 20,
    enrev: true,
    enrevser: true,
    RSI_Period: 14,
    SF: 5,
    KQE: 4.238,
    ThreshHold: 10,
    ensr: true,
    ensra: true,
    enCloud: true,
    volBands: true,
    mal: false,
    mals: 80,
    enLong: true,
    enShort: true,
    waitBars: 2,
    validBars: 10,
    useSL: true,
  });

  // Bật/tắt các lớp hiển thị
  const [toggles, setToggles] = useState({
    supertrend: true,
    diamonds: true,
    cloud: true,
    bands: true,
    sr: true,
    qqe: true,
    strategy: true,
    ma: false,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const accepted =
        sessionStorage.getItem('gs_disclaimer_session_accepted') === 'true' ||
        localStorage.getItem('gs_disclaimer_session_accepted') === 'true';
      return !accepted;
    }
    return true;
  });

  const isLicValid = useMemo(
    () => !isExpired && validateLicense(config.licenseKey),
    [isExpired, config.licenseKey]
  );

  // ── Khi assetMode đổi: reset về symbol mặc định và timeframe phù hợp ──
  useEffect(() => {
    if (assetMode === 'crypto') {
      setSymbol('BTCUSD');
      setTimeframe('D1');
    } else {
      setSymbol('FPT');
      setTimeframe('1D');
    }
    setSearchOpen(false);
    setSearchQuery('');
  }, [assetMode]);

  // ── Tải dữ liệu nến (hỗ trợ cả crypto và chứng khoán) ──
  const loadCandles = async (targetSymbol, tf) => {
    setLoading(true);
    try {
      let data;
      if (isCryptoSymbol(targetSymbol)) {
        data = await fetchCryptoCandles(targetSymbol, tf);
      } else {
        // Map timeframe chứng khoán (1D → 1D, 1H → 1H)
        const vnTf = tf === 'D1' ? '1D' : tf === 'H1' ? '1H' : tf;
        const days = vnTf === '1D' ? 365 : 120;
        data = await fetchStockCandles(targetSymbol, vnTf, days);
      }
      setBars(data);
      setLastRefreshed(new Date());
    } catch (err) {
      toast.error(`Không thể tải dữ liệu nến ${targetSymbol}. Vui lòng thử lại!`);
      console.error('loadCandles error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandles(symbol, timeframe);
  }, [symbol, timeframe]);

  // ── Polling realtime: crypto mỗi 3s, chứng khoán mỗi 8s ──
  useEffect(() => {
    let timer = null;
    let isFetching = false;

    const isCrypto = isCryptoSymbol(symbol);
    const pollMs = isCrypto ? 3000 : 8000;

    const pollRealtime = async () => {
      if (isFetching || !symbol) return;
      isFetching = true;
      try {
        let data;
        if (isCrypto) {
          data = await fetchCryptoCandles(symbol, timeframe);
        } else {
          const vnTf = timeframe === 'D1' ? '1D' : timeframe === 'H1' ? '1H' : timeframe;
          data = await fetchStockCandles(symbol, vnTf, vnTf === '1D' ? 365 : 120);
        }
        if (data && data.length > 0) {
          setBars(prev => {
            if (!prev || prev.length === 0) return data;
            const lastOld = prev[prev.length - 1];
            const lastNew = data[data.length - 1];
            if (
              prev.length === data.length &&
              lastOld.close === lastNew.close &&
              lastOld.volume === lastNew.volume
            ) {
              return prev;
            }
            return data;
          });
          setLastRefreshed(new Date());
        }
      } catch (_) {
      } finally {
        isFetching = false;
      }
    };

    timer = setInterval(pollRealtime, pollMs);
    return () => { if (timer) clearInterval(timer); };
  }, [symbol, timeframe]);

  // ── WebSocket streaming realtime cho Crypto (Zero Delay trực tiếp từ Binance) ──
  useEffect(() => {
    if (!isCryptoSymbol(symbol)) return;

    const unsubscribe = subscribeCryptoKlineWS(symbol, timeframe, (candle) => {
      setBars(prev => {
        if (!prev || prev.length === 0) return [candle];
        const last = prev[prev.length - 1];

        // Nếu cùng mốc nến, cập nhật nến hiện tại
        if (last.time === candle.time) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            high: Math.max(last.high, candle.high),
            low: Math.min(last.low, candle.low),
            close: candle.close,
            volume: candle.volume,
          };
          return updated;
        }

        // Nếu cây nến mới bắt đầu
        if (candle.timeUnix > last.timeUnix || candle.time > last.time) {
          return [...prev, candle];
        }

        return prev;
      });

      // Cập nhật giá realtime ngay lập tức cho badge header
      setCryptoTicker(prev => ({
        ...(prev || {}),
        lastPrice: candle.close,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [symbol, timeframe]);

  // ── Chuyển đổi chế độ tài sản (Chứng khoán / Crypto) ──
  const handleSelectAssetMode = (mode) => {
    setAssetMode(mode);
    if (mode === 'crypto') {
      setSymbol('XAUUSD');
      setTimeframe('M5'); // Mặc định M5 cho Vàng/Crypto khớp trực tiếp với TradingView 5m
    } else {
      setSymbol('FPT');
      setTimeframe('1D');
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  // ── Polling ticker giá crypto (badge header) mỗi 2 giây ──
  useEffect(() => {
    if (assetMode !== 'crypto' || !isCryptoSymbol(symbol)) {
      setCryptoTicker(null);
      return;
    }
    let alive = true;

    const fetchTicker = async () => {
      const ticker = await fetchCryptoPriceTicker(symbol);
      if (alive && ticker) setCryptoTicker(ticker);
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 2000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [symbol, assetMode]);

  // ── Tính toán chỉ báo Pine Script ──
  const indicatorResults = useMemo(() => {
    if (!bars || bars.length === 0) return {};
    return computeGreenSmartOne(bars, config);
  }, [bars, config]);

  const handleToggleIndicator = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Giá mới nhất ──
  const latestBar = bars.length > 0 ? bars[bars.length - 1] : null;
  const prevBar = bars.length > 1 ? bars[bars.length - 2] : null;
  const priceChange = latestBar && prevBar ? latestBar.close - prevBar.close : 0;
  const priceChangePct =
    latestBar && prevBar && prevBar.close > 0 ? (priceChange / prevBar.close) * 100 : 0;
  const isUp = priceChange >= 0;

  // ── Precision cho crypto/forex ──
  const currentCryptoAsset = CRYPTO_ASSETS.find(a => a.symbol === symbol);
  const pricePrecision = currentCryptoAsset?.precision ?? 2;

  // ── Lọc gợi ý tìm kiếm ──
  const searchResults = useMemo(() => {
    if (assetMode === 'crypto') {
      if (!searchQuery.trim()) return CRYPTO_ASSETS;
      const q = searchQuery.toUpperCase().trim();
      return CRYPTO_ASSETS.filter(
        a => a.symbol.includes(q) || a.name.toUpperCase().includes(q)
      );
    }
    if (!searchQuery.trim()) return POPULAR_STOCKS.slice(0, 10);
    const q = searchQuery.toUpperCase().trim();
    const matched = ALL_LISTED_STOCKS.filter(code => code.includes(q)).slice(0, 15);
    return matched.map(code => {
      const pop = POPULAR_STOCKS.find(p => p.symbol === code);
      return pop || { symbol: code, name: `Cổ phiếu ${code}`, exchange: 'HOSE' };
    });
  }, [searchQuery, assetMode]);

  // ── Danh sách timeframe phù hợp mode ──
  const availableTimeframes = assetMode === 'crypto' ? CRYPTO_TIMEFRAMES : VN_TIMEFRAMES;

  // ── Tên hiển thị cho TradingView Widget (crypto cần map sang format TV) ──
  const tvSymbol = useMemo(() => {
    if (!isCryptoSymbol(symbol)) return symbol;
    const map = {
      BTCUSD: 'BINANCE:BTCUSDT',
      ETHUSD: 'BINANCE:ETHUSDT',
      XRPUSD: 'BINANCE:XRPUSDT',
      SOLUSD: 'BINANCE:SOLUSDT',
      XAUUSD: 'OANDA:XAUUSD',
    };
    return map[symbol] || `BINANCE:${symbol}`;
  }, [symbol]);

  return (
    <div className="min-h-screen pb-16 bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-4 py-2 text-xs font-semibold shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-white/20">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span>
              <strong>GreenSmartOne SmartAdaptive Engine</strong>: Đã tích hợp chỉ báo Pine Script v5 độc quyền lên biểu đồ thời gian thực.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
              AI 7-SENS ADAPTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">

        {/* ══ Chuyển đổi chế độ tài sản: Chứng khoán VN / Tài sản số ══ */}
        <div className="flex items-center gap-2 p-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] w-fit shadow-md">
          <button
            onClick={() => handleSelectAssetMode('stock')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              assetMode === 'stock'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Chứng khoán VN</span>
          </button>
          <button
            onClick={() => handleSelectAssetMode('crypto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              assetMode === 'crypto'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Tài sản số / Vàng</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-extrabold">LIVE</span>
          </button>
        </div>

        {/* ══ Crypto Asset Tiles (chỉ hiện khi mode crypto) ══ */}
        {assetMode === 'crypto' && (
          <div className="grid grid-cols-5 gap-2">
            {CRYPTO_ASSETS.map(asset => (
              <button
                key={asset.symbol}
                onClick={() => {
                  setSymbol(asset.symbol);
                  if (timeframe === 'D1' || timeframe === '1D') setTimeframe('M5');
                }}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  symbol === asset.symbol
                    ? 'bg-gradient-to-b from-orange-500/20 to-amber-500/10 border-orange-500/50 text-orange-400 shadow-lg'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-orange-500/30 hover:text-orange-400'
                }`}
              >
                <span className="text-lg leading-none">{asset.icon}</span>
                <span className="font-mono text-[10px] font-extrabold">{asset.symbol}</span>
                <span className="text-[9px] text-[var(--text-muted)] truncate max-w-full">{asset.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ══ Header Toolbar ══ */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:p-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Cụm Bên Trái */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Ticker Search Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(o => !o)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-sm font-extrabold text-[var(--text-main)] transition-all"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className={`text-base tracking-wider font-mono ${assetMode === 'crypto' ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {symbol}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>

                {searchOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 card p-2 z-50 shadow-2xl animate-fade-in">
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={assetMode === 'crypto' ? 'Tìm tài sản số...' : 'Tìm mã cổ phiếu...'}
                        autoFocus
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs font-mono focus:outline-none focus:border-primary-400 text-[var(--text-main)]"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                      {searchResults.map(item => (
                        <button
                          key={item.symbol}
                          onClick={() => {
                            setSymbol(item.symbol);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                            symbol === item.symbol
                              ? 'bg-primary-500/15 text-primary-400 font-bold'
                              : 'hover:bg-[var(--bg-subtle)] text-[var(--text-main)]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {assetMode === 'crypto' && <span>{item.icon}</span>}
                            <span className="font-mono font-bold">{item.symbol}</span>
                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <span className="text-[9px] px-1.5 rounded bg-white/5 text-[var(--text-muted)]">
                            {item.category === 'metal' ? 'METAL' : item.category === 'crypto' ? 'CRYPTO' : item.exchange}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick picks — chứng khoán hoặc crypto */}
              {assetMode === 'stock' ? (
                <div className="hidden sm:flex items-center gap-1">
                  {['FPT', 'HPG', 'SSI', 'VCB', 'MWG', 'TCB'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSymbol(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                        symbol === s
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1">
                  {CRYPTO_ASSETS.map(a => (
                    <button
                      key={a.symbol}
                      onClick={() => setSymbol(a.symbol)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                        symbol === a.symbol
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      {a.symbol.replace('USD', '')}
                    </button>
                  ))}
                </div>
              )}

              {/* Khung thời gian */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                {availableTimeframes.map(tf => (
                  <button
                    key={tf.key}
                    onClick={() => setTimeframe(tf.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      timeframe === tf.key
                        ? assetMode === 'crypto'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-primary-500 text-white shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                    title={tf.description}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Báo giá thời gian thực */}
              {latestBar && (
                <div className="flex items-center gap-3 pl-2 sm:border-l border-[var(--border-color)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      {assetMode === 'crypto' ? 'Giá Live (USD)' : 'Giá Đóng Cửa'}
                    </span>
                    <span className="text-base font-extrabold font-mono text-[var(--text-main)]">
                      {assetMode === 'crypto'
                        ? (cryptoTicker?.lastPrice ?? latestBar.close).toLocaleString('en-US', { minimumFractionDigits: pricePrecision, maximumFractionDigits: pricePrecision })
                        : latestBar.close.toFixed(2)
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Biến Động</span>
                    <span className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                      assetMode === 'crypto'
                        ? (cryptoTicker?.changePct ?? priceChangePct) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        : isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(assetMode === 'crypto' ? (cryptoTicker?.changePct ?? priceChangePct) : priceChangePct) >= 0
                        ? <TrendingUp className="w-3.5 h-3.5" />
                        : <TrendingDown className="w-3.5 h-3.5" />
                      }
                      {assetMode === 'crypto'
                        ? `${(cryptoTicker?.changePct ?? priceChangePct).toFixed(2)}%`
                        : `${isUp ? '+' : ''}${priceChange.toFixed(2)} (${isUp ? '+' : ''}${priceChangePct.toFixed(2)}%)`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cụm Bên Phải */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Badge Realtime */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                  assetMode === 'crypto'
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
                title={assetMode === 'crypto' ? 'Dữ liệu Binance realtime — cập nhật mỗi 3 giây' : 'Dữ liệu nến VNDirect — cập nhật mỗi 8 giây'}
              >
                <span className={`w-2 h-2 rounded-full animate-ping inline-block ${assetMode === 'crypto' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                <span className="hidden sm:inline">
                  {assetMode === 'crypto' ? 'BINANCE LIVE' : 'LIVE REALTIME'}
                </span>
              </div>

              {/* Chuyển Chế Độ Xem */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs">
                <button
                  onClick={() => setViewMode('canvas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    viewMode === 'canvas'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>GreenSmartOne</span>
                </button>
                <button
                  onClick={() => setViewMode('tv_widget')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    viewMode === 'tv_widget'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>TradingView</span>
                </button>
              </div>

              {/* Cài Đặt */}
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-primary-400" />
                <span className="hidden sm:inline">Cài Đặt</span>
              </button>

              {/* Badge License */}
              <div
                onClick={() => setModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  isLicValid
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                }`}
              >
                {isLicValid ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span className="hidden md:inline">{isLicValid ? 'License PRO' : 'License Khóa'}</span>
              </div>

              {/* Làm Mới */}
              <button
                onClick={() => loadCandles(symbol, timeframe)}
                disabled={loading}
                className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all disabled:opacity-50"
                title="Tải lại dữ liệu"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ══ Crypto info strip (chỉ hiện khi crypto mode) ══ */}
        {assetMode === 'crypto' && cryptoTicker && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2 flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="font-bold text-orange-400 text-sm">{symbol}</span>
            <span className="text-[var(--text-muted)]">24h Cao: <strong className="text-emerald-400">{cryptoTicker.high.toLocaleString('en-US', { maximumFractionDigits: pricePrecision })}</strong></span>
            <span className="text-[var(--text-muted)]">24h Thấp: <strong className="text-rose-400">{cryptoTicker.low.toLocaleString('en-US', { maximumFractionDigits: pricePrecision })}</strong></span>
            <span className="text-[var(--text-muted)]">KL 24h: <strong className="text-cyan-400">{cryptoTicker.volume.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong></span>
            <span className="text-[var(--text-muted)]">Nguồn: <strong className="text-orange-400">Binance Spot {symbol === 'XAUUSD' ? '(PAX Gold London 1:1 Spot)' : ''}</strong></span>
            <span className="ml-auto text-[9px] text-[var(--text-muted)] opacity-60">Cập nhật mỗi 2 giây · Không delay</span>
          </div>
        )}

        {/* ══ Khung Biểu Đồ Chính ══ */}
        <div className="relative rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-2xl min-h-[580px]">
          {/* Thanh điều hướng khung thời gian tích hợp trực tiếp trên đỉnh biểu đồ (Always visible) */}
          <div className="px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-card)]/95 flex flex-wrap items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-mono">
                <span className={`text-base font-extrabold tracking-wider ${assetMode === 'crypto' ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {symbol}
                </span>
                {latestBar && (
                  <span className="text-sm font-bold text-[var(--text-main)] px-2.5 py-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                    {(cryptoTicker?.lastPrice ?? latestBar.close).toLocaleString('en-US', { minimumFractionDigits: pricePrecision, maximumFractionDigits: pricePrecision })}
                  </span>
                )}
              </div>

              {/* Khung thời gian M1 - D1 hiển thị cố định trên biểu đồ */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                {availableTimeframes.map(tf => (
                  <button
                    key={tf.key}
                    onClick={() => setTimeframe(tf.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      timeframe === tf.key
                        ? assetMode === 'crypto'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-emerald-500 text-white shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
                    }`}
                    title={tf.description}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {assetMode === 'crypto' ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  BINANCE REALTIME ({timeframe})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  HOSE/HNX ({timeframe})
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--bg-card)]/80 backdrop-blur-sm">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-primary-400 animate-pulse">
                  {assetMode === 'crypto'
                    ? `Đang tải nến ${symbol} [${timeframe}] từ Binance...`
                    : `Đang nạp dữ liệu nến chuẩn xác cho ${symbol}...`
                  }
                </p>
              </div>
            </div>
          )}

          {viewMode === 'canvas' ? (
            <>
              <SmartAdaptiveHUD
                candSensTable={indicatorResults.candSensTable || []}
                finalEffSens={indicatorResults.finalEffSens || config.sensManual}
                bestSens={indicatorResults.bestSens || 1.6}
                recalibCnt={indicatorResults.recalibCnt || 0}
                isSmartAdaptive={config.smartAdaptive}
                isLicActive={isLicValid}
                currentSens={config.sensManual}
                onSelectSens={handleSelectSens}
                onToggleAutoMode={handleToggleAutoMode}
              />
              <div className={`h-[600px] w-full transition-all duration-300 ${isExpired ? 'filter blur-md pointer-events-none select-none' : ''}`}>
                <GreenSmartOneChart
                  bars={bars}
                  symbol={symbol}
                  timeframe={timeframe}
                  indicators={indicatorResults}
                  theme={theme}
                  toggles={toggles}
                  onCrosshairMove={setCrosshairInfo}
                />
              </div>

              {/* Thanh thông tin nến dưới biểu đồ */}
              <div className="px-4 py-2 bg-[var(--bg-subtle)]/70 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <div className="flex items-center gap-3">
                  <span>MÃ: <strong className={assetMode === 'crypto' ? 'text-orange-400' : 'text-emerald-400'}>{symbol}</strong></span>
                  {crosshairInfo?.candle ? (
                    <>
                      <span>Mở: <strong>{crosshairInfo.candle.open?.toFixed(pricePrecision)}</strong></span>
                      <span>Cao: <strong>{crosshairInfo.candle.high?.toFixed(pricePrecision)}</strong></span>
                      <span>Thấp: <strong>{crosshairInfo.candle.low?.toFixed(pricePrecision)}</strong></span>
                      <span>Đóng: <strong className={crosshairInfo.candle.close >= crosshairInfo.candle.open ? 'text-emerald-400' : 'text-rose-400'}>{crosshairInfo.candle.close?.toFixed(pricePrecision)}</strong></span>
                      <span>Thời Gian: <strong>{crosshairInfo.time}</strong></span>
                    </>
                  ) : latestBar ? (
                    <>
                      <span>Mở: <strong>{latestBar.open.toFixed(pricePrecision)}</strong></span>
                      <span>Cao: <strong>{latestBar.high.toFixed(pricePrecision)}</strong></span>
                      <span>Thấp: <strong>{latestBar.low.toFixed(pricePrecision)}</strong></span>
                      <span>Đóng: <strong className={latestBar.close >= latestBar.open ? 'text-emerald-400' : 'text-rose-400'}>{latestBar.close.toFixed(pricePrecision)}</strong></span>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-400 font-sans">⚡ Sens = {indicatorResults.finalEffSens?.toFixed(2)}</span>
                  {assetMode === 'crypto' && (
                    <span className="text-[10px] text-orange-400 font-sans">🔸 Binance {timeframe}</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-[620px] w-full p-2">
              <TradingViewClassicWidget symbol={tvSymbol} theme={theme} isCrypto={assetMode === 'crypto'} />
            </div>
          )}
        </div>

        {/* ══ Khối Giới Thiệu ══ */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              Nguyên Lý Hoạt Động Của Hệ Thống GreenSmartOne
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--text-muted)]">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1.5">
                <Zap className="w-4 h-4" />
                <span>1. Động Cơ SmartAdaptive AI</span>
              </div>
              <p className="leading-relaxed">
                Hệ thống chạy song song 7 mức Sensitivity (1.3, 1.6, 2.0, 2.4, 2.8, 3.2, 3.8). Cứ mỗi 10 nến, thuật toán tự động chấm điểm theo tỷ lệ thắng thực tế và tự chọn mức tối ưu nhất để đổi màu nến.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2 font-bold text-cyan-400 mb-1.5">
                <Activity className="w-4 h-4" />
                <span>2. Tín Hiệu Kim Cương (💎) & QQE (❖)</span>
              </div>
              <p className="leading-relaxed">
                Kim Cương mua/bán được tính toán dựa trên sự giao cắt mây Ichimoku nâng cao và chỉ xuất hiện khi SuperTrend Adaptive đồng thuận. Kèm theo đó là nhãn ❖ báo hiệu điểm cạn kiệt đảo chiều nhanh của QQE.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-1.5">
                <Layers className="w-4 h-4" />
                <span>3. Quản Lý Vốn & Thoát Lệnh Kỷ Luật</span>
              </div>
              <p className="leading-relaxed">
                Chiến lược tự động thiết lập mức Cắt Lỗ (Stop Loss) ngay tại đáy hoặc đỉnh của nến Kim Cương, và chủ động thoát lệnh khi nến đổi màu (ColorFlip), giúp tối ưu lợi nhuận và hạn chế rủi ro.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IndicatorSettingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        config={config}
        onSaveConfig={setConfig}
        toggles={toggles}
        onToggleIndicator={handleToggleIndicator}
        expiresAt={isAdmin ? '2099-12-31T23:59:59.000Z' : expiresAt}
      />
      <DisclaimerModal
        isOpen={disclaimerOpen}
        onAccepted={() => {
          setDisclaimerOpen(false);
          try {
            sessionStorage.setItem('gs_disclaimer_session_accepted', 'true');
            localStorage.setItem('gs_disclaimer_session_accepted', 'true');
          } catch (_) {}
          setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
        }}
        user={user}
        profile={profile}
      />
      <ExpiredLicenseModal
        isOpen={isExpired}
        user={user}
        expiresAt={expiresAt}
      />
    </div>
  );
}
