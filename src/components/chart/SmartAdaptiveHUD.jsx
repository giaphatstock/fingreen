import React, { useState } from 'react';
import { Zap, ChevronUp, ChevronDown, Award, ShieldCheck, ShieldAlert, X } from 'lucide-react';

export default function SmartAdaptiveHUD({
  candSensTable = [],
  finalEffSens = 2.0,
  bestSens = 1.6,
  recalibCnt = 0,
  isSmartAdaptive = true,
  isLicActive = true
}) {
  const [collapsed, setCollapsed] = useState(true); // ⚡ Mặc định thu gọn nhỏ để không che nến

  return (
    <div className="absolute top-3 left-3 z-20 pointer-events-auto transition-all duration-200">
      <div className="rounded-2xl backdrop-blur-xl bg-slate-950/90 border border-white/10 shadow-2xl p-2 max-w-xs text-xs text-slate-200 select-none">
        {/* Header HUD / Thanh Thu Gọn */}
        <div
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <div className="flex items-center gap-1.5 font-bold tracking-wider text-[11px] text-cyan-300">
              <span>SmartAdaptive™</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                Sens {finalEffSens.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400 hidden sm:inline">
              {collapsed ? 'Xem bảng 7 Sens' : 'Đóng'}
            </span>
            <span className="p-1 rounded-lg bg-white/5 text-slate-400">
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </span>
          </div>
        </div>

        {/* Nội dung bảng 7 Candidates khi mở rộng */}
        {!collapsed && isSmartAdaptive && (
          <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 px-1">
              <span>Mức</span>
              <span className="text-center">Sens</span>
              <span className="text-center">Thắng/Thua</span>
              <span className="text-right">Điểm</span>
            </div>

            <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
              {candSensTable.map((row) => (
                <div
                  key={row.idx}
                  className={`grid grid-cols-4 gap-1 items-center px-1.5 py-1 rounded-lg text-[10px] transition-colors ${
                    row.isBest
                      ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-200 font-bold shadow-sm'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {row.isBest ? (
                      <span className="flex items-center text-amber-300 font-bold">
                        <Award className="w-3 h-3 inline mr-0.5" /> BEST
                      </span>
                    ) : (
                      `#${row.idx}`
                    )}
                  </span>
                  <span className="text-center font-mono font-semibold">{row.sens.toFixed(1)}</span>
                  <span className="text-center font-mono text-[9.5px]">
                    {row.wins}/{row.losses} ({row.winRate}%)
                  </span>
                  <span className="text-right font-mono font-bold text-cyan-300">{row.score}</span>
                </div>
              ))}
            </div>

            {/* Dòng tóm tắt chân bảng */}
            <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-1 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-400 block text-[8.5px]">Sens Đang Dùng</span>
                <span className="font-bold text-emerald-400 font-mono text-xs">{finalEffSens.toFixed(2)}</span>
              </div>
              <div className="p-1 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-400 block text-[8.5px]">Chu Kỳ Học</span>
                <span className="font-bold text-cyan-300 font-mono text-xs">{recalibCnt} lần</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
