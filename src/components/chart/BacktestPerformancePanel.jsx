import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, Percent, Award, ArrowUpRight, ArrowDownRight, History, Layers } from 'lucide-react';

export default function BacktestPerformancePanel({
  stats = {},
  trades = [],
  symbol = 'FPT'
}) {
  const [showHistory, setShowHistory] = useState(false);

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

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              Hiệu Suất Chiến Lược GreenSmartOne
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                MÃ {symbol}
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">Kiểm thử tự động theo chu kỳ nến & bộ quy tắc cắt lỗ/chốt lời</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] transition-colors"
          >
            <History className="w-3.5 h-3.5 text-primary-400" />
            <span>{showHistory ? 'Ẩn Lịch Sử Lệnh' : `Chi Tiết ${trades.length} Lệnh`}</span>
          </button>
        </div>
      </div>

      {/* Grid thẻ số liệu thống kê */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {/* Win Rate */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Tỷ Lệ Thắng (Winrate)</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-400 font-mono">{winRate}%</span>
            <span className="text-[10px] text-[var(--text-muted)]">({wins}W / {losses}L)</span>
          </div>
        </div>

        {/* Tổng PnL */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Lợi Nhuận Giả Lập</span>
            {isPnlPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-xl font-extrabold font-mono ${isPnlPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPnlPositive ? `+${totalPnl}%` : `${totalPnl}%`}
            </span>
          </div>
        </div>

        {/* Tổng Số Lệnh */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Tổng Số Lệnh Đã Chốt</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-cyan-300 font-mono">{totalTrades}</span>
            <span className="text-[10px] text-[var(--text-muted)]">lệnh</span>
          </div>
        </div>

        {/* Trạng Thái Vị Thế Hiện Tại */}
        <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Vị Thế Đang Nắm Giữ</span>
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

      {/* Danh sách lịch sử lệnh nếu bật */}
      {showHistory && (
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] animate-fade-in">
          <h4 className="text-xs font-bold text-[var(--text-main)] mb-2.5 flex items-center gap-1.5">
            <History className="w-4 h-4 text-primary-400" />
            Nhật Ký Các Lệnh Đã Thực Hiện ({trades.length})
          </h4>

          {trades.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">Chưa có lệnh nào được hoàn tất trong chu kỳ quan sát.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {trades.slice().reverse().map((trade, idx) => {
                const isWin = trade.pnlPct >= 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`p-1.5 rounded-lg ${
                        trade.type === 'Long'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {trade.type === 'Long' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-main)]">{trade.type}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">({trade.time})</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/20">
                            {trade.reason === 'SL' ? 'Cắt lỗ (SL)' : 'Đổi màu nến (ColorFlip)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Vào: <strong className="font-mono text-[var(--text-main)]">{trade.entryPrice.toFixed(2)}</strong> → 
                          Ra: <strong className="font-mono text-[var(--text-main)]">{trade.exitPrice.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWin ? `+${trade.pnlPct.toFixed(2)}%` : `${trade.pnlPct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
