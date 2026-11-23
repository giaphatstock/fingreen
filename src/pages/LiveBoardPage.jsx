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

  const day = partMap.weekday;
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const totalMin = hour * 60 + minute;

  if (day === 'Sat' || day === 'Sun') {
    return {
      status: 'CLOSED',
      label: 'Đóng cửa (Cuối tuần)',
      badgeClass: 'text-neutral-400 bg-neutral-800/80 border-neutral-700',
      isOpen: false
    };
  }

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
      label: 'ATO (Mở cửa)',
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
      label: 'ATC (Đóng cửa)',
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

  // Giao diện bảng giá: 'MODERN' vs 'TRADITIONAL'
  const [boardTheme, setBoardTheme] = useState(() => {
    return localStorage.getItem('fingreen_board_theme') || 'TRADITIONAL';
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('TABLE');

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

  // Đồng hồ Giờ Hà Nội time.is chạy từng giây (tick realtime liên tục)
  const [hanoiTime, setHanoiTime] = useState(getHanoiTimeNow);
  const [sessionInfo, setSessionInfo] = useState(getMarketSessionInfo);

  useEffect(() => {
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
  const ROW_HEIGHT = 30; // Chuẩn SSI density
  const OVERSCAN = 10;

  // Batching & Throttling buffer với requestAnimationFrame
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
        list.forEach(item => {
          pendingBatchRef.current.set(item.symbol, item);
        });
      }
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
  const containerHeight = 800;
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
    <div className="h-full flex flex-col space-y-1.5 overflow-hidden animate-in fade-in duration-300 text-[11px]">
      {/* 1. THANH CHỈ SỐ THỊ TRƯỜNG SLIM CHUẨN SSI (CAO CHỈ 48px - NHƯỜNG KHÔNG GIAN CHO BẢNG) */}
      <div className="flex-shrink-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        {/* 4 Chỉ số thị trường cạnh nhau */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {indices.map(idx => {
            const isUp = idx.pointChange > 0;
            const isDown = idx.pointChange < 0;
            const sign = isUp ? '+' : '';

            return (
              <div key={idx.code} className="flex items-center gap-1.5 text-xs font-mono tabular-nums whitespace-nowrap">
                <span className="font-bold text-[var(--text-main)] text-[11px]">{idx.name}:</span>
                <span className={`font-black ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-amber-300'}`}>
                  {idx.currentPoint.toFixed(2)}
                </span>
                <span className={`text-[11px] font-semibold ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-amber-300'}`}>
                  {sign}{idx.pointChange.toFixed(2)} ({sign}{idx.percentChange.toFixed(2)}%)
                </span>
                <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] ml-1 border-l border-[var(--border-color)] pl-1.5">
                  <span className="text-emerald-400">▲{idx.countIncrease}</span>
                  <span className="text-amber-300">■{idx.countUnchanged}</span>
                  <span className="text-rose-400">▼{idx.countDecrease}</span>
                  <span className="text-primary-300">GT: {formatNumber(idx.totalValueBillion)}T</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Khối bên phải: Trạng thái phiên + Giờ Hà Nội time.is + Nút Live & Theme */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {/* Trạng thái phiên */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${sessionInfo.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sessionInfo.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-neutral-400'}`} />
            {sessionInfo.label}
          </span>

          {/* Giờ Hà Nội time.is nhảy từng giây */}
          <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--text-main)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
            <Clock className="w-3 h-3 text-primary-400" />
            <span className="tabular-nums tracking-wide text-primary-300 font-black">{hanoiTime}</span>
          </div>

          {/* Nút Đổi Theme */}
          <button
            onClick={() => handleSwitchBoardTheme(boardTheme === 'TRADITIONAL' ? 'MODERN' : 'TRADITIONAL')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 ${
              boardTheme === 'TRADITIONAL'
                ? 'bg-amber-500 text-black border-amber-600 shadow-sm'
                : 'bg-primary-600 text-white border-primary-500'
            }`}
            title="Chuyển đổi giao diện"
          >
            {boardTheme === 'TRADITIONAL' ? 'Truyền thống' : 'Modern'}
          </button>

          {/* Live toggle */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`p-1 rounded-lg border transition-all ${
              isLiveActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
            title={isLiveActive ? 'Live Streaming đang bật' : 'Tạm dừng Live'}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-pulse text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC TỐI GIẢN (CAO CHỈ 36px) */}
      <div className="flex-shrink-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2 py-1 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Ô tìm kiếm nhỏ gọn */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã CK..."
              className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Sàn tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('WATCHLIST')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                activeTab === 'WATCHLIST' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              Theo Dõi ({watchlist.length})
            </button>

            {['VN30', 'HOSE', 'HNX', 'UPCOM'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  activeTab === tab ? 'bg-primary-600 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}

            <button
              onClick={() => setActiveTab('SECTOR')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                activeTab === 'SECTOR' ? 'bg-primary-600 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Ngành
            </button>
          </div>
        </div>

        {/* Quick status filters */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'CEILING', label: 'Trần', color: 'text-purple-400' },
            { id: 'UP', label: 'Tăng', color: 'text-emerald-400' },
            { id: 'REF', label: 'TC', color: 'text-amber-300' },
            { id: 'DOWN', label: 'Giảm', color: 'text-rose-400' },
            { id: 'FLOOR', label: 'Sàn', color: 'text-cyan-400' },
            { id: 'TOP_VOL', label: 'Top KL', color: 'text-amber-400 font-bold' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                statusFilter === f.id
                  ? 'bg-primary-600 text-white font-bold'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <span className={f.color}>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Ngành nếu chọn tab SECTOR */}
      {activeTab === 'SECTOR' && (
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-x-auto scrollbar-none">
          {SECTORS.map(sec => (
            <button
              key={sec.id}
              onClick={() => setSelectedSectorId(sec.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition-all ${
                selectedSectorId === sec.id
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {sec.name} ({sec.stocks.length})
            </button>
          ))}
        </div>
      )}

      {/* 3. BẢNG ĐIỆN TỬ CHUẨN SSI iBOARD (100% WIDTH, FULL VIEWPORT, 0 CUỘN NGANG) */}
      <div 
        ref={tableContainerRef}
        onScroll={handleScroll}
        className={`flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden rounded-xl border ${
          boardTheme === 'TRADITIONAL' ? 'border-neutral-800 bg-[#000000]' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
        } shadow-2xl relative scrollbar-thin`}
      >
        <table className="w-full table-fixed border-collapse text-[11px] select-none border-spacing-0">
          {/* CỐ ĐỊNH CHIỀU RỘNG TỪNG CỘT (TỔNG 100% - KHÔNG BAO GIỜ NHẢY KÍCH THƯỚC) */}
          <colgroup>
            <col style={{ width: '4.5%' }} /> {/* CK */}
            <col style={{ width: '3.2%' }} /> {/* Trần */}
            <col style={{ width: '3.2%' }} /> {/* Sàn */}
            <col style={{ width: '3.2%' }} /> {/* TC */}
            
            {/* Bên mua 6 cột */}
            <col style={{ width: '3.4%' }} /> {/* Giá 3 */}
            <col style={{ width: '4.0%' }} /> {/* KL 3 */}
            <col style={{ width: '3.4%' }} /> {/* Giá 2 */}
            <col style={{ width: '4.0%' }} /> {/* KL 2 */}
            <col style={{ width: '3.5%' }} /> {/* Giá 1 */}
            <col style={{ width: '4.2%' }} /> {/* KL 1 */}

            {/* Khớp lệnh 4 cột */}
            <col style={{ width: '3.8%' }} /> {/* Khớp Giá */}
            <col style={{ width: '4.0%' }} /> {/* KL Khớp */}
            <col style={{ width: '3.3%' }} /> {/* +/- */}
            <col style={{ width: '3.3%' }} /> {/* % */}

            {/* Bên bán 6 cột */}
            <col style={{ width: '3.5%' }} /> {/* Giá 1 */}
            <col style={{ width: '4.2%' }} /> {/* KL 1 */}
            <col style={{ width: '3.4%' }} /> {/* Giá 2 */}
            <col style={{ width: '4.0%' }} /> {/* KL 2 */}
            <col style={{ width: '3.4%' }} /> {/* Giá 3 */}
            <col style={{ width: '4.0%' }} /> {/* KL 3 */}

            {/* Thống kê */}
            <col style={{ width: '5.5%' }} /> {/* Tổng KL */}
            <col style={{ width: '3.2%' }} /> {/* Cao */}
            <col style={{ width: '3.2%' }} /> {/* Thấp */}
            <col style={{ width: '3.2%' }} /> {/* TB */}
            <col style={{ width: '5.7%' }} /> {/* NN Mua */}
            <col style={{ width: '5.7%' }} /> {/* NN Bán */}
          </colgroup>

          {/* HEADER 2 TẦNG CHUẨN SSI iBOARD (ẢNH 3) */}
          <thead className="sticky top-0 z-20 shadow-md">
            {/* Tầng 1: Super Header Nhóm Cột */}
            <tr className={`${
              boardTheme === 'TRADITIONAL' ? 'bg-[#18181b] text-neutral-300' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
            } border-b border-neutral-700 font-bold uppercase text-[10px]`}>
              <th rowSpan={2} className="py-1 px-1 text-center border-r border-neutral-700/80 text-white font-black">CK</th>
              <th rowSpan={2} className="py-1 px-0.5 text-center border-r border-neutral-700/80 text-purple-400">Trần</th>
              <th rowSpan={2} className="py-1 px-0.5 text-center border-r border-neutral-700/80 text-cyan-400">Sàn</th>
              <th rowSpan={2} className="py-1 px-0.5 text-center border-r border-neutral-700/80 text-amber-300">TC</th>

              {/* Nhóm Bên Mua */}
              <th colSpan={6} className="py-0.5 px-1 text-center border-r border-neutral-700/80 text-emerald-400 bg-emerald-500/10 font-bold">
                Bên Mua
              </th>

              {/* Nhóm Khớp Lệnh */}
              <th colSpan={4} className="py-0.5 px-1 text-center border-r border-neutral-700/80 text-primary-300 bg-primary-500/15 font-black">
                Khớp Lệnh
              </th>

              {/* Nhóm Bên Bán */}
              <th colSpan={6} className="py-0.5 px-1 text-center border-r border-neutral-700/80 text-rose-400 bg-rose-500/10 font-bold">
                Bên Bán
              </th>

              {/* Thống kê phiên */}
              <th rowSpan={2} className="py-1 px-1 text-right border-r border-neutral-700/80 text-primary-300 font-black">Tổng KL</th>
              <th rowSpan={2} className="py-1 px-0.5 text-right border-r border-neutral-700/80 text-emerald-400">Cao</th>
              <th rowSpan={2} className="py-1 px-0.5 text-right border-r border-neutral-700/80 text-rose-400">Thấp</th>
              <th rowSpan={2} className="py-1 px-0.5 text-right border-r border-neutral-700/80 text-amber-300">TB</th>

              {/* Nhóm ĐTNN */}
              <th colSpan={2} className="py-0.5 px-1 text-center text-neutral-300 font-bold">
                ĐTNN
              </th>
            </tr>

            {/* Tầng 2: Sub Header Từng Bước Giá */}
            <tr className={`${
              boardTheme === 'TRADITIONAL' ? 'bg-[#18181b] text-neutral-400' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
            } border-b border-neutral-700 text-[10px]`}>
              {/* Bên Mua 6 bước */}
              <th className="py-1 px-0.5 text-right text-emerald-400/80">Giá 3</th>
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/60">KL 3</th>
              <th className="py-1 px-0.5 text-right text-emerald-400/90">Giá 2</th>
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/60">KL 2</th>
              <th className="py-1 px-0.5 text-right text-emerald-400 font-bold">Giá 1</th>
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/80 font-bold text-emerald-300">KL 1</th>

              {/* Khớp Lệnh 4 cột */}
              <th className="py-1 px-0.5 text-right text-primary-300 font-black">Giá</th>
              <th className="py-1 px-0.5 text-right text-white font-bold">KL</th>
              <th className="py-1 px-0.5 text-right text-white font-bold">+/-</th>
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/80 text-white font-bold">%</th>

              {/* Bên Bán 6 bước */}
              <th className="py-1 px-0.5 text-right text-rose-400 font-bold">Giá 1</th>
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/60 font-bold text-rose-300">KL 1</th>
              <th className="py-1 px-0.5 text-right text-rose-400/90">Giá 2</th>
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/60">KL 2</th>
              <th className="py-1 px-0.5 text-right text-rose-400/80">Giá 3</th>
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/80">KL 3</th>

              {/* ĐTNN */}
              <th className="py-1 px-0.5 text-right border-r border-neutral-700/60">Mua</th>
              <th className="py-1 px-0.5 text-right">Bán</th>
            </tr>
          </thead>

          <tbody>
            {/* Top Virtual Spacer */}
            {topSpacerHeight > 0 && (
              <tr>
                <td colSpan={26} style={{ height: `${topSpacerHeight}px` }} />
              </tr>
            )}

            {/* Dữ liệu từng mã cổ phiếu (High-density 30px / row) */}
            {visibleStocks.map(stock => {
              const isWatch = watchlist.includes(stock.symbol);

              return (
                <tr
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className={`cursor-pointer transition-colors border-b ${
                    boardTheme === 'TRADITIONAL'
                      ? 'hover:bg-neutral-800/80 border-neutral-800'
                      : 'hover:bg-[var(--bg-subtle)]/70 border-[var(--border-color)]/30'
                  }`}
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {/* Mã CK */}
                  <td className="px-1 py-1 text-center font-black text-white font-mono border-r border-neutral-800">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleWatchlist(stock.symbol); }}
                        className="text-[10px] text-neutral-500 hover:text-amber-400"
                      >
                        <Star className={`w-2.5 h-2.5 ${isWatch ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <span>{stock.symbol}</span>
                    </div>
                  </td>

                  {/* Trần - Sàn - TC */}
                  <td className="px-0.5 py-1 text-right font-mono tabular-nums text-purple-400 font-bold border-r border-neutral-800/50">{formatPrice(stock.ceiling)}</td>
                  <td className="px-0.5 py-1 text-right font-mono tabular-nums text-cyan-400 font-bold border-r border-neutral-800/50">{formatPrice(stock.floor)}</td>
                  <td className="px-0.5 py-1 text-right font-mono tabular-nums text-amber-300 font-bold border-r border-neutral-800">{formatPrice(stock.ref)}</td>

                  {/* Bên Mua 6 bước (Giá 3, KL 3, Giá 2, KL 2, Giá 1, KL 1) */}
                  <PriceCell price={stock.bid3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                  <VolumeCell volume={stock.bid3.volume} price={stock.bid3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim className="border-r border-neutral-800/40" />
                  <PriceCell price={stock.bid2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                  <VolumeCell volume={stock.bid2.volume} price={stock.bid2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim className="border-r border-neutral-800/40" />
                  <PriceCell price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold />
                  <VolumeCell volume={stock.bid1.volume} price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} className="border-r border-neutral-800" />

                  {/* Khớp Lệnh 4 cột (Giá, KL, +/-, %) */}
                  <PriceCell price={stock.matchedPrice} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold />
                  <VolumeCell volume={stock.matchedVolume} price={stock.matchedPrice} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                  <ChangeCell change={stock.change} changePercent={stock.changePercent} boardTheme={boardTheme} type="change" />
                  <ChangeCell change={stock.change} changePercent={stock.changePercent} boardTheme={boardTheme} type="percent" />

                  {/* Bên Bán 6 bước (Giá 1, KL 1, Giá 2, KL 2, Giá 3, KL 3) */}
                  <PriceCell price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold className="border-l border-neutral-800" />
                  <VolumeCell volume={stock.ask1.volume} price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} className="border-r border-neutral-800/40" />
                  <PriceCell price={stock.ask2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                  <VolumeCell volume={stock.ask2.volume} price={stock.ask2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim className="border-r border-neutral-800/40" />
                  <PriceCell price={stock.ask3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                  <VolumeCell volume={stock.ask3.volume} price={stock.ask3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim className="border-r border-neutral-800" />

                  {/* Thống kê phiên */}
                  <td className="px-1 py-1 text-right font-mono tabular-nums text-primary-300 font-bold border-r border-neutral-800/50">{formatNumber(stock.totalVolume)}</td>
                  <td className="px-0.5 py-1 text-right font-mono tabular-nums text-emerald-400 font-semibold border-r border-neutral-800/50">{formatPrice(stock.highPrice)}</td>
                  <td className="px-0.5 py-1 text-right font-mono tabular-nums text-rose-400 font-semibold border-r border-neutral-800/50">{formatPrice(stock.lowPrice)}</td>
                  <td className="px-0.5 py-1 text-right font-mono tabular-nums text-amber-300 border-r border-neutral-800">{formatPrice(stock.avgPrice)}</td>

                  {/* ĐTNN */}
                  <td className="px-1 py-1 text-right font-mono tabular-nums text-neutral-400 border-r border-neutral-800/50">{formatNumber(stock.foreignBuy)}</td>
                  <td className="px-1 py-1 text-right font-mono tabular-nums text-neutral-400">{formatNumber(stock.foreignSell)}</td>
                </tr>
              );
            })}

            {/* Bottom Virtual Spacer */}
            {bottomSpacerHeight > 0 && (
              <tr>
                <td colSpan={26} style={{ height: `${bottomSpacerHeight}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
