import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Star, Search, RefreshCw, Zap,
  Activity, ArrowUpRight, ArrowDownRight, Layers, LayoutGrid,
  Table, Sparkles, Filter, ChevronRight, SlidersHorizontal,
  Flame, Radio, Info, Eye, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchMarketIndices, fetchStockBatch, formatNumber, formatPrice,
  getPriceColorClass, VN30_STOCKS, HOSE_POPULAR, HNX_POPULAR,
  UPCOM_POPULAR, SECTORS, COMPANY_NAMES
} from '../services/liveBoardService';
import StockDetailDrawer from '../components/board/StockDetailDrawer';

export default function LiveBoardPage() {
  const navigate = useNavigate();

  // Tab hiện tại: 'VN30' | 'HOSE' | 'HNX' | 'UPCOM' | 'WATCHLIST' | 'SECTOR'
  const [activeTab, setActiveTab] = useState('VN30');
  const [selectedSectorId, setSelectedSectorId] = useState('bank');
  
  // Dữ liệu chỉ số thị trường (VNINDEX, VN30, HNX, UPCOM)
  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  // Dữ liệu cổ phiếu hiển thị
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);

  // Hiệu ứng Flash nhấp nháy giá realtime
  const [flashMap, setFlashMap] = useState({}); // { [symbol]: 'flash-green' | 'flash-red' }
  const prevPricesRef = useRef({});

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
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');

  // Cổ phiếu đang chọn để xem Drawer chi tiết
  const [selectedStock, setSelectedStock] = useState(null);

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

  // Nạp chỉ số thị trường
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

      // So sánh giá cũ và giá mới để kích hoạt hiệu ứng flash màu
      const newFlash = {};
      const newPrev = { ...prevPricesRef.current };

      list.forEach(item => {
        const oldPrice = newPrev[item.symbol];
        if (oldPrice !== undefined && oldPrice !== item.matchedPrice) {
          if (item.matchedPrice > oldPrice) {
            newFlash[item.symbol] = 'flash-up';
          } else if (item.matchedPrice < oldPrice) {
            newFlash[item.symbol] = 'flash-down';
          }
        }
        newPrev[item.symbol] = item.matchedPrice;
      });

      prevPricesRef.current = newPrev;
      if (Object.keys(newFlash).length > 0) {
        setFlashMap(newFlash);
        setTimeout(() => setFlashMap({}), 900);
      }

      setStocks(list);
      setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.warn('Error loading stocks:', err);
    } finally {
      setStocksLoading(false);
    }
  };

  // Chạy nạp lần đầu khi đổi Tab hoặc Danh mục
  useEffect(() => {
    loadIndices();
    loadStocks(false);
  }, [currentSymbolList]);

  // Vòng lặp Realtime Streaming (1.8s/lần)
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      loadStocks(true);
      loadIndices();
    }, 1800);

    return () => clearInterval(interval);
  }, [isLiveActive, currentSymbolList]);

  // Lọc danh sách hiển thị theo Search và Quick Status Filter
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase().trim();
      result = result.filter(s => 
        s.symbol.includes(q) || 
        (s.name && s.name.toUpperCase().includes(q))
      );
    }

    // Lọc theo trạng thái giá
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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 1. Header Bảng Điện & Ticker 4 Chỉ Số Lớn */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
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
              Dữ liệu thị trường thời gian thực không độ trễ. Giao diện Fintech tối ưu đa thiết bị.
            </p>
          </div>

          {/* Công tắc Bật/Tắt Streaming & Refresh */}
          <div className="flex items-center gap-3">
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

            <button
              onClick={() => {
                loadStocks(false);
                loadIndices();
                toast.success('Đã làm mới dữ liệu realtime');
              }}
              className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white transition-all hover:scale-105"
              title="Làm mới ngay"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {lastUpdatedTime && (
              <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                Cập nhật: {lastUpdatedTime}
              </span>
            )}
          </div>
        </div>

        {/* Khối 4 Chỉ Số Thị Trường (Indices Bar) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {indices.map(idx => {
            const isUp = idx.pointChange > 0;
            const isDown = idx.pointChange < 0;
            const totalStocks = (idx.countIncrease + idx.countDecrease + idx.countUnchanged) || 1;
            const upPercent = Math.round((idx.countIncrease / totalStocks) * 100);
            const downPercent = Math.round((idx.countDecrease / totalStocks) * 100);
            const refPercent = 100 - upPercent - downPercent;

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
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded flex items-center ${
                    isUp ? 'text-emerald-400 bg-emerald-500/10' :
                    isDown ? 'text-rose-400 bg-rose-500/10' : 'text-amber-300 bg-amber-500/10'
                  }`}>
                    {isUp ? '+' : ''}{idx.pointChange.toFixed(2)} ({isUp ? '+' : ''}{idx.percentChange.toFixed(2)}%)
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-main)]">
                  {idx.currentPoint.toFixed(2)}
                </div>

                {/* Thanh phân bổ Tăng / Giảm / Tham chiếu */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-[var(--text-muted)] mb-1">
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
                <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border-color)]/50">
                  <span>Giá trị: <strong className="text-primary-400">{formatNumber(idx.totalValueBillion)} tỷ</strong></span>
                  <span>KL: <strong>{formatNumber(Math.round(idx.totalVolume / 1000000), 1)}M</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Thanh Điều Khiển: Tabs Sàn / Ngành, Search & Quick Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3.5">
        {/* Hàng 1: Tabs chọn Sàn & Watchlist */}
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

        {/* Hàng 2: Search Bar & Quick Status Filter */}
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

      {/* 3. Dữ Liệu Bảng Điện Chính (Table Mode hoặc Cards Mode) */}
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
        /* PRO TRADING TABLE */
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 text-center w-10">★</th>
                  <th className="py-3 px-3 font-black text-white w-20">Mã CK</th>
                  <th className="py-3 px-2 text-right text-purple-400">Trần</th>
                  <th className="py-3 px-2 text-right text-cyan-400">Sàn</th>
                  <th className="py-3 px-2 text-right text-amber-300">TC</th>

                  {/* Bên Mua 3 bước */}
                  <th className="py-3 px-2 text-right text-emerald-400/80 bg-emerald-500/5">Giá 3</th>
                  <th className="py-3 px-2 text-right text-[var(--text-muted)] bg-emerald-500/5">KL 3</th>
                  <th className="py-3 px-2 text-right text-emerald-400/90 bg-emerald-500/5">Giá 2</th>
                  <th className="py-3 px-2 text-right text-[var(--text-muted)] bg-emerald-500/5">KL 2</th>
                  <th className="py-3 px-2 text-right text-emerald-400 bg-emerald-500/10 font-black">Giá 1</th>
                  <th className="py-3 px-2 text-right text-emerald-300 bg-emerald-500/10 font-bold">KL 1</th>

                  {/* Khớp Lệnh Realtime */}
                  <th className="py-3 px-3 text-right text-primary-300 bg-primary-500/10 font-black border-x border-primary-500/20">Khớp Giá</th>
                  <th className="py-3 px-2 text-right text-white bg-primary-500/10 font-bold">KL Khớp</th>
                  <th className="py-3 px-2 text-right text-white bg-primary-500/10 font-bold">+/-</th>
                  <th className="py-3 px-2 text-right text-white bg-primary-500/10 font-bold border-r border-primary-500/20">%</th>

                  {/* Bên Bán 3 bước */}
                  <th className="py-3 px-2 text-right text-rose-400 bg-rose-500/10 font-black">Giá 1</th>
                  <th className="py-3 px-2 text-right text-rose-300 bg-rose-500/10 font-bold">KL 1</th>
                  <th className="py-3 px-2 text-right text-rose-400/90 bg-rose-500/5">Giá 2</th>
                  <th className="py-3 px-2 text-right text-[var(--text-muted)] bg-rose-500/5">KL 2</th>
                  <th className="py-3 px-2 text-right text-rose-400/80 bg-rose-500/5">Giá 3</th>
                  <th className="py-3 px-2 text-right text-[var(--text-muted)] bg-rose-500/5">KL 3</th>

                  {/* Thống kê phiên */}
                  <th className="py-3 px-3 text-right font-black text-primary-400">Tổng KL</th>
                  <th className="py-3 px-2 text-right text-emerald-400">Cao</th>
                  <th className="py-3 px-2 text-right text-rose-400">Thấp</th>
                  <th className="py-3 px-2 text-right text-amber-300">TB</th>
                  <th className="py-3 px-3 text-right text-[var(--text-muted)]">Ngoại Mua</th>
                  <th className="py-3 px-3 text-right text-[var(--text-muted)]">Ngoại Bán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredStocks.map(stock => {
                  const isWatch = watchlist.includes(stock.symbol);
                  const flashClass = flashMap[stock.symbol] === 'flash-up' ? 'bg-emerald-500/20' :
                                    flashMap[stock.symbol] === 'flash-down' ? 'bg-rose-500/20' : '';

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`hover:bg-[var(--bg-subtle)]/70 cursor-pointer transition-colors ${flashClass}`}
                    >
                      {/* Watchlist toggle */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => { e.stopPropagation(); handleToggleWatchlist(stock.symbol); }}>
                        <Star className={`w-3.5 h-3.5 mx-auto ${isWatch ? 'fill-amber-400 text-amber-400' : 'text-gray-500 hover:text-amber-400'}`} />
                      </td>

                      {/* Mã CK */}
                      <td className="py-2.5 px-3">
                        <div className="font-black text-sm text-white group-hover:text-primary-400 flex items-center gap-1.5">
                          {stock.symbol}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] line-clamp-1 max-w-[100px]">
                          {stock.name}
                        </div>
                      </td>

                      {/* Trần - Sàn - TC */}
                      <td className="py-2.5 px-2 text-right font-bold text-purple-400">{formatPrice(stock.ceiling)}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-cyan-400">{formatPrice(stock.floor)}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-amber-300">{formatPrice(stock.ref)}</td>

                      {/* Bên Mua 3 bước */}
                      <td className={`py-2.5 px-2 text-right font-medium bg-emerald-500/5 ${getPriceColorClass(stock.bid3.price, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.bid3.price)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[var(--text-muted)] bg-emerald-500/5">{formatNumber(stock.bid3.volume)}</td>
                      <td className={`py-2.5 px-2 text-right font-medium bg-emerald-500/5 ${getPriceColorClass(stock.bid2.price, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.bid2.price)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[var(--text-muted)] bg-emerald-500/5">{formatNumber(stock.bid2.volume)}</td>
                      <td className={`py-2.5 px-2 text-right font-bold bg-emerald-500/10 ${getPriceColorClass(stock.bid1.price, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.bid1.price)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-300 bg-emerald-500/10">{formatNumber(stock.bid1.volume)}</td>

                      {/* Khớp Lệnh */}
                      <td className={`py-2.5 px-3 text-right font-black text-sm bg-primary-500/10 border-l border-primary-500/20 ${getPriceColorClass(stock.matchedPrice, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.matchedPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-[var(--text-main)] bg-primary-500/10">
                        {formatNumber(stock.matchedVolume)}
                      </td>
                      <td className={`py-2.5 px-2 text-right font-bold bg-primary-500/10 ${
                        stock.change > 0 ? 'text-emerald-400' : stock.change < 0 ? 'text-rose-400' : 'text-amber-300'
                      }`}>
                        {stock.change > 0 ? `+${stock.change.toFixed(2)}` : stock.change.toFixed(2)}
                      </td>
                      <td className={`py-2.5 px-2 text-right font-bold border-r border-primary-500/20 bg-primary-500/10 ${
                        stock.changePercent > 0 ? 'text-emerald-400' : stock.changePercent < 0 ? 'text-rose-400' : 'text-amber-300'
                      }`}>
                        {stock.changePercent > 0 ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`}
                      </td>

                      {/* Bên Bán 3 bước */}
                      <td className={`py-2.5 px-2 text-right font-bold bg-rose-500/10 ${getPriceColorClass(stock.ask1.price, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.ask1.price)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-rose-300 bg-rose-500/10">{formatNumber(stock.ask1.volume)}</td>
                      <td className={`py-2.5 px-2 text-right font-medium bg-rose-500/5 ${getPriceColorClass(stock.ask2.price, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.ask2.price)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[var(--text-muted)] bg-rose-500/5">{formatNumber(stock.ask2.volume)}</td>
                      <td className={`py-2.5 px-2 text-right font-medium bg-rose-500/5 ${getPriceColorClass(stock.ask3.price, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.ask3.price)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[var(--text-muted)] bg-rose-500/5">{formatNumber(stock.ask3.volume)}</td>

                      {/* Thống kê */}
                      <td className="py-2.5 px-3 text-right font-bold text-primary-400">{formatNumber(stock.totalVolume)}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-emerald-400">{formatPrice(stock.highPrice)}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-rose-400">{formatPrice(stock.lowPrice)}</td>
                      <td className="py-2.5 px-2 text-right text-amber-300">{formatPrice(stock.avgPrice)}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-muted)]">{formatNumber(stock.foreignBuy)}</td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-muted)]">{formatNumber(stock.foreignSell)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FINTECH CARDS GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStocks.map(stock => {
            const isWatch = watchlist.includes(stock.symbol);
            const isUp = stock.change > 0;
            const isDown = stock.change < 0;

            return (
              <div
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-primary-500/50 cursor-pointer shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center font-black text-sm text-primary-400">
                        {stock.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-base text-[var(--text-main)]">{stock.symbol}</span>
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
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className={`text-2xl font-black ${getPriceColorClass(stock.matchedPrice, stock.ref, stock.ceiling, stock.floor)}`}>
                        {formatPrice(stock.matchedPrice)}
                      </span>
                    </div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-lg flex items-center ${
                      isUp ? 'bg-emerald-500/15 text-emerald-400' :
                      isDown ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-300'
                    }`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : isDown ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : null}
                      {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>

                  {/* Mini Trần - Sàn - TC */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center my-3 p-2 rounded-xl bg-[var(--bg-subtle)]">
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
                  <div className="flex justify-between text-xs py-1 px-2 rounded-lg bg-[var(--bg-subtle)]/50">
                    <span className="text-emerald-400">Mua: <strong>{formatPrice(stock.bid1.price)}</strong> ({formatNumber(stock.bid1.volume)})</span>
                    <span className="text-rose-400">Bán: <strong>{formatPrice(stock.ask1.price)}</strong> ({formatNumber(stock.ask1.volume)})</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Tổng KL: <strong className="text-primary-400">{formatNumber(stock.totalVolume)}</strong></span>
                  <span className="text-primary-400 font-bold flex items-center gap-0.5 hover:underline">
                    Chi tiết <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
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
