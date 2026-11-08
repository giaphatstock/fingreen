import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Target, Percent, Award, ArrowUpRight,
  ArrowDownRight, History, Layers, Filter, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function BacktestPerformancePanel({
  stats = {},
  trades = [],
  symbol = 'FPT'
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'WIN' | 'LOSS' | 'LONG' | 'SHORT'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const {
    totalTrades = 0,
    wins = 0,
    losses = 0,
    winRate = '0.0',
    totalPnl = '0.00',
    currentPosition = 'TIỀN MẶT',
    currentEntryPrice = 0
  } = stats;

  const pnlNum = parseFloat(totalPnl);
  const isPnlPositive = pnlNum >= 0;

  // Sắp xếp danh sách lệnh với LỆNH GẦN NHẤT XẾP TRÊN CÙNG
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      if (b.exitBar !== undefined && a.exitBar !== undefined) {
        return b.exitBar - a.exitBar;
      }
      const timeB = b.exitTime || b.time || '';
      const timeA = a.exitTime || a.time || '';
      return timeB.localeCompare(timeA);
    });
  }, [trades]);

  // Lọc danh sách lệnh theo yêu cầu
  const filteredTrades = useMemo(() => {
    return sortedTrades.filter(t => {
      if (filterType === 'WIN') return t.pnlPct >= 0;
      if (filterType === 'LOSS') return t.pnlPct < 0;
      if (filterType === 'LONG') return t.type === 'Long';
      if (filterType === 'SHORT') return t.type === 'Short';
      return true;
    });
  }, [sortedTrades, filterType]);

  // Phân trang
  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTrades.slice(startIndex, startIndex + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header & Thống Kê Tổng Quan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              Hiệu Suất & Lịch Sử Toàn Bộ Lệnh GreenSmartOne
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                MÃ {symbol}
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Thống kê toàn diện {trades.length} lệnh trong toàn bộ chu kỳ dữ liệu lịch sử
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Tổng cộng: <strong className="text-[var(--text-main)]">{trades.length}</strong> lệnh
          </span>
        </div>
      </div>

      {/* Grid 4 Thẻ Số Liệu Thống Kê Chính */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {/* Win Rate */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Tỷ Lệ Thắng (Winrate)</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-400 font-mono">{winRate}%</span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">({wins}W / {losses}L)</span>
          </div>
        </div>

        {/* Tổng PnL */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Lợi Nhuận Tích Lũy</span>
            {isPnlPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-xl font-extrabold font-mono ${isPnlPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPnlPositive ? `+${totalPnl}%` : `${totalPnl}%`}
            </span>
          </div>
        </div>

        {/* Tổng Số Lệnh Đã Thực Hiện */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Tổng Lệnh Đã Khớp</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-cyan-300 font-mono">{totalTrades}</span>
            <span className="text-[10px] text-[var(--text-muted)]">giao dịch</span>
          </div>
        </div>

        {/* Trạng Thái Vị Thế Hiện Tại */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Vị Thế Hiện Tại</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
              currentPosition === 'LONG'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : currentPosition === 'SHORT'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
            }`}>
              {currentPosition}
            </span>
            {currentEntryPrice > 0 && (
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                @ {currentEntryPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bộ Lọc Tabs & Bảng Chi Tiết Toàn Bộ Lịch Sử Lệnh */}
      <div className="mt-5 pt-4 border-t border-[var(--border-color)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                filterType === 'ALL'
                  ? 'bg-primary-500 text-white font-bold shadow-md'
                  : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
              }`}
            >
              Tất Cả ({trades.length})
            </button>
            <button
              onClick={() => { setFilterType('WIN'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                filterType === 'WIN'
                  ? 'bg-emerald-500 text-white font-bold shadow-md'
                  : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
              }`}
            >
              Lệnh Thắng ({wins})
            </button>
            <button
              onClick={() => { setFilterType('LOSS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                filterType === 'LOSS'
                  ? 'bg-rose-500 text-white font-bold shadow-md'
                  : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
              }`}
            >
              Lệnh Thua ({losses})
            </button>
            <button
              onClick={() => { setFilterType('LONG'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                filterType === 'LONG'
                  ? 'bg-cyan-600 text-white font-bold shadow-md'
                  : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
              }`}
            >
              Lệnh Mua (Long)
            </button>
            <button
              onClick={() => { setFilterType('SHORT'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                filterType === 'SHORT'
                  ? 'bg-amber-600 text-white font-bold shadow-md'
                  : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
              }`}
            >
              Lệnh Bán (Short)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>Hiển thị mỗi trang:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-main)] font-mono"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Bảng Chi Tiết Toàn Bộ Lệnh */}
        {filteredTrades.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-color)]">
            Không tìm thấy lệnh nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] uppercase text-[10px] font-bold tracking-wider border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Vị Thế</th>
                  <th className="px-3 py-2.5">Thời Gian Vào → Thoát</th>
                  <th className="px-3 py-2.5 text-right">Giá Vào</th>
                  <th className="px-3 py-2.5 text-right">Giá Thoát</th>
                  <th className="px-3 py-2.5">Lý Do Đóng Lệnh</th>
                  <th className="px-3 py-2.5 text-right">Lợi Nhuận (%)</th>
                  <th className="px-3 py-2.5 text-center">Kết Quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {paginatedTrades.map((t, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isWin = t.pnlPct >= 0;
                  return (
                    <tr key={idx} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                      <td className="px-3 py-2.5 text-[var(--text-muted)]">#{globalIdx}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          t.type === 'Long'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {t.type === 'Long' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-main)] font-mono text-[11px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <span className="text-[9px] uppercase px-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-sans font-bold">Vào</span>
                            {t.entryTime || t.time}
                          </span>
                          <span className="text-[var(--text-muted)] text-[10px] flex items-center gap-1.5">
                            <span className="text-[9px] uppercase px-1 rounded bg-white/5 text-[var(--text-muted)] border border-white/10 font-sans font-semibold">Thoát</span>
                            {t.exitTime || t.time}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-[var(--text-main)]">
                        {t.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-[var(--text-main)]">
                        {t.exitPrice.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 font-sans text-[11px]">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[var(--text-muted)] border border-white/10">
                          {t.reason}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWin ? `+${t.pnlPct.toFixed(2)}%` : `${t.pnlPct.toFixed(2)}%`}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isWin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-sans">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Thắng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 font-sans">
                            <XCircle className="w-3.5 h-3.5" /> Thua
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Thanh Phân Trang (Pagination) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-muted)]">
            <span>
              Trang <strong>{currentPage}</strong> / {totalPages} (Tổng {filteredTrades.length} lệnh)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-card-hover)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-card-hover)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
