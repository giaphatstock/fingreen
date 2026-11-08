import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap, Search, RefreshCw, Sliders, ShieldCheck, ShieldAlert,
  TrendingUp, TrendingDown, Layers, Sparkles, BarChart2,
  Calendar, Info, Check, ChevronDown, Activity, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import GreenSmartOneChart from '../components/chart/GreenSmartOneChart';
import SmartAdaptiveHUD from '../components/chart/SmartAdaptiveHUD';
import BacktestPerformancePanel from '../components/chart/BacktestPerformancePanel';
import IndicatorSettingsModal from '../components/chart/IndicatorSettingsModal';
import ExpiredLicenseModal from '../components/chart/ExpiredLicenseModal';
import TradingViewClassicWidget from '../components/chart/TradingViewClassicWidget';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchStockCandles, POPULAR_STOCKS } from '../services/stockPriceService';
import { computeGreenSmartOne, validateLicense } from '../services/greenSmartOneEngine';
import ALL_LISTED_STOCKS from '../data/allStockCodes.json';

export default function GreenSmartOnePage() {
  const { theme } = useTheme();
  const { user, profile, isAdmin } = useAuth();

  // Kiểm tra hạn sử dụng GreenSmartOne
  const expiresAt = profile?.greensmartone_expires_at;
  const isExpired = useMemo(() => {
    if (isAdmin) return false; // Admin luôn có quyền vĩnh viễn
    if (!user) return true; // Chưa đăng nhập
    if (!expiresAt) return true; // Chưa được kích hoạt
    return new Date(expiresAt).getTime() < Date.now();
  }, [isAdmin, user, expiresAt]);

  // Trạng thái chọn mã & khung thời gian
  const [symbol, setSymbol] = useState('FPT');
  const [timeframe, setTimeframe] = useState('1D'); // '1D' | '1H'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'tv_widget'

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

  const isLicValid = useMemo(() => (!isExpired && validateLicense(config.licenseKey)), [isExpired, config.licenseKey]);

  // Tải dữ liệu nến từ Entrade/DNSE (toàn bộ lịch sử 1500 ngày cho 1D)
  const loadCandles = async (targetSymbol, tf) => {
    setLoading(true);
    try {
      const data = await fetchStockCandles(targetSymbol, tf, tf === '1D' ? 1500 : 120);
      setBars(data);
      setLastRefreshed(new Date());
    } catch (err) {
      toast.error('Không thể tải dữ liệu nến. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandles(symbol, timeframe);
  }, [symbol, timeframe]);

  // Tính toán toán học toàn bộ chỉ báo Pine Script
  const indicatorResults = useMemo(() => {
    if (!bars || bars.length === 0) return {};
    return computeGreenSmartOne(bars, config);
  }, [bars, config]);

  const handleToggleIndicator = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Thông tin báo giá phiên mới nhất
  const latestBar = bars.length > 0 ? bars[bars.length - 1] : null;
  const prevBar = bars.length > 1 ? bars[bars.length - 2] : null;
  const priceChange = latestBar && prevBar ? latestBar.close - prevBar.close : 0;
  const priceChangePct = latestBar && prevBar && prevBar.close > 0 ? (priceChange / prevBar.close) * 100 : 0;
  const isUp = priceChange >= 0;

  // Lọc gợi ý tìm kiếm cổ phiếu
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_STOCKS.slice(0, 10);
    const q = searchQuery.toUpperCase().trim();
    const matched = ALL_LISTED_STOCKS.filter(code => code.includes(q)).slice(0, 15);
    return matched.map(code => {
      const pop = POPULAR_STOCKS.find(p => p.symbol === code);
      return pop || { symbol: code, name: `Cổ phiếu ${code}`, exchange: 'HOSE' };
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-16 bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200">
      {/* Top Banner Thông Báo */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-4 py-2 text-xs font-semibold shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-white/20">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span>
              <strong>GreenSmartOne SmartAdaptive Engine</strong>: Đã tích hợp chỉ báo Pine Script v5 độc quyền của bạn lên biểu đồ thời gian thực.
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
        {/* Header Toolbar & Bộ Chọn Cổ Phiếu */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:p-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Cụm Bên Trái: Ticker Selector, Giá & Thay Đổi */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Ticker Search Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(o => !o)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-sm font-extrabold text-[var(--text-main)] transition-all"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-base tracking-wider text-emerald-400 font-mono">{symbol}</span>
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
                        placeholder="Tìm mã cổ phiếu..."
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
                            <span className="font-mono font-bold">{item.symbol}</span>
                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-[var(--text-muted)]">{item.exchange}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ticker Nổi Bật Nhanh */}
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

              {/* Khung Thời Gian (Timeframe) */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                <button
                  onClick={() => setTimeframe('1D')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    timeframe === '1D'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  1 Ngày (1D)
                </button>
                <button
                  onClick={() => setTimeframe('1H')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    timeframe === '1H'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  1 Giờ (1H)
                </button>
              </div>

              {/* Báo Giá Thời Gian Thực */}
              {latestBar && (
                <div className="flex items-center gap-3 pl-2 sm:border-l border-[var(--border-color)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Giá Đóng Cửa</span>
                    <span className="text-base font-extrabold font-mono text-[var(--text-main)]">
                      {latestBar.close.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Biến Động</span>
                    <span className={`text-xs font-bold font-mono flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isUp ? `+${priceChange.toFixed(2)}` : priceChange.toFixed(2)} ({isUp ? `+${priceChangePct.toFixed(2)}%` : `${priceChangePct.toFixed(2)}%`})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cụm Bên Phải: Chế Độ Xem, Nút Cài Đặt, License, Làm Mới */}
            <div className="flex flex-wrap items-center gap-2">
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
                  <span>GreenSmartOne Engine</span>
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
                  <span>TradingView Web</span>
                </button>
              </div>

              {/* Nút Cài Đặt Chỉ Báo */}
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] transition-colors"
                title="Cấu hình chỉ báo & License"
              >
                <Sliders className="w-3.5 h-3.5 text-primary-400" />
                <span className="hidden sm:inline">Cài Đặt</span>
              </button>

              {/* Badge Bản Quyền */}
              <div
                onClick={() => setModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  isLicValid
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                }`}
                title="Bấm để kiểm tra / đổi mã bản quyền"
              >
                {isLicValid ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span className="hidden md:inline">{isLicValid ? 'License PRO' : 'License Khóa'}</span>
              </div>

              {/* Nút Làm Mới */}
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

        {/* Khung Biểu Đồ Chính */}
        <div className="relative rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-2xl min-h-[580px]">
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--bg-card)]/80 backdrop-blur-sm">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-primary-400 animate-pulse">
                  Đang nạp dữ liệu nến chuẩn xác cho {symbol}...
                </p>
              </div>
            </div>
          )}

          {viewMode === 'canvas' ? (
            <>
              {/* Floating HUD SmartAdaptive Engine (Bảng 7 Mức Sens) */}
              <SmartAdaptiveHUD
                candSensTable={indicatorResults.candSensTable || []}
                finalEffSens={indicatorResults.finalEffSens || 2.0}
                bestSens={indicatorResults.bestSens || 1.6}
                recalibCnt={indicatorResults.recalibCnt || 0}
                isSmartAdaptive={config.smartAdaptive}
                isLicActive={isLicValid}
              />

              {/* Canvas Chart */}
              <div className={`h-[600px] w-full transition-all duration-300 ${isExpired ? 'filter blur-md pointer-events-none select-none' : ''}`}>
                <GreenSmartOneChart
                  bars={bars}
                  symbol={symbol}
                  indicators={indicatorResults}
                  theme={theme}
                  toggles={toggles}
                  onCrosshairMove={setCrosshairInfo}
                />
              </div>

              {/* Thanh Thông Tin Nến Dưới Đáy Biểu Đồ Khi Rê Chuột (Crosshair Status) */}
              <div className="px-4 py-2 bg-[var(--bg-subtle)]/70 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <div className="flex items-center gap-3">
                  <span>MÃ: <strong className="text-emerald-400">{symbol}</strong></span>
                  {crosshairInfo?.candle ? (
                    <>
                      <span>Mở: <strong>{crosshairInfo.candle.open?.toFixed(2)}</strong></span>
                      <span>Cao: <strong>{crosshairInfo.candle.high?.toFixed(2)}</strong></span>
                      <span>Thấp: <strong>{crosshairInfo.candle.low?.toFixed(2)}</strong></span>
                      <span>Đóng: <strong className={crosshairInfo.candle.close >= crosshairInfo.candle.open ? 'text-emerald-400' : 'text-rose-400'}>{crosshairInfo.candle.close?.toFixed(2)}</strong></span>
                      <span>Thời Gian: <strong>{crosshairInfo.time}</strong></span>
                    </>
                  ) : latestBar ? (
                    <>
                      <span>Mở: <strong>{latestBar.open.toFixed(2)}</strong></span>
                      <span>Cao: <strong>{latestBar.high.toFixed(2)}</strong></span>
                      <span>Thấp: <strong>{latestBar.low.toFixed(2)}</strong></span>
                      <span>Đóng: <strong className={latestBar.close >= latestBar.open ? 'text-emerald-400' : 'text-rose-400'}>{latestBar.close.toFixed(2)}</strong></span>
                    </>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-400 font-sans">⚡ Đang dùng Sens = {indicatorResults.finalEffSens?.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[620px] w-full p-2">
              <TradingViewClassicWidget symbol={symbol} theme={theme} />
            </div>
          )}
        </div>

        {/* Khối Hiệu Suất Chiến Lược & Kiểm Thử Tự Động (Backtest Performance) */}
        <BacktestPerformancePanel
          stats={indicatorResults.stats || {}}
          trades={indicatorResults.trades || []}
          symbol={symbol}
        />

        {/* Khối Giới Thiệu Chuyên Sâu Về Chỉ Báo GreenSmartOne */}
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
                Hệ thống chạy song song 7 mức Sensitivity (1.3, 1.6, 2.0, 2.4, 2.8, 3.2, 3.8). Cứ mỗi 10 nến, thuật toán tự động chấm điểm theo tỷ lệ thắng thực tế và tự chọn mức tối ưu nhất để đổi màu nến (Vàng chanh = Tăng, Đỏ thắm = Giảm).
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
                Chiến lược tự động thiết lập mức Cắt Lỗ (Stop Loss) ngay tại đáy hoặc đỉnh của nến Kim Cương, và chủ động thoát lệnh khi nến đổi màu (ColorFlip), giúp tối ưu lợi nhuận và hạn chế tối đa rủi ro rút vốn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cài Đặt Tham Số & License */}
      <IndicatorSettingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        config={config}
        onSaveConfig={setConfig}
        toggles={toggles}
        onToggleIndicator={handleToggleIndicator}
        expiresAt={isAdmin ? '2099-12-31T23:59:59.000Z' : expiresAt}
      />

      {/* Modal Báo Hết Hạn / Yêu Cầu Kích Hoạt Bản Quyền */}
      <ExpiredLicenseModal
        isOpen={isExpired}
        user={user}
        expiresAt={expiresAt}
      />
    </div>
  );
}
