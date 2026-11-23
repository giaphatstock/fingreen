import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Zap, Bot, Star, TrendingUp, TrendingDown, ExternalLink,
  ShieldCheck, BarChart2, DollarSign, Layers, Activity, Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatNumber, formatPrice, getPriceColorClass } from '../../services/liveBoardService';

export default function StockDetailDrawer({ stock, onClose, isWatchlist, onToggleWatchlist }) {
  const navigate = useNavigate();

  if (!stock) return null;

  const isUp = stock.change > 0;
  const isDown = stock.change < 0;

  // Tính tỷ lệ dư mua / dư bán từ 3 bước giá
  const totalBidVol = (stock.bid1.volume || 0) + (stock.bid2.volume || 0) + (stock.bid3.volume || 0);
  const totalAskVol = (stock.ask1.volume || 0) + (stock.ask2.volume || 0) + (stock.ask3.volume || 0);
  const totalQueueVol = totalBidVol + totalAskVol || 1;
  const bidRatio = Math.round((totalBidVol / totalQueueVol) * 100);
  const askRatio = 100 - bidRatio;

  // Khối ngoại mua ròng / bán ròng
  const foreignNet = stock.foreignBuy - stock.foreignSell;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full overflow-y-auto p-6 flex flex-col shadow-2xl transition-transform animate-in slide-in-from-right duration-300"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header Drawer */}
        <div className="flex items-start justify-between pb-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center font-black text-xl text-primary-400 shadow-inner">
              {stock.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
                  {stock.symbol}
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
                  {stock.raw?.marketId || 'HOSE'}
                </span>
                <button
                  onClick={() => onToggleWatchlist(stock.symbol)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    isWatchlist 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-amber-400 border-[var(--border-color)]'
                  }`}
                  title={isWatchlist ? 'Bỏ theo dõi' : 'Thêm vào Watchlist'}
                >
                  <Star className={`w-4 h-4 ${isWatchlist ? 'fill-current' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 line-clamp-1">
                {stock.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Khối Giá Khớp Hiện Tại Lớn */}
        <div className="py-5 border-b border-[var(--border-color)] flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Giá khớp realtime
            </div>
            <div className="flex items-baseline gap-3">
              <span className={`text-4xl font-black tracking-tight ${getPriceColorClass(stock.matchedPrice, stock.ref, stock.ceiling, stock.floor)}`}>
                {formatPrice(stock.matchedPrice)}
              </span>
              <div className={`flex items-center text-sm font-bold px-2 py-0.5 rounded-lg ${
                isUp ? 'bg-emerald-500/15 text-emerald-400' :
                isDown ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-300'
              }`}>
                {isUp ? <ArrowUpRight className="w-4 h-4 mr-0.5 inline" /> : isDown ? <ArrowDownRight className="w-4 h-4 mr-0.5 inline" /> : null}
                {isUp ? '+' : ''}{stock.change > 0 ? stock.change.toFixed(2) : stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-[var(--text-muted)]">KL khớp lệnh</div>
            <div className="text-base font-bold text-[var(--text-main)] mt-0.5">
              {formatNumber(stock.matchedVolume)} CP
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Tổng KL: <span className="font-semibold text-primary-400">{formatNumber(stock.totalVolume)}</span>
            </div>
          </div>
        </div>

        {/* Bộ ba Trần - Sàn - Tham chiếu */}
        <div className="grid grid-cols-3 gap-2 my-5 p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="text-center p-2 rounded-xl bg-[var(--bg-card)]">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Trần (Ceiling)</span>
            <div className="text-base font-black text-purple-400 mt-0.5">{formatPrice(stock.ceiling)}</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-[var(--bg-card)]">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Tham Chiếu (TC)</span>
            <div className="text-base font-black text-amber-300 mt-0.5">{formatPrice(stock.ref)}</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-[var(--bg-card)]">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Sàn (Floor)</span>
            <div className="text-base font-black text-cyan-400 mt-0.5">{formatPrice(stock.floor)}</div>
          </div>
        </div>

        {/* Thanh cân bằng Lực Mua / Lực Bán */}
        <div className="mb-6 p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-emerald-400">Dư Mua 3 bước: {formatNumber(totalBidVol)} ({bidRatio}%)</span>
            <span className="text-rose-400">Dư Bán 3 bước: {formatNumber(totalAskVol)} ({askRatio}%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--bg-card)] overflow-hidden flex">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300" 
              style={{ width: `${bidRatio}%` }}
            />
            <div 
              className="h-full bg-rose-500 transition-all duration-300" 
              style={{ width: `${askRatio}%` }}
            />
          </div>
        </div>

        {/* Bảng Chi Tiết Sổ Lệnh 3 Bước Giá */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary-400" /> Sổ Lệnh Khớp Realtime
          </h3>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Cột Mua */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
              <div className="font-bold text-emerald-400 pb-1 border-b border-emerald-500/20 flex justify-between">
                <span>Bên Mua (Bids)</span>
                <span>Khối Lượng</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-emerald-300">Giá 1: {formatPrice(stock.bid1.price)}</span>
                <span className="text-[var(--text-main)]">{formatNumber(stock.bid1.volume)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-emerald-300/80">Giá 2: {formatPrice(stock.bid2.price)}</span>
                <span className="text-[var(--text-muted)]">{formatNumber(stock.bid2.volume)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-emerald-300/60">Giá 3: {formatPrice(stock.bid3.price)}</span>
                <span className="text-[var(--text-muted)]">{formatNumber(stock.bid3.volume)}</span>
              </div>
            </div>

            {/* Cột Bán */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
              <div className="font-bold text-rose-400 pb-1 border-b border-rose-500/20 flex justify-between">
                <span>Bên Bán (Asks)</span>
                <span>Khối Lượng</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-rose-300">Giá 1: {formatPrice(stock.ask1.price)}</span>
                <span className="text-[var(--text-main)]">{formatNumber(stock.ask1.volume)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-rose-300/80">Giá 2: {formatPrice(stock.ask2.price)}</span>
                <span className="text-[var(--text-muted)]">{formatNumber(stock.ask2.volume)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-rose-300/60">Giá 3: {formatPrice(stock.ask3.price)}</span>
                <span className="text-[var(--text-muted)]">{formatNumber(stock.ask3.volume)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê giao dịch trong ngày */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary-400" /> Thống Kê Phiên Giao Dịch
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--bg-subtle)] p-4 rounded-2xl border border-[var(--border-color)]">
            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
              <span className="text-[var(--text-muted)]">Giá cao nhất:</span>
              <span className="font-bold text-emerald-400">{formatPrice(stock.highPrice)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
              <span className="text-[var(--text-muted)]">Giá thấp nhất:</span>
              <span className="font-bold text-rose-400">{formatPrice(stock.lowPrice)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
              <span className="text-[var(--text-muted)]">Giá mở cửa:</span>
              <span className="font-semibold text-[var(--text-main)]">{formatPrice(stock.openPrice)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
              <span className="text-[var(--text-muted)]">Giá trung bình:</span>
              <span className="font-semibold text-[var(--text-main)]">{formatPrice(stock.avgPrice)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--text-muted)]">Khối ngoại mua:</span>
              <span className="font-semibold text-emerald-400">{formatNumber(stock.foreignBuy)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--text-muted)]">Khối ngoại bán:</span>
              <span className="font-semibold text-rose-400">{formatNumber(stock.foreignSell)}</span>
            </div>
            <div className="col-span-2 flex justify-between pt-2 border-t border-[var(--border-color)]/50 font-bold">
              <span className="text-[var(--text-muted)]">Khối ngoại mua/bán ròng:</span>
              <span className={foreignNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {foreignNet >= 0 ? '+' : ''}{formatNumber(foreignNet)} CP
              </span>
            </div>
          </div>
        </div>

        {/* Nút tác vụ nhanh: Chuyển sang GreenSmartOne hoặc AI */}
        <div className="mt-auto pt-4 border-t border-[var(--border-color)] space-y-2.5">
          <button
            onClick={() => {
              onClose();
              navigate(`/greensmartone?symbol=${stock.symbol}`);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Zap className="w-4 h-4 text-amber-300" /> Phân Tích Kỹ Thuật (GreenSmartOne)
          </button>

          <button
            onClick={() => {
              onClose();
              navigate(`/ai?symbol=${stock.symbol}`);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-color)] font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Bot className="w-4 h-4 text-primary-400" /> Hỏi FinGreen AI Về Mã {stock.symbol}
          </button>
        </div>
      </div>
    </div>
  );
}
