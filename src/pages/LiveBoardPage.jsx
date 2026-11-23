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
import BullBearBattleBar from '../components/board/BullBearBattleBar';
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



  // Chế độ hiển thị cột: 'PRO' (Đầy đủ 3 bước giá chuẩn sàn) vs 'SMART' (Gọn gàng to rõ)
  const [columnMode, setColumnMode] = useState('PRO');

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

  // Thống kê số lượng mã Trần, Tăng, TC, Giảm, Sàn phục vụ hiển thị và bộ lọc
  const marketCounts = useMemo(() => {
    let ceiling = 0;
    let up = 0;
    let ref = 0;
    let down = 0;
    let floor = 0;

    stocks.forEach(s => {
      if (s.statusColor === 'ceiling') ceiling++;
      else if (s.statusColor === 'floor') floor++;
      else if (s.change > 0) up++;
      else if (s.change < 0) down++;
      else ref++;
    });

    return { ceiling, up, ref, down, floor, total: stocks.length };
  }, [stocks]);

  // Thống kê chi tiết Trần & Sàn theo từng sàn/chỉ số (VNINDEX, VN30, HNX, UPCOM)
  const floorCounts = useMemo(() => {
    const map = {
      'VNINDEX': { ceiling: 0, floor: 0 },
      'VN30': { ceiling: 0, floor: 0 },
      'HNX': { ceiling: 0, floor: 0 },
      'UPCOM': { ceiling: 0, floor: 0 }
    };

    stocks.forEach(s => {
      const isCeil = s.statusColor === 'ceiling';
      const isFlr = s.statusColor === 'floor';
      if (!isCeil && !isFlr) return;

      if (VN30_STOCKS.includes(s.symbol)) {
        if (isCeil) map['VN30'].ceiling++;
        if (isFlr) map['VN30'].floor++;
      }
      if (HOSE_POPULAR.includes(s.symbol)) {
        if (isCeil) map['VNINDEX'].ceiling++;
        if (isFlr) map['VNINDEX'].floor++;
      }
      if (HNX_POPULAR.includes(s.symbol)) {
        if (isCeil) map['HNX'].ceiling++;
        if (isFlr) map['HNX'].floor++;
      }
      if (UPCOM_POPULAR.includes(s.symbol)) {
        if (isCeil) map['UPCOM'].ceiling++;
        if (isFlr) map['UPCOM'].floor++;
      }
    });

    return map;
  }, [stocks]);

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
  const [lastUpdatedTime, setLastUpdatedTime] = useState(() => new Date().toLocaleTimeString('vi-VN'));

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
  const ROW_HEIGHT = 40;
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
    }, 350);

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

  // Tính toán Tương quan Lực lượng Bò vs Gấu (Dư Mua vs Dư Bán toàn bộ thị trường)
  const bullBearStats = useMemo(() => {
    let totalBidVol = 0;
    let totalAskVol = 0;

    stocks.forEach(stock => {
      const bidVol = (stock.bid1?.volume || 0) + (stock.bid2?.volume || 0) + (stock.bid3?.volume || 0);
      const askVol = (stock.ask1?.volume || 0) + (stock.ask2?.volume || 0) + (stock.ask3?.volume || 0);
      totalBidVol += bidVol;
      totalAskVol += askVol;
    });

    const total = totalBidVol + totalAskVol;
    const bullPercent = total > 0 ? (totalBidVol / total) * 100 : 50;
    const bearPercent = 100 - bullPercent;
    const diff = bullPercent - bearPercent;

    return {
      totalBidVol,
      totalAskVol,
      bullPercent: Math.round(bullPercent * 10) / 10,
      bearPercent: Math.round(bearPercent * 10) / 10,
      diff: Math.round(diff * 10) / 10,
      dominant: diff > 4 ? 'BULL' : diff < -4 ? 'BEAR' : 'NEUTRAL'
    };
  }, [stocks]);

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
      {/* 1. HEADER CHÍNH & BỘ ĐIỀU KHIỂN GIAO DIỆN */}
      <div className="flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          {/* Tiêu đề & Realtime Badge */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
              Bảng Điện Thông Minh FinGreen
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Realtime 0ms
            </span>
          </div>

          {/* Công cụ điều khiển: Smart / Pro, Theme, Giờ HN */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Toggle Chế độ cột: Smart (Thoáng 14px) vs Pro (3 Bước Giá) */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-sm">
              <button
                onClick={() => setColumnMode('SMART')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  columnMode === 'SMART'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Smart Mode: Ẩn cột thừa, font 14px to rõ, cực kỳ thoáng mắt"
              >
                Smart (To rõ)
              </button>
              <button
                onClick={() => setColumnMode('PRO')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  columnMode === 'PRO'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Pro Mode: Đầy đủ 3 bước giá mua bán"
              >
                Pro (3 Bước)
              </button>
            </div>

            {/* Chế độ giao diện: Modern vs Truyền thống */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-sm">
              <button
                onClick={() => handleSwitchBoardTheme('MODERN')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                  boardTheme === 'MODERN'
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                Modern
              </button>
              <button
                onClick={() => handleSwitchBoardTheme('TRADITIONAL')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                  boardTheme === 'TRADITIONAL'
                    ? 'bg-amber-500 text-black shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3 h-3" />
                Truyền thống
              </button>
            </div>

            {/* Toggle Streaming Live */}
            <button
              onClick={() => setIsLiveActive(!isLiveActive)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                isLiveActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              <Radio className={`w-3 h-3 ${isLiveActive ? 'animate-pulse text-emerald-400' : ''}`} />
              {isLiveActive ? 'Live' : 'Pause'}
            </button>

            {/* Refresh */}
            <button
              onClick={() => {
                loadStocks(false);
                loadIndices();
                toast.success('Đã cập nhật dữ liệu mới');
              }}
              className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
              title="Làm mới"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Đồng Hồ Giờ Hà Nội time.is */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 shadow-sm">
              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border flex items-center gap-1 ${sessionInfo.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sessionInfo.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-neutral-400'}`} />
                {sessionInfo.label}
              </span>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-white">
                <Clock className="w-3 h-3 text-primary-400" />
                <span className="tabular-nums tracking-wider text-primary-300 font-black">{hanoiTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 THẺ CHỈ SỐ VNINDEX DÀI NGANG NHỎ GỌN TRÊN ĐỈNH (TIẾT KIỆM DIỆN TÍCH)   */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {indices.map(idx => {
              const isUp = idx.pointChange > 0;
              const isDown = idx.pointChange < 0;
              const changeSign = isUp ? '+' : '';

              const totalStocks = (idx.countIncrease + idx.countDecrease + idx.countUnchanged) || 1;
              const upPercent = Math.round((idx.countIncrease / totalStocks) * 100);
              const downPercent = Math.round((idx.countDecrease / totalStocks) * 100);
              const refPercent = 100 - upPercent - downPercent;

              const colorBadgeClass = isUp 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                : isDown 
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' 
                  : 'text-amber-300 bg-amber-500/10 border-amber-500/30';

              const pointColor = isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-amber-300';

              return (
                <div 
                  key={idx.code}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  {/* Hàng 1: Tên + Sàn & Biến động % */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-slate-200">
                        {idx.name}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                        {idx.floor}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black font-mono tabular-nums px-1.5 py-0.5 rounded border ${colorBadgeClass}`}>
                      {changeSign}{idx.pointChange.toFixed(2)} ({changeSign}{idx.percentChange.toFixed(2)}%)
                    </span>
                  </div>

                  {/* Hàng 2: Điểm số & Giá trị / Khối lượng */}
                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className={`text-base font-black font-mono tabular-nums tracking-tight ${pointColor}`}>
                      {idx.currentPoint.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                      <span className="text-slate-300 font-semibold">{formatNumber(idx.totalValueBillion)} tỷ</span>
                      <span className="mx-1 opacity-40">•</span>
                      <span>{formatNumber(Math.round(idx.totalVolume / 1000000), 1)}M</span>
                    </div>
                  </div>

                  {/* Hàng 3: Mini Bar 5 phân đoạn: Trần (Tím) - Tăng (Xanh) - TC (Vàng) - Giảm (Đỏ) - Sàn (Lam) */}
                  {(() => {
                    const floorKey = idx.code === 'VN30' ? 'VN30' : idx.floor === 'HNX' ? 'HNX' : idx.floor === 'UPCOM' ? 'UPCOM' : 'VNINDEX';
                    const ceilCount = floorCounts[floorKey]?.ceiling ?? 0;
                    const floorCount = floorCounts[floorKey]?.floor ?? 0;

                    return (
                      <div className="mt-1">
                        <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden flex mb-0.5">
                          {ceilCount > 0 && (
                            <div className="h-full bg-purple-500" style={{ width: `${Math.max(2, Math.round((ceilCount / totalStocks) * 100))}%` }} />
                          )}
                          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${upPercent}%` }} />
                          <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${refPercent}%` }} />
                          <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${downPercent}%` }} />
                          {floorCount > 0 && (
                            <div className="h-full bg-cyan-400" style={{ width: `${Math.max(2, Math.round((floorCount / totalStocks) * 100))}%` }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-semibold font-mono tabular-nums">
                          <div className="flex items-center gap-1.5">
                            <span className="text-purple-400 font-bold" title="Số mã Trần">Trần {ceilCount}</span>
                            <span className="text-emerald-400">▲ {idx.countIncrease}</span>
                          </div>
                          <span className="text-amber-300">■ {idx.countUnchanged}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-rose-400">▼ {idx.countDecrease}</span>
                            <span className="text-cyan-400 font-bold" title="Số mã Sàn">Sàn {floorCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* THANH CHIẾN ĐẤU BÒ VS GẤU NẰM NGANG DƯỚI VNINDEX VÀ TRÊN BẢNG ĐIỆN */}
          <BullBearBattleBar stats={bullBearStats} />
        </div>
      </div>

      {/* 2. THANH ĐIỀU KHIỂN GỘP 1 HÀNG DUY NHẤT: TABS SÀN + TÌM KIẾM SÁT NHAU (TRÁI), BỘ LỌC + VIEW MODE SÁT PHẢI */}
      <div className="flex-shrink-0 px-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
        {/* Nhóm 1: Tabs Sàn + Ô tìm kiếm đặt sát ô Ngành */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setActiveTab('WATCHLIST')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                activeTab === 'WATCHLIST' 
                  ? 'bg-amber-500/20 text-amber-400 shadow-sm border border-amber-500/30' 
                  : 'text-slate-400 hover:text-white'
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
                  activeTab === tab 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}

            <button
              onClick={() => setActiveTab('SECTOR')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                activeTab === 'SECTOR' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Ngành
            </button>
          </div>

          {/* Ô Tìm Kiếm đặt sát ô Ngành */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã (FPT, SSI...)"
              className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Nhóm 2: Quick Filters Tất cả, Trần, Tăng, TC, Giảm, Sàn, Top KL SÁT PHẢI */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <div className="flex items-center gap-1 text-[11px]">
            {[
              { id: 'ALL', label: 'Tất cả', count: marketCounts.total },
              { id: 'CEILING', label: 'Trần', color: 'text-purple-400 font-bold', count: marketCounts.ceiling },
              { id: 'UP', label: 'Tăng', color: 'text-emerald-400 font-bold', count: marketCounts.up },
              { id: 'REF', label: 'TC', color: 'text-amber-300 font-bold', count: marketCounts.ref },
              { id: 'DOWN', label: 'Giảm', color: 'text-rose-400 font-bold', count: marketCounts.down },
              { id: 'FLOOR', label: 'Sàn', color: 'text-cyan-400 font-bold', count: marketCounts.floor },
              { id: 'TOP_VOL', label: 'Top KL', color: 'text-amber-400 font-black' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2 py-0.5 rounded text-[10px] transition-all flex items-center gap-1 ${
                  statusFilter === f.id
                    ? 'bg-primary-600 text-white font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className={f.color}>{f.label}</span>
                {f.count !== undefined && (
                  <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Toggle View Mode: Table vs Cards */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1 rounded text-xs transition-all ${
                viewMode === 'TABLE' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Xem Bảng Chuẩn Pro Trading"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1 rounded text-xs transition-all ${
                viewMode === 'CARDS' 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Xem Thẻ Fintech Hiện Đại"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
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
        /* SMART TRADING TABLE (FULL WIDTH, KHÔNG CẦN CUỘN NGANG, THẤY TRỌN VẸN NGOẠI BÁN) */
        <div 
          ref={tableContainerRef}
          onScroll={handleScroll}
          className={`rounded-2xl border ${
            boardTheme === 'TRADITIONAL' ? 'border-slate-800 bg-black' : 'border-slate-800 bg-slate-950'
          } flex-1 min-h-0 overflow-y-auto overflow-x-hidden shadow-2xl relative scrollbar-thin`}
        >
          <table className="w-full table-fixed text-left border-collapse border-spacing-0 select-none">
            {/* Phân bổ tỷ lệ % chuẩn 100% chiều ngang màn hình, thấy trọn vẹn NGOẠI BÁN mà không cần thanh cuộn ngang */}
            <colgroup>
              {columnMode === 'PRO' ? (
                <>
                  <col style={{ width: '1.6%' }} />  {/* Star */}
                  <col style={{ width: '4.5%' }} />  {/* Mã CK */}
                  <col style={{ width: '3.3%' }} />  {/* Trần */}
                  <col style={{ width: '3.3%' }} />  {/* Sàn */}
                  <col style={{ width: '3.3%' }} />  {/* TC */}
                  <col style={{ width: '3.2%' }} />  {/* Giá 3 */}
                  <col style={{ width: '4.3%' }} />  {/* KL 3 */}
                  <col style={{ width: '3.2%' }} />  {/* Giá 2 */}
                  <col style={{ width: '4.3%' }} />  {/* KL 2 */}
                  <col style={{ width: '3.4%' }} />  {/* Giá 1 */}
                  <col style={{ width: '4.6%' }} />  {/* KL 1 */}
                  <col style={{ width: '4.2%' }} />  {/* Khớp Giá */}
                  <col style={{ width: '4.0%' }} />  {/* KL Khớp */}
                  <col style={{ width: '3.3%' }} />  {/* +/- */}
                  <col style={{ width: '3.5%' }} />  {/* % */}
                  <col style={{ width: '3.4%' }} />  {/* Bán Giá 1 */}
                  <col style={{ width: '4.6%' }} />  {/* Bán KL 1 */}
                  <col style={{ width: '3.2%' }} />  {/* Bán Giá 2 */}
                  <col style={{ width: '4.3%' }} />  {/* Bán KL 2 */}
                  <col style={{ width: '3.2%' }} />  {/* Bán Giá 3 */}
                  <col style={{ width: '4.3%' }} />  {/* Bán KL 3 */}
                  <col style={{ width: '5.0%' }} />  {/* Tổng KL */}
                  <col style={{ width: '3.2%' }} />  {/* Cao */}
                  <col style={{ width: '3.2%' }} />  {/* Thấp */}
                  <col style={{ width: '3.2%' }} />  {/* TB */}
                  <col style={{ width: '4.2%' }} />  {/* Ngoại Mua */}
                  <col style={{ width: '4.2%' }} />  {/* Ngoại Bán */}
                </>
              ) : (
                <>
                  <col style={{ width: '2.0%' }} />  {/* Star */}
                  <col style={{ width: '6.8%' }} />  {/* Mã CK */}
                  <col style={{ width: '4.8%' }} />  {/* Trần */}
                  <col style={{ width: '4.8%' }} />  {/* Sàn */}
                  <col style={{ width: '4.8%' }} />  {/* TC */}
                  <col style={{ width: '5.6%' }} />  {/* Mua Giá 1 */}
                  <col style={{ width: '6.8%' }} />  {/* Mua KL 1 */}
                  <col style={{ width: '6.2%' }} />  {/* Khớp Giá */}
                  <col style={{ width: '5.8%' }} />  {/* KL Khớp */}
                  <col style={{ width: '4.8%' }} />  {/* +/- */}
                  <col style={{ width: '4.8%' }} />  {/* % */}
                  <col style={{ width: '5.6%' }} />  {/* Bán Giá 1 */}
                  <col style={{ width: '6.8%' }} />  {/* Bán KL 1 */}
                  <col style={{ width: '8.0%' }} />  {/* Tổng KL */}
                  <col style={{ width: '4.8%' }} />  {/* Cao */}
                  <col style={{ width: '4.8%' }} />  {/* Thấp */}
                  <col style={{ width: '4.8%' }} />  {/* TB */}
                  <col style={{ width: '5.0%' }} />  {/* Ngoại Mua */}
                  <col style={{ width: '5.0%' }} />  {/* Ngoại Bán */}
                </>
              )}
            </colgroup>

            {/* Header có độ tương phản cao, chữ to rõ #cbd5e1 */}
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className={`${
                boardTheme === 'TRADITIONAL' ? 'bg-[#18181b] text-slate-200' : 'bg-slate-900 text-slate-200'
              } border-b-2 border-slate-700/80 font-bold uppercase tracking-wider text-[11px]`}>
                <th className={`py-2 px-1 text-center sticky left-0 z-30 ${boardTheme === 'TRADITIONAL' ? 'bg-[#18181b]' : 'bg-slate-900'}`}>★</th>
                <th className={`py-2 px-1.5 font-black text-white sticky left-8 z-30 ${boardTheme === 'TRADITIONAL' ? 'bg-[#18181b]' : 'bg-slate-900'} text-left`}>Mã CK</th>
                
                <th className="py-2 px-1 text-right text-purple-400">Trần</th>
                <th className="py-2 px-1 text-right text-cyan-400">Sàn</th>
                <th className="py-2 px-1 text-right text-amber-300">TC</th>

                {columnMode === 'PRO' ? (
                  <>
                    <th className="py-2 px-1 text-right text-emerald-400/80 bg-emerald-500/5">Giá 3</th>
                    <th className="py-2 px-1 text-right text-slate-400 bg-emerald-500/5">KL 3</th>
                    <th className="py-2 px-1 text-right text-emerald-400/90 bg-emerald-500/5">Giá 2</th>
                    <th className="py-2 px-1 text-right text-slate-400 bg-emerald-500/5">KL 2</th>
                    <th className="py-2 px-1 text-right text-emerald-400 bg-emerald-500/10 font-black">Giá 1</th>
                    <th className="py-2 px-1 text-right text-emerald-300 bg-emerald-500/10 font-bold">KL 1</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 px-1.5 text-right text-emerald-400 bg-emerald-500/10 font-black">Mua Giá 1</th>
                    <th className="py-2 px-1.5 text-right text-emerald-300 bg-emerald-500/10 font-bold">Mua KL 1</th>
                  </>
                )}

                {/* Khớp Lệnh Realtime (Cột Trung Tâm Quan Trọng Nhất) */}
                <th className="py-2 px-1.5 text-right text-primary-300 bg-primary-500/15 font-black border-x border-primary-500/30">Khớp Giá</th>
                <th className="py-2 px-1 text-right text-white bg-primary-500/10 font-bold">KL Khớp</th>
                <th className="py-2 px-1 text-right text-white bg-primary-500/10 font-bold">+/-</th>
                <th className="py-2 px-1 text-right text-white bg-primary-500/10 font-bold border-r border-primary-500/30">%</th>

                {columnMode === 'PRO' ? (
                  <>
                    <th className="py-2 px-1 text-right text-rose-400 bg-rose-500/10 font-black">Giá 1</th>
                    <th className="py-2 px-1 text-right text-rose-300 bg-rose-500/10 font-bold">KL 1</th>
                    <th className="py-2 px-1 text-right text-rose-400/90 bg-rose-500/5">Giá 2</th>
                    <th className="py-2 px-1 text-right text-slate-400 bg-rose-500/5">KL 2</th>
                    <th className="py-2 px-1 text-right text-rose-400/80 bg-rose-500/5">Giá 3</th>
                    <th className="py-2 px-1 text-right text-slate-400 bg-rose-500/5">KL 3</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 px-1.5 text-right text-rose-400 bg-rose-500/10 font-black">Bán Giá 1</th>
                    <th className="py-2 px-1.5 text-right text-rose-300 bg-rose-500/10 font-bold">Bán KL 1</th>
                  </>
                )}

                {/* Thống kê phiên */}
                <th className="py-2 px-1.5 text-right font-black text-primary-400">Tổng KL</th>
                <th className="py-2 px-1 text-right text-emerald-400">Cao</th>
                <th className="py-2 px-1 text-right text-rose-400">Thấp</th>
                <th className="py-2 px-1 text-right text-amber-300">TB</th>
                <th className="py-2 px-1.5 text-right text-slate-400">Ngoại Mua</th>
                <th className="py-2 px-1.5 text-right text-slate-400">Ngoại Bán</th>
              </tr>
            </thead>

            <tbody>
              {/* Virtual Top Spacer */}
              {topSpacerHeight > 0 && (
                <tr>
                  <td colSpan={columnMode === 'PRO' ? 27 : 19} style={{ height: `${topSpacerHeight}px` }} />
                </tr>
              )}

              {/* Dữ liệu từng mã cổ phiếu (Dòng thở thoáng 40px, Font đồng bộ toàn bộ số) */}
              {visibleStocks.map(stock => {
                const isWatch = watchlist.includes(stock.symbol);

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                    className={`cursor-pointer transition-colors ${
                      boardTheme === 'TRADITIONAL'
                        ? 'hover:bg-slate-800/90 border-b border-slate-800'
                        : 'hover:bg-slate-800/70 border-b border-slate-800/60'
                    }`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Watchlist toggle */}
                    <td 
                      className={`text-center sticky left-0 z-10 ${
                        boardTheme === 'TRADITIONAL' ? 'bg-black border-r border-slate-800' : 'bg-slate-950'
                      }`}
                      onClick={(e) => { e.stopPropagation(); handleToggleWatchlist(stock.symbol); }}
                    >
                      <Star className={`w-3.5 h-3.5 mx-auto ${isWatch ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-amber-400'}`} />
                    </td>

                    {/* Cột Mã CK: In đậm trắng sáng rõ nét */}
                    <td className={`px-1.5 font-black text-[12.5px] sm:text-[13px] text-white sticky left-8 z-10 shadow-sm text-left overflow-hidden text-ellipsis whitespace-nowrap ${
                      boardTheme === 'TRADITIONAL' ? 'bg-black border-r border-slate-700' : 'bg-slate-950'
                    }`}>
                      <div className="font-mono tracking-tight font-black text-white hover:text-primary-300 transition-colors">
                        {stock.symbol}
                      </div>
                    </td>

                    {/* Trần - Sàn - TC (Right-aligned, font đồng bộ) */}
                    <td className="px-1 py-1.5 text-right font-bold font-mono tabular-nums text-purple-400 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatPrice(stock.ceiling)}</td>
                    <td className="px-1 py-1.5 text-right font-bold font-mono tabular-nums text-cyan-400 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatPrice(stock.floor)}</td>
                    <td className="px-1 py-1.5 text-right font-bold font-mono tabular-nums text-amber-300 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatPrice(stock.ref)}</td>

                    {/* Bên Mua */}
                    {columnMode === 'PRO' ? (
                      <>
                        <PriceCell price={stock.bid3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                        <VolumeCell volume={stock.bid3.volume} price={stock.bid3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />
                        <PriceCell price={stock.bid2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                        <VolumeCell volume={stock.bid2.volume} price={stock.bid2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />
                        <PriceCell price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold />
                        <VolumeCell volume={stock.bid1.volume} price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                      </>
                    ) : (
                      <>
                        <PriceCell price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold className="bg-emerald-500/5" />
                        <VolumeCell volume={stock.bid1.volume} price={stock.bid1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBuySide={true} className="bg-emerald-500/5 font-bold" />
                      </>
                    )}

                    {/* Khớp Lệnh Realtime: Font đồng bộ */}
                    <PriceCell price={stock.matchedPrice} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold triggerVol={stock.matchedVolume || stock.totalVolume} className="border-l border-primary-500/30 bg-primary-500/10 !font-black" />
                    <VolumeCell volume={stock.matchedVolume} price={stock.matchedPrice} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} className="bg-primary-500/5 !font-bold" />
                    <ChangeCell change={stock.change} changePercent={stock.changePercent} boardTheme={boardTheme} type="change" />
                    <ChangeCell change={stock.change} changePercent={stock.changePercent} boardTheme={boardTheme} type="percent" />

                    {/* Bên Bán */}
                    {columnMode === 'PRO' ? (
                      <>
                        <PriceCell price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold />
                        <VolumeCell volume={stock.ask1.volume} price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                        <PriceCell price={stock.ask2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                        <VolumeCell volume={stock.ask2.volume} price={stock.ask2.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />
                        <PriceCell price={stock.ask3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} />
                        <VolumeCell volume={stock.ask3.volume} price={stock.ask3.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isDim />
                      </>
                    ) : (
                      <>
                        <PriceCell price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBold className="bg-rose-500/5" />
                        <VolumeCell volume={stock.ask1.volume} price={stock.ask1.price} refPrice={stock.ref} ceiling={stock.ceiling} floor={stock.floor} boardTheme={boardTheme} isBuySide={false} className="bg-rose-500/5 font-bold" />
                      </>
                    )}

                    {/* Thống kê phiên: Font 12.5-13px đồng bộ toàn bộ các số */}
                    <td className="px-1 py-1.5 text-right font-black font-mono tabular-nums text-primary-400 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatNumber(stock.totalVolume)}</td>
                    <td className="px-1 py-1.5 text-right font-semibold font-mono tabular-nums text-emerald-400 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatPrice(stock.highPrice)}</td>
                    <td className="px-1 py-1.5 text-right font-semibold font-mono tabular-nums text-rose-400 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatPrice(stock.lowPrice)}</td>
                    <td className="px-1 py-1.5 text-right font-mono tabular-nums text-amber-300 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatPrice(stock.avgPrice)}</td>
                    <td className="px-1 py-1.5 text-right font-mono tabular-nums text-slate-400 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatNumber(stock.foreignBuy)}</td>
                    <td className="px-1 py-1.5 text-right font-mono tabular-nums text-slate-400 text-[12.5px] sm:text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{formatNumber(stock.foreignSell)}</td>
                  </tr>
                );
              })}

              {/* Virtual Bottom Spacer */}
              {bottomSpacerHeight > 0 && (
                <tr>
                  <td colSpan={columnMode === 'PRO' ? 27 : 19} style={{ height: `${bottomSpacerHeight}px` }} />
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
