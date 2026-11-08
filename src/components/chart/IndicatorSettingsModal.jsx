import React, { useState } from 'react';
import {
  X, Sliders, ShieldCheck, ShieldAlert, Zap,
  PhoneCall, ExternalLink, Calendar, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IndicatorSettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  toggles,
  onToggleIndicator,
  expiresAt = null,
  isLicActive = true
}) {
  const [localConfig, setLocalConfig] = useState({ ...config });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    toast.success('Đã áp dụng cấu hình GreenSmartOne!');
    onClose();
  };

  // Tính số ngày sử dụng còn lại
  const expiryDate = expiresAt ? new Date(expiresAt) : new Date('2026-12-31T23:59:59Z');
  const now = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const isExpired = diffDays <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/25">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                Cài Đặt GreenSmartOne & Bản Quyền
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Thông tin gói dịch vụ & tùy chỉnh tham số hiển thị</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {/* 1. THẺ THÔNG TIN GÓI BẢN QUYỀN (Không còn ô nhập key lộn xộn) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Gói GreenSmartOne VIP PRO
                  </h4>
                  <p className="text-[10px] text-slate-400">Hệ thống thuật toán SmartAdaptive AI độc quyền</p>
                </div>
              </div>

              {!isExpired && isLicActive ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Đang Hoạt Động
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Đã Hết Hạn
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Ngày Hết Hạn Gói</span>
                <span className="font-bold text-cyan-300 font-mono text-sm">
                  {expiryDate.toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-400 block mb-0.5">Thời Gian Còn Lại</span>
                <span className={`font-bold font-mono text-sm ${diffDays > 15 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {diffDays > 0 ? `${diffDays} ngày` : '0 ngày'}
                </span>
              </div>
            </div>

            {/* Hỗ trợ gia hạn */}
            <div className="pt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Liên hệ gia hạn / nâng cấp gói:</span>
              <a
                href="https://zalo.me/0764894250"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Zalo: 0764.894.250</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2. ĐỘNG CƠ SMARTADAPTIVE */}
          <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">⚡ SmartAdaptive™ Engine</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Tự động chấm điểm 7 mức Sens theo Winrate thực tế</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.smartAdaptive}
                  onChange={e => setLocalConfig({ ...localConfig, smartAdaptive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {!localConfig.smartAdaptive ? (
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                  Độ Nhạy Thủ Công (Manual Sensitivity)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localConfig.sensManual}
                  onChange={e => setLocalConfig({ ...localConfig, sensManual: parseFloat(e.target.value) || 2.0 })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-main)]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block mb-1">Tốc độ quên (learnRate)</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="0.99"
                    value={localConfig.learnRate}
                    onChange={e => setLocalConfig({ ...localConfig, learnRate: parseFloat(e.target.value) || 0.90 })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-mono text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block mb-1">Chu kỳ Recalibrate (nến)</span>
                  <input
                    type="number"
                    min="5"
                    value={localConfig.recalibBars}
                    onChange={e => setLocalConfig({ ...localConfig, recalibBars: parseInt(e.target.value, 10) || 10 })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-mono text-[var(--text-main)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. BẬT/TẮT LỚP CHỈ BÁO HIỂN THỊ */}
          <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
            <span className="text-xs font-bold text-[var(--text-main)] block">Tùy Chỉnh Các Lớp Chỉ Báo Hiển Thị</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles.diamonds}
                  onChange={() => onToggleIndicator('diamonds')}
                  className="rounded text-primary-500 focus:ring-0"
                />
                <span className="text-[var(--text-main)]">Kim Cương (💎)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles.qqe}
                  onChange={() => onToggleIndicator('qqe')}
                  className="rounded text-primary-500 focus:ring-0"
                />
                <span className="text-[var(--text-main)]">Đảo Chiều QQE (❖)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles.cloud}
                  onChange={() => onToggleIndicator('cloud')}
                  className="rounded text-primary-500 focus:ring-0"
                />
                <span className="text-[var(--text-main)]">Trend Ribbon Cloud</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles.bands}
                  onChange={() => onToggleIndicator('bands')}
                  className="rounded text-primary-500 focus:ring-0"
                />
                <span className="text-[var(--text-main)]">Keltner Bands</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles.sr}
                  onChange={() => onToggleIndicator('sr')}
                  className="rounded text-primary-500 focus:ring-0"
                />
                <span className="text-[var(--text-main)]">Hỗ Trợ & Kháng Cự (S&R)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 transition-all"
          >
            Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
}
