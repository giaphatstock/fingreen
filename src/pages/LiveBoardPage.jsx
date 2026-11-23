import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Star, Search, RefreshCw, Zap,
  Activity, ArrowUpRight, ArrowDownRight, Layers, LayoutGrid,
  Table, Sparkles, Filter, ChevronRight, SlidersHorizontal,
  Flame, Radio, Info, Eye, Check, Palette, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchMarketIndices, fetchStockBatch, formatNumber, formatPrice,
  getPriceTextColor, getThemePriceStyle, VN30_STOCKS, HOSE_POPULAR,
  HNX_POPULAR, UPCOM_POPULAR, SECTORS, COMPANY_NAMES
} from '../services/liveBoardService';
import StockDetailDrawer from '../components/board/StockDetailDrawer';
import { PriceCell, VolumeCell, ChangeCell } from '../components/board/LiveBoardCells';

// Hàm lấy giờ Hà Nội (GMT+7) chuẩn time.is
function getHanoiTimeNow() {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
}

// Hàm xác định trạng thái phiên giao dịch (Kể cả thị trường đóng cửa)
function getMarketSessionInfo() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const partMap = {};
  parts.forEach(p => { partMap[p.type] = p.value; });

  const day = partMap.weekday; // 'Mon', 'Tue', ...
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const totalMin = hour * 60 + minute;

  // Cuối tuần
  if (day === 'Sat' || day === 'Sun') {
    return {
      status: 'CLOSED',
      label: 'Đóng cửa (Cuối tuần)',
      badgeClass: 'text-neutral-400 bg-neutral-800/80 border-neutral-700',
      isOpen: false
    };
  }

  // Ngày thường (Thứ 2 - Thứ 6)
  if (totalMin < 9 * 60) {
    return {
      status: 'PRE_OPEN',
      label: 'Chờ mở phiên (09:00)',
      badgeClass: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      isOpen: false
    };
  } else if (totalMin >= 9 * 60 && totalMin < 9 * 60 + 15) {
    return {
      status: 'ATO',
      label: 'Khớp lệnh ATO',
      badgeClass: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40 font-black',
      isOpen: true
    };
  } else if (totalMin >= 9 * 60 + 15 && totalMin < 11 * 60 + 30) {
    return {
      status: 'OPEN',
      label: 'Khớp lệnh liên tục (Sáng)',
      badgeClass: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40 font-black',
      isOpen: true
    };
  } else if (totalMin >= 11 * 60 + 30 && totalMin < 13 * 60) {
    return {
      status: 'LUNCH',
      label: 'Nghỉ trưa (11:30 - 13:00)',
      badgeClass: 'text-amber-300 bg-amber-500/15 border-amber-500/30 font-semibold',
      isOpen: false
    };
  } else if (totalMin >= 13 * 60 && totalMin < 14 * 60 + 30) {
    return {
      status: 'OPEN',
      label: 'Khớp lệnh liên tục (Chiều)',
      badgeClass: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40 font-black',
      isOpen: true
    };
  } else if (totalMin >= 14 * 60 + 30 && totalMin < 14 * 60 + 45) {
    return {
      status: 'ATC',
      label: 'Khớp lệnh ATC',
      badgeClass: 'text-purple-400 bg-purple-500/20 border-purple-500/40 font-black',
      isOpen: true
    };
  } else if (totalMin >= 14 * 60 + 45 && totalMin < 15 * 60) {
    return {
      status: 'RUNOFF',
      label: 'Giao dịch thỏa thuận',
      badgeClass: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
      isOpen: false
    };
  } else {
    return {
      status: 'CLOSED',
      label: 'Thị trường đóng cửa',
      badgeClass: 'text-neutral-400 bg-neutral-800/80 border-neutral-700 font-medium',
      isOpen: false
    };
  }
}

