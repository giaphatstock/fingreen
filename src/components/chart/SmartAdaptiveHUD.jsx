import React, { useState } from 'react';
import { Zap, ChevronUp, ChevronDown, Award, Check, Sparkles, Sliders } from 'lucide-react';

export default function SmartAdaptiveHUD({
  candSensTable = [],
  finalEffSens = 2.0,
  bestSens = 1.6,
  recalibCnt = 0,
  isSmartAdaptive = true,
  isLicActive = true,
  currentSens = 2.0,
  onSelectSens,
  onToggleAutoMode
}) {
  const [collapsed, setCollapsed] = useState(false); // Mở sẵn hoặc người dùng thu gọn tùy ý

  const candList = candSensTable.length > 0 ? candSensTable : [
    { idx: 1, sens: 1.3, isBest: false },
    { idx: 2, sens: 1.6, isBest: true },
    { idx: 3, sens: 2.0, isBest: false },
    { idx: 4, sens: 2.4, isBest: false },
    { idx: 5, sens: 2.8, isBest: false },
    { idx: 6, sens: 3.2, isBest: false },
    { idx: 7, sens: 3.8, isBest: false },
  ];

  const activeSensVal = isSmartAdaptive ? bestSens : currentSens;

  return (
    <div className="absolute top-3 left-3 z-20 pointer-events-auto transition-all duration-200">
      <div className="rounded-2xl backdrop-blur-xl bg-slate-950/92 border border-white/10 shadow-2xl p-2.5 w-72 text-xs text-slate-200 select-none">
        {/* Header HUD / Thanh Thu Gọn */}
        <div
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <span className={`p-1 rounded-lg ${isSmartAdaptive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
              <Zap className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <div className="flex items-center gap-1.5 font-bold tracking-wider text-[11px] text-cyan-300">
              <span>SmartAdaptive™</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                Sens {activeSensVal.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-400">
              {collapsed ? 'Mở Sens' : 'Đóng'}
            </span>
            <span className="p-1 rounded-lg bg-white/5 text-slate-400">
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </span>
          </div>
        </div>

        {/* Bảng chọn Độ Nhạy (Sens) khi mở rộng */}
        {!collapsed && (
          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-2">
            {/* Chế độ Tự Động vs Thủ Công */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => onToggleAutoMode && onToggleAutoMode()}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  isSmartAdaptive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Tự Động (AI)</span>
              </button>
              <div className="text-[10px] text-slate-400 px-1 font-mono">
                {isSmartAdaptive ? (
                  <span className="text-emerald-400 font-bold">BEST: {bestSens.toFixed(1)}</span>
                ) : (
                  <span className="text-cyan-300 font-bold">Sens: {currentSens.toFixed(1)}</span>
                )}
              </div>
            </div>

            {/* Tiêu đề bảng - Chỉ còn Mức và Độ Nhạy (Đã bỏ Thắng/Thua và Điểm theo yêu cầu) */}
            <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-white/5 rounded-lg">
              <span className="col-span-3">Mức</span>
              <span className="col-span-4 text-center">Độ Nhạy</span>
              <span className="col-span-5 text-right">Trạng Thái</span>
            </div>

            {/* Danh sách 7 mức Sens cho phép click để đổi trực tiếp trên chart */}
            <div className="space-y-1">
              {candList.map((row) => {
                const isThisBest = row.sens === bestSens || row.isBest;
                const isSelected = (!isSmartAdaptive && row.sens === currentSens) || (isSmartAdaptive && isThisBest);

                return (
                  <button
                    key={row.idx}
                    type="button"
                    onClick={() => onSelectSens && onSelectSens(row.sens)}
                    className={`w-full grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-xl text-[10px] transition-all text-left ${
                      isSelected
                        ? 'bg-emerald-500/25 border border-emerald-500/60 text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-500/30'
                        : 'hover:bg-white/10 border border-transparent text-slate-300'
                    }`}
                  >
                    {/* Cột 1: Mức */}
                    <span className="col-span-3 font-mono text-slate-400">
                      #{row.idx}
                    </span>

                    {/* Cột 2: Giá trị Sens */}
                    <span className="col-span-4 text-center font-mono font-bold text-xs text-white">
                      {row.sens.toFixed(1)}
                    </span>

                    {/* Cột 3: Trạng thái & Nút Chọn */}
                    <span className="col-span-5 flex items-center justify-end gap-1">
                      {isThisBest && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5 inline" /> BEST
                        </span>
                      )}
                      {isSelected ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Dùng
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 group-hover:text-cyan-300">
                          Chọn
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dòng tóm tắt chân bảng */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span>Đang áp dụng: <strong className="text-emerald-400 font-mono">{activeSensVal.toFixed(2)}</strong></span>
              <span>{isSmartAdaptive ? `Chu kỳ học: ${recalibCnt} lần` : 'Chế độ Thủ Công'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
