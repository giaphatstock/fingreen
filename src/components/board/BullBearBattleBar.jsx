import React from 'react';
import { formatNumber } from '../../services/liveBoardService';
import { Swords, Flame, ShieldAlert, Zap } from 'lucide-react';

/**
 * Thanh Chiến Đấu Bò vs Gấu (Bull vs Bear Battle Bar)
 * Hiển thị tương quan sức mạnh thị trường thời gian thực dựa trên Tổng Dư Mua vs Tổng Dư Bán
 * Thiết kế phong cách RGB Gaming/Fintech Neon Glow đẳng cấp
 */
export default function BullBearBattleBar({ stats }) {
  const { totalBidVol, totalAskVol, bullPercent, bearPercent, diff, dominant } = stats;

  return (
    <div className="flex-shrink-0 relative rounded-xl border border-neutral-700/60 bg-gradient-to-r from-[#0d1f18] via-[#11131a] to-[#250d12] p-2 sm:px-3 sm:py-1.5 shadow-xl overflow-hidden group">
      {/* Hiệu ứng viền RGB Neon nhẹ */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-rose-500/10 pointer-events-none" />

      {/* Dòng thông số trên: Bò - Clash Badge - Gấu */}
      <div className="relative z-10 flex items-center justify-between text-xs mb-1.5 gap-2 select-none">
        {/* Phe Bò (Dư Mua) */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base sm:text-lg animate-bounce drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]">🐂</span>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black text-[11px] sm:text-xs tracking-wider text-emerald-400 uppercase drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
                Phe Bò (Dư Mua)
              </span>
              <span className="font-mono tabular-nums font-black text-xs sm:text-sm text-emerald-300">
                {bullPercent}%
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono tabular-nums">
              {formatNumber(totalBidVol)} CP
            </div>
          </div>
        </div>

        {/* Điểm giao tranh trung tâm (Clash Status) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {dominant === 'BULL' ? (
            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse">
              <Flame className="w-3 h-3 text-emerald-400 fill-current" />
              <span>Bò Áp Đảo (+{Math.abs(diff)}%)</span>
            </div>
          ) : dominant === 'BEAR' ? (
            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse">
              <Flame className="w-3 h-3 text-rose-400 fill-current" />
              <span>Gấu Đè Bán (+{Math.abs(diff)}%)</span>
            </div>
          ) : (
            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <Swords className="w-3 h-3 text-amber-300" />
              <span>Giằng Co Quyết Liệt</span>
            </div>
          )}
        </div>

        {/* Phe Gấu (Dư Bán) */}
        <div className="flex items-center justify-end gap-1.5 min-w-0 text-right">
          <div>
            <div className="flex items-center justify-end gap-1">
              <span className="font-mono tabular-nums font-black text-xs sm:text-sm text-rose-300">
                {bearPercent}%
              </span>
              <span className="font-black text-[11px] sm:text-xs tracking-wider text-rose-400 uppercase drop-shadow-[0_0_6px_rgba(251,113,133,0.5)]">
                Phe Gấu (Dư Bán)
              </span>
            </div>
            <div className="text-[10px] text-rose-400/80 font-mono tabular-nums">
              {formatNumber(totalAskVol)} CP
            </div>
          </div>
          <span className="text-base sm:text-lg animate-bounce drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">🐻</span>
        </div>
      </div>

      {/* THANH BATTLE RGB ANIMATED SLIDER */}
      <div className="relative w-full h-2.5 sm:h-3 rounded-full bg-neutral-900 border border-neutral-700/80 overflow-hidden flex shadow-inner">
        {/* Phần Phe Bò (Xanh Emerald RGB Neon) */}
        <div
          className="h-full bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-400 transition-all duration-700 ease-out relative shadow-[0_0_12px_rgba(52,211,153,0.8)]"
          style={{ width: `${bullPercent}%` }}
        >
          {/* Shimmer animation */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
        </div>

        {/* Điểm xung đột trung tâm (Laser Divider) */}
        <div className="w-1 h-full bg-white shadow-[0_0_8px_#ffffff] z-10 -ml-0.5" />

        {/* Phần Phe Gấu (Đỏ Crimson RGB Neon) */}
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 transition-all duration-700 ease-out relative shadow-[0_0_12px_rgba(244,63,94,0.8)]"
          style={{ width: `${bearPercent}%` }}
        >
          {/* Shimmer animation */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