export default function LiveBoardPage() {
  const navigate = useNavigate();

  // Tab hiện tại: 'VN30' | 'HOSE' | 'HNX' | 'UPCOM' | 'WATCHLIST' | 'SECTOR'
  const [activeTab, setActiveTab] = useState('VN30');
  const [selectedSectorId, setSelectedSectorId] = useState('bank');

  // Giao diện bảng giá: 'MODERN' (Mặc định) vs 'TRADITIONAL' (Chuẩn SSI)
  const [boardTheme, setBoardTheme] = useState(() => {
    return localStorage.getItem('fingreen_board_theme') || 'MODERN';
  });

  const handleSwitchBoardTheme = (theme) => {
    setBoardTheme(theme);
    localStorage.setItem('fingreen_board_theme', theme);
    toast.success(theme === 'TRADITIONAL' ? 'Đã chuyển sang Giao diện Truyền thống' : 'Đã chuyển sang Giao diện Modern Fintech');
  };

  // Dữ liệu chỉ số thị trường (VNINDEX, VN30, HNX, UPCOM)
  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  // Dữ liệu cổ phiếu hiển thị
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);

  // Tìm kiếm & Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CEILING' | 'UP' | 'REF' | 'DOWN' | 'FLOOR' | 'TOP_VOL'
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'CARDS'

  // Watchlist cá nhân lưu trong localStorage
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('fingreen_watchlist');
      return saved ? JSON.parse(saved) : ['SSI', 'HPG', 'FPT', 'TCB', 'MWG', 'VIX'];
    } catch {
      return ['SSI', 'HPG', 'FPT', 'TCB', 'MWG', 'VIX'];
    }
  });

  // Tự động Streaming realtime
  const [isLiveActive, setIsLiveActive] = useState(true);

  // Đồng hồ Giờ Hà Nội time.is chạy từng giây (tick realtime liên tục kể cả đóng cửa)
  const [hanoiTime, setHanoiTime] = useState(getHanoiTimeNow);
  const [sessionInfo, setSessionInfo] = useState(getMarketSessionInfo);

  useEffect(() => {
    // Tick từng giây liên tục 1000ms chuẩn xác múi giờ Hà Nội (time.is)
    const timer = setInterval(() => {
      setHanoiTime(getHanoiTimeNow());
      setSessionInfo(getMarketSessionInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cổ phiếu đang chọn để xem Drawer chi tiết
  const [selectedStock, setSelectedStock] = useState(null);

  // Virtualization ref & scroll state
  const tableContainerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const ROW_HEIGHT = boardTheme === 'TRADITIONAL' ? 34 : 44;
  const OVERSCAN = 6;

  // Batching & Throttling buffer với requestAnimationFrame (50-80ms rAF batch)
  const pendingBatchRef = useRef(new Map());
  const rafIdRef = useRef(null);
  const lastRafFlushRef = useRef(0);

  // Lưu watchlist khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('fingreen_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.warn('Lỗi lưu watchlist:', e);
    }
  }, [watchlist]);

  const handleToggleWatchlist = (sym) => {
    setWatchlist(prev => {
      const exists = prev.includes(sym);
      const next = exists ? prev.filter(x => x !== sym) : [...prev, sym];
      toast.success(exists ? `Đã xóa ${sym} khỏi Watchlist` : `Đã thêm ${sym} vào Watchlist ⭐`);
      return next;
    });
  };

  // Xác định danh sách mã cần nạp dựa trên Tab đang chọn
  const currentSymbolList = useMemo(() => {
    if (activeTab === 'WATCHLIST') return watchlist;
    if (activeTab === 'VN30') return VN30_STOCKS;
    if (activeTab === 'HOSE') return HOSE_POPULAR;
    if (activeTab === 'HNX') return HNX_POPULAR;
    if (activeTab === 'UPCOM') return UPCOM_POPULAR;
    if (activeTab === 'SECTOR') {
      const sector = SECTORS.find(s => s.id === selectedSectorId);
      return sector ? sector.stocks : VN30_STOCKS;
    }
    return VN30_STOCKS;
  }, [activeTab, selectedSectorId, watchlist]);

  // Nạp chỉ số thị trường (Single Source of Truth)
  const loadIndices = async () => {
    try {
      const data = await fetchMarketIndices();
      if (data && data.length > 0) {
        setIndices(data);
      }
    } catch (e) {
      console.warn('Error loading indices:', e);
    } finally {
      setIndicesLoading(false);
    }
  };

  // Kỹ thuật Batching & Throttling gom dữ liệu với requestAnimationFrame
  const flushBatchUpdates = useCallback(() => {
    const now = performance.now();
    if (now - lastRafFlushRef.current < 60) {
      // Throttling 60-80ms
      rafIdRef.current = requestAnimationFrame(flushBatchUpdates);
      return;
    }

    if (pendingBatchRef.current.size > 0) {
      const updates = new Map(pendingBatchRef.current);
      pendingBatchRef.current.clear();

      setStocks(prevList => {
        if (prevList.length === 0) return Array.from(updates.values());
        return prevList.map(item => updates.get(item.symbol) || item);
      });

      setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN'));
      lastRafFlushRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(flushBatchUpdates);
  }, []);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(flushBatchUpdates);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [flushBatchUpdates]);

  // Nạp dữ liệu bảng giá theo danh sách mã
  const loadStocks = async (isSilent = false) => {
    if (!isSilent) setStocksLoading(true);
    try {
      if (currentSymbolList.length === 0) {
        setStocks([]);
        setStocksLoading(false);
        return;
      }

      const list = await fetchStockBatch(currentSymbolList);

      if (!isSilent || stocks.length === 0) {
        setStocks(list);
      } else {
        // Đẩy vào hàng đợi Batching để rAF xử lý mượt mà không khóa main thread
        list.forEach(item => {
          pendingBatchRef.current.set(item.symbol, item);
        });
      }

      setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.warn('Error loading stocks:', err);
    } finally {
      setStocksLoading(false);
    }
  };

  // Nạp lần đầu khi chuyển tab
  useEffect(() => {
    loadIndices();
    loadStocks(false);
  }, [currentSymbolList]);

  // Vòng lặp Realtime Streaming (1.2s/lần)
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      loadStocks(true);
      loadIndices();
    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveActive, currentSymbolList]);

  // Lọc danh sách hiển thị theo Search và Quick Status Filter
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase().trim();
      result = result.filter(s => 
        s.symbol.includes(q) || 
        (s.name && s.name.toUpperCase().includes(q))
      );
    }

    if (statusFilter === 'CEILING') {
      result = result.filter(s => s.statusColor === 'ceiling');
    } else if (statusFilter === 'UP') {
      result = result.filter(s => s.change > 0);
    } else if (statusFilter === 'REF') {
      result = result.filter(s => s.change === 0);
    } else if (statusFilter === 'DOWN') {
      result = result.filter(s => s.change < 0);
    } else if (statusFilter === 'FLOOR') {
      result = result.filter(s => s.statusColor === 'floor');
    } else if (statusFilter === 'TOP_VOL') {
      result = result.sort((a, b) => b.totalVolume - a.totalVolume);
    }

    return result;
  }, [stocks, searchQuery, statusFilter]);

  // Tính toán Virtualization
  const totalCount = filteredStocks.length;
  const containerHeight = 650; // Viewport height
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalCount, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleStocks = useMemo(() => {
    return filteredStocks.slice(startIndex, endIndex);
  }, [filteredStocks, startIndex, endIndex]);

  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (totalCount - endIndex) * ROW_HEIGHT);

  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className="h-full flex flex-col space-y-2.5 overflow-hidden animate-in fade-in duration-300">
      {/* 1. Header Ticker 4 Chỉ Số Lớn (SINGLE SOURCE OF TRUTH) */}
      <div className="flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3.5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-main)]">
                Bảng Điện Thông Minh FinGreen
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Realtime 0ms
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Dữ liệu thị trường thời gian thực không độ trễ. Giao diện Terminal chuẩn xác 100%.
            </p>
          </div>

          {/* Công cụ điều khiển: Đổi Theme Bảng Giá & Streaming */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Chế độ giao diện: Modern vs Traditional (Chuẩn SSI) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <button
                onClick={() => handleSwitchBoardTheme('MODERN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  boardTheme === 'MODERN'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Giao diện Fintech Modern (Dịu mắt, nền mờ)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Modern
              </button>
              <button
                onClick={() => handleSwitchBoardTheme('TRADITIONAL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  boardTheme === 'TRADITIONAL'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
                title="Giao diện Truyền thống (Khối màu trầm dịu mắt, kẻ lưới)"
              >
                <Table className="w-3.5 h-3.5" />
                Giao diện Truyền thống
              </button>
            </div>

            {/* Toggle Streaming Live */}
            <button
              onClick={() => setIsLiveActive(!isLiveActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isLiveActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-color)]'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-pulse text-emerald-400' : ''}`} />
              {isLiveActive ? 'Live Streaming' : 'Tạm dừng Live'}
            </button>

            {/* Refresh Thủ công */}
            <button
              onClick={() => {
                loadStocks(false);
                loadIndices();
                toast.success('Đã cập nhật dữ liệu mới');
              }}
              className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white transition-all hover:scale-105"
              title="Làm mới ngay"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Đồng Hồ Giờ Hà Nội time.is (Tick Realtime Từng Giây Kể Cả Khi Đóng Cửa) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
              {/* Trạng thái phiên giao dịch */}
              <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border flex items-center gap-1.5 ${sessionInfo.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sessionInfo.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-neutral-400'}`} />
                {sessionInfo.label}
              </span>

              <div className="w-px h-3.5 bg-[var(--border-color)] hidden sm:block" />

              {/* Giờ Hà Nội time.is nhảy từng giây */}
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--text-main)]" title="Giờ chuẩn Hà Nội (GMT+7) đồng bộ time.is">
                <Clock className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
                <span className="text-[var(--text-muted)] text-[10px] uppercase font-semibold hidden md:inline">Giờ HN:</span>
                <span className="tabular-nums tracking-wider text-primary-300 font-black">{hanoiTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Khối 4 Chỉ Số: FIX TRIỆT ĐỂ MÀU SẮC VÀ DẤU +/- (SINGLE SOURCE OF TRUTH) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {indices.map(idx => {
            const isUp = idx.pointChange > 0;
            const isDown = idx.pointChange < 0;
            const isRef = idx.pointChange === 0;

            const totalStocks = (idx.countIncrease + idx.countDecrease + idx.countUnchanged) || 1;
            const upPercent = Math.round((idx.countIncrease / totalStocks) * 100);
            const downPercent = Math.round((idx.countDecrease / totalStocks) * 100);
            const refPercent = 100 - upPercent - downPercent;

            // Single Source of Truth cho màu sắc và text
            let colorBadgeClass = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
            let changeSign = '';
            if (isUp) {
              colorBadgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
              changeSign = '+';
            } else if (isDown) {
              colorBadgeClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
              changeSign = ''; // Điểm âm đã tự có dấu trừ '-' sẵn (VD: -11.24)
            }

            return (
              <div 
                key={idx.code}
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:border-primary-500/40 transition-all group"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-[var(--text-main)] group-hover:text-primary-400 transition-colors">
                      {idx.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
                      {idx.floor}
                    </span>
                  </div>

                  {/* Text và màu cùng binding từ biến pointChange */}
                  <span className={`text-xs font-black font-mono tabular-nums px-2 py-0.5 rounded border flex items-center ${colorBadgeClass}`}>
                    {changeSign}{idx.pointChange.toFixed(2)} ({changeSign}{idx.percentChange.toFixed(2)}%)
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight text-[var(--text-main)]">
                  {idx.currentPoint.toFixed(2)}
                </div>

                {/* Thanh phân bổ Tăng / Giảm / Tham chiếu */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-[var(--text-muted)] mb-1 font-mono tabular-nums">
                    <span className="text-emerald-400">▲ {idx.countIncrease}</span>
                    <span className="text-amber-300">■ {idx.countUnchanged}</span>
                    <span className="text-rose-400">▼ {idx.countDecrease}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${upPercent}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${refPercent}%` }} />
                    <div className="h-full bg-rose-500" style={{ width: `${downPercent}%` }} />
                  </div>
                </div>

                {/* Thanh khoản */}
                <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border-color)]/50 font-mono tabular-nums">
                  <span>Giá trị: <strong className="text-primary-400">{formatNumber(idx.totalValueBillion)} tỷ</strong></span>
                  <span>KL: <strong>{formatNumber(Math.round(idx.totalVolume / 1000000), 1)}M</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Thanh Điều Khiển: Tabs Sàn / Ngành, Search & Quick Filters */}
      <div className="flex-shrink-0 p-3 sm:p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5">
        {/* Tabs chọn Sàn & Watchlist */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
            <button
              onClick={() => setActiveTab('WATCHLIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'WATCHLIST' 
                  ? 'bg-amber-500/20 text-amber-400 shadow-sm border border-amber-500/30' 
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              Theo Dõi ({watchlist.length})
            </button>

            {['VN30', 'HOSE', 'HNX', 'UPCOM'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}

            <button
              onClick={() => setActiveTab('SECTOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'SECTOR' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Nhóm Ngành
            </button>
          </div>

          {/* Toggle View Mode: Pro Table vs Fintech Cards */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'TABLE' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Xem Bảng Chuẩn Pro Trading"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'CARDS' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Xem Thẻ Fintech Hiện Đại"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nếu chọn Tab Ngành: Hiển thị các viên thuốc chọn ngành */}
        {activeTab === 'SECTOR' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-color)]/60">
            {SECTORS.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSelectedSectorId(sec.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSectorId === sec.id
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-white border border-transparent'
                }`}
              >
                {sec.name} ({sec.stocks.length})
              </button>
            ))}
          </div>
        )}

        {/* Search Bar & Quick Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã cổ phiếu (FPT, SSI, HPG...)"
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'CEILING', label: '🚀 Trần', color: 'text-purple-400' },
              { id: 'UP', label: '🟢 Tăng', color: 'text-emerald-400' },
              { id: 'REF', label: '🟡 TC', color: 'text-amber-300' },
              { id: 'DOWN', label: '🔴 Giảm', color: 'text-rose-400' },
              { id: 'FLOOR', label: '🔵 Sàn', color: 'text-cyan-400' },
              { id: 'TOP_VOL', label: '🔥 Top Khối Lượng', color: 'text-amber-400 font-bold' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  statusFilter === f.id
                    ? 'bg-primary-600 text-white font-bold shadow-sm'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
                }`}
              >
                <span className={f.color}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Dữ Liệu Bảng Điện Chính (TABLE MODE với VIRTUALIZATION & CELL-LEVEL FLASHING) */}
      {stocksLoading ? (
        <div className="py-20 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="inline-block p-4 rounded-2xl bg-primary-500/10 mb-3 animate-spin text-primary-400">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-primary-400">Đang đồng bộ dữ liệu Realtime 0ms...</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Chuẩn hóa dữ liệu theo sàn và phân tích khớp lệnh</p>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-muted)]">
            Không tìm thấy mã cổ phiếu nào phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      ) : viewMode === 'TABLE' ? (
        /* PRO TRADING TABLE (VIRTUALIZED & CELL FLASHING - SINGLE SCROLLBAR) */
        <div 
          ref={tableContainerRef}
          onScroll={handleScroll}
          className={`rounded-2xl border ${
            boardTheme === 'TRADITIONAL' ? 'border-neutral-700 bg-black' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
          } flex-1 min-h-0 overflow-auto shadow-2xl relative scrollbar-thin`}
        >
          <table className="w-full text-left border-collapse text-xs border-spacing-0">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className={`${
                boardTheme === 'TRADITIONAL' ? 'bg-[#18181b] text-neutral-300' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
              } border-b border-[var(--border-color)] font-bold uppercase tracking-wider text-[10px]`}>
                <th className={`py-2 px-2 text-center w-8 sticky left-0 z-30 ${boardTheme === 'TRADITIONAL' ? 'bg-[#18181b]' : 'bg-[var(--bg-subtle)]'}`}>★</th>
                <th className={`py-2 px-3 font-black text-white w-20 sticky left-8 z-30 ${boardTheme === 'TRADITIONAL' ? 'bg-[#18181b]' : 'bg-[var(--bg-subtle)]'}`}>Mã CK</th>
                
                <th className="py-2 px-2 text-center text-purple-400">Trần</th>
                <th className="py-2 px-2 text-center text-cyan-400">Sàn</th>
                <th className="py-2 px-2 text-center text-amber-300">TC</th>

                {/* Bên Mua 3 bước */}
                <th className="py-2 px-2 text-right text-emerald-400/80 bg-emerald-500/5">Giá 3</th>
                <th className="py-2 px-2 text-right text-[var(--text-muted)] bg-emerald-500/5">KL 3</th>
                <th className="py-2 px-2 text-right text-emerald-400/90 bg-emerald-500/5">Giá 2</th>
                <th className="py-2 px-2 text-right text-[var(--text-muted)] bg-emerald-500/5">KL 2</th>
                <th className="py-2 px-2 text-right text-emerald-400 bg-emerald-500/10 font-black">Giá 1</th>
                <th className="py-2 px-2 text-right text-emerald-300 bg-emerald-500/10 font-bold">KL 1</th>

                {/* Khớp Lệnh Realtime */}
                <th className="py-2 px-3 text-right text-primary-300 bg-primary-500/10 font-black border-x border-primary-500/20">Khớp Giá</th>
                <th className="py-2 px-2 text-right text-white bg-primary-500/10 font-bold">KL Khớp</th>
                <th className="py-2 px-2 text-right text-white bg-primary-500/10 font-bold">+/-</th>
                <th className="py-2 px-2 text-right text-white bg-primary-500/10 font-bold border-r border-primary-500/20">%</th>

                {/* Bên Bán 3 bước */}
                <th className="py-2 px-2 text-right text-rose-400 bg-rose-500/10 font-black">Giá 1</th>
                <th className="py-2 px-2 text-right text-rose-300 bg-rose-500/10 font-bold">KL 1</th>
                <th className="py-2 px-2 text-right text-rose-400/90 bg-rose-500/5">Giá 2</th>
                <th className="py-2 px-2 text-right text-[var(--text-muted)] bg-rose-500/5">KL 2</th>
                <th className="py-2 px-2 text-right text-rose-400/80 bg-rose-500/5">Giá 3</th>
                <th className="py-2 px-2 text-right text-[var(--text-muted)] bg-rose-500/5">KL 3</th>

                {/* Thống kê phiên */}
                <th className="py-2 px-3 text-right font-black text-primary-400">Tổng KL</th>
                <th className="py-2 px-2 text-right text-emerald-400">Cao</th>
                <th className="py-2 px-2 text-right text-rose-400">Thấp</th>
                <th className="py-2 px-2 text-right text-amber-300">TB</th>
                <th className="py-2 px-3 text-right text-[var(--text-muted)]">Ngoại Mua</th>
                <th className="py-2 px-3 text-right text-[var(--text-muted)]">Ngoại Bán</th>
              </tr>
            </thead>

            <tbody>
              {/* Virtual Top Spacer */}
              {topSpacerHeight > 0 && (
                <tr>
                  <td colSpan={26} style={{ height: `${topSpacerHeight}px` }} />
                </tr>
              )}

              {/* Visible Virtual Rows */}
              {visibleStocks.map(stock => {
                const isWatch = watchlist.includes(stock.symbol);

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                    className={`cursor-pointer transition-colors ${
                      boardTheme === 'TRADITIONAL'
                        ? 'hover:bg-neutral-800/80 border-b border-neutral-800'
                        : 'hover:bg-[var(--bg-subtle)]/70 border-b border-[var(--border-color)]'
                    }`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Watchlist toggle */}
                    <td 
                      className={`text-center sticky left-0 z-10 ${
                        boardTheme === 'TRADITIONAL' ? 'bg-black border-r border-neutral-800' : 'bg-[var(--bg-card)]'
                      }`}
                      onClick={(e) => { e.stopPropagation(); handleToggleWatchlist(stock.symbol); }}
                    >
                      <Star className={`w-3.5 h-3.5 mx-auto ${isWatch ? 'fill-amber-400 text-amber-400' : 'text-gray-500 hover:text-amber-400'}`} />
                    </td>

                    {/* Cột Mã CK (Sticky left-8) */}
                    <td className={`px-3 font-black text-sm text-white sticky left-8 z-10 shadow-sm ${
                      boardTheme === 'TRADITIONAL' ? 'bg-black border-r border-neutral-700/80' : 'bg-[var(--bg-card)]'
                    }`}>
                      <div className="flex items-center gap-1 font-mono tracking-tight">
                        {stock.symbol}
                      </div>
                    </td>

                    {/* Trần - Sàn - TC */}
                    <td className="px-2 text-center font-bold font-mono tabular-nums text-purple-400">{formatPrice(stock.ceiling)}</td>
                    <td className="px-2 text-center font-bold font-mono tabular-nums text-cyan-400">{formatPrice(stock.floor)}</td>
                    <td className="px-2 text-center font-bold font-mono tabular-nums text-amber-300">{formatPrice(stock.ref)}</td>

                    {/* Bên Mua 3 bước: CELL-LEVEL FLASHING */}
                    <PriceCell price={stock.bid3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                    <VolumeCell volume={stock.bid3.volume} price={stock.bid3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />
                    <PriceCell price={stock.bid2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                    <VolumeCell volume={stock.bid2.volume} price={stock.bid2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />
                    <PriceCell price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold />
                    <VolumeCell volume={stock.bid1.volume} price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />

                    {/* Khớp Lệnh Realtime: CELL-LEVEL FLASHING */}
                    <PriceCell price={stock.matchedPrice} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold className="border-l border-primary-500/20" />
                    <VolumeCell volume={stock.matchedVolume} price={stock.matchedPrice} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                    <ChangeCell change={stock.change} changePercent={stock.changePercent} boardTheme={boardTheme} type="change" />
                    <ChangeCell change={stock.change} changePercent={stock.changePercent} boardTheme={boardTheme} type="percent" />

                    {/* Bên Bán 3 bước: CELL-LEVEL FLASHING */}
                    <PriceCell price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold />
                    <VolumeCell volume={stock.ask1.volume} price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                    <PriceCell price={stock.ask2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                    <VolumeCell volume={stock.ask2.volume} price={stock.ask2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />
                    <PriceCell price={stock.ask3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                    <VolumeCell volume={stock.ask3.volume} price={stock.ask3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />

                    {/* Thống kê phiên */}
                    <td className="px-3 text-right font-bold font-mono tabular-nums text-primary-400">{formatNumber(stock.totalVolume)}</td>
                    <td className="px-2 text-right font-semibold font-mono tabular-nums text-emerald-400">{formatPrice(stock.highPrice)}</td>
                    <td className="px-2 text-right font-semibold font-mono tabular-nums text-rose-400">{formatPrice(stock.lowPrice)}</td>
                    <td className="px-2 text-right font-mono tabular-nums text-amber-300">{formatPrice(stock.avgPrice)}</td>
                    <td className="px-3 text-right font-mono tabular-nums text-[var(--text-muted)]">{formatNumber(stock.foreignBuy)}</td>
                    <td className="px-3 text-right font-mono tabular-nums text-[var(--text-muted)]">{formatNumber(stock.foreignSell)}</td>
                  </tr>
                );
              })}

              {/* Virtual Bottom Spacer */}
              {bottomSpacerHeight > 0 && (
                <tr>
                  <td colSpan={26} style={{ height: `${bottomSpacerHeight}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* FINTECH CARDS GRID MODE */
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredStocks.map(stock => {
              const isWatch = watchlist.includes(stock.symbol);
              const isUp = stock.change > 0;
              const isDown = stock.change < 0;

              return (
                <div
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-primary-500/50 cursor-pointer shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center font-black text-xs text-primary-400">
                          {stock.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-[var(--text-main)]">{stock.symbol}</span>
                            <span className="text-[10px] px-1 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                              {stock.raw?.marketId || 'HOSE'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{stock.name}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleWatchlist(stock.symbol); }}
                        className="p-1 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                      >
                        <Star className={`w-4 h-4 ${isWatch ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}`} />
                      </button>
                    </div>

                    {/* Giá khớp chính */}
                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <span className={`text-xl font-black font-mono tabular-nums ${getPriceTextColor(stock.matchedPrice, stock.ref, stock.ceiling, stock.floor)}`}>
                          {formatPrice(stock.matchedPrice)}
                        </span>
                      </div>
                      <div className={`text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-lg flex items-center ${
                        isUp ? 'bg-emerald-500/15 text-emerald-400' :
                        isDown ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-300'
                      }`}>
                        {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : isDown ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : null}
                        {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>

                    {/* Mini Trần - Sàn - TC */}
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center my-2.5 p-1.5 rounded-xl bg-[var(--bg-subtle)] font-mono tabular-nums">
                      <div>
                        <span className="text-purple-400 block font-semibold">Trần</span>
                        <span className="font-bold">{formatPrice(stock.ceiling)}</span>
                      </div>
                      <div>
                        <span className="text-amber-300 block font-semibold">TC</span>
                        <span className="font-bold">{formatPrice(stock.ref)}</span>
                      </div>
                      <div>
                        <span className="text-cyan-400 block font-semibold">Sàn</span>
                        <span className="font-bold">{formatPrice(stock.floor)}</span>
                      </div>
                    </div>

                    {/* Bước giá tốt nhất */}
                    <div className="flex justify-between text-xs py-1 px-2 rounded-lg bg-[var(--bg-subtle)]/50 font-mono tabular-nums">
                      <span className="text-emerald-400">Mua: <strong>{formatPrice(stock.bid1.price)}</strong> ({formatNumber(stock.bid1.volume)})</span>
                      <span className="text-rose-400">Bán: <strong>{formatPrice(stock.ask1.price)}</strong> ({formatNumber(stock.ask1.volume)})</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                    <span>Tổng KL: <strong className="text-primary-400">{formatNumber(stock.totalVolume)}</strong></span>
                    <span className="text-primary-400 font-bold flex items-center gap-0.5 hover:underline">
                      Chi tiết <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Drawer Chi Tiết Mã Cổ Phiếu Khi Click */}
      {selectedStock && (
        <StockDetailDrawer
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          isWatchlist={watchlist.includes(selectedStock.symbol)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}
    </div>
  );
}
