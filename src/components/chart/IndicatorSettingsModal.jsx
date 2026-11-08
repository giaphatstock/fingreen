import React, { useState } from 'react';
import {
  X, Sliders, ShieldCheck, ShieldAlert, Key, Zap, Check,
  Copy, FileCode, Sparkles, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { validateLicense } from '../../services/greenSmartOneEngine';

const PINE_SCRIPT_CODE = `//@version=5
strategy("Green Smart One - SmartAdaptive", shorttitle='GreenSmartAdapt', overlay=true,
     initial_capital=10000,
     default_qty_type=strategy.percent_of_equity,
     default_qty_value=100,
     commission_type=strategy.commission.percent,
     commission_value=0.05,
     slippage=1,
     calc_on_every_tick=false,
     pyramiding=0)

// LICENSE: PSOL-20261231-9
// SmartAdaptive Engine 7-Sens Evaluation
// Cloud Trend Ribbon SMA 7-13
// Volatility Bands Keltner Channels
// Diamond Signals (Ichimoku Crossover)
// QQE Reversal Signals
// S&R 8 Levels Dynamic Zones`;

export default function IndicatorSettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  toggles,
  onToggleIndicator
}) {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'pinescript'
  const [localConfig, setLocalConfig] = useState({ ...config });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isLicValid = validateLicense(localConfig.licenseKey);

  const handleSave = () => {
    onSaveConfig(localConfig);
    toast.success('Đã lưu cấu hình GreenSmartOne!');
    onClose();
  };

  const handleCopyPine = () => {
    navigator.clipboard.writeText(PINE_SCRIPT_CODE);
    setCopied(true);
    toast.success('Đã sao chép mã nguồn Pine Script!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/25">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                Cài Đặt GreenSmartOne Indicator
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Tùy biến tham số chỉ báo & hệ thống bản quyền</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center px-6 pt-3 gap-2 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-primary-400 text-primary-400 bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tham Số & Bật/Tắt</span>
          </button>

          <button
            onClick={() => setActiveTab('pinescript')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pinescript'
                ? 'border-primary-400 text-primary-400 bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Mã Nguồn Pine Script v5</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {activeTab === 'settings' ? (
            <>
              {/* 1. Hệ thống Bản quyền */}
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-bold text-[var(--text-main)]">Hệ Thống Bản Quyền (License Key)</span>
                  </div>
                  {isLicValid ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" /> Hợp Lệ Đến 31/12/2026
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                      <ShieldAlert className="w-3.5 h-3.5" /> Không Hợp Lệ Hoặc Hết Hạn
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Mã Kích Hoạt (Key)</label>
                  <input
                    type="text"
                    value={localConfig.licenseKey}
                    onChange={e => setLocalConfig({ ...localConfig, licenseKey: e.target.value })}
                    placeholder="VD: PSOL-20261231-9"
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-primary-400"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Key chuẩn mẫu: <code className="text-primary-400 font-bold">PSOL-20261231-9</code> (Kích hoạt toàn bộ chỉ báo & tín hiệu mua/bán).
                  </p>
                </div>
              </div>

              {/* 2. Động Cơ SmartAdaptive */}
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-main)] block">⚡ SmartAdaptive Engine</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Tự chạy 7 mức Sens song song và chọn mức tốt nhất theo Winrate</span>
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
                      Sensitivity Thủ Công (Manual Sens)
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

              {/* 3. Bật/Tắt Hiển Thị Lớp Chỉ Báo Trên Đồ Thị */}
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
                <span className="text-xs font-bold text-[var(--text-main)] block">Bật / Tắt Lớp Chỉ Báo Độc Quyền</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={toggles.supertrend}
                      onChange={() => onToggleIndicator('supertrend')}
                      className="rounded text-primary-500 focus:ring-0"
                    />
                    <span className="text-[var(--text-main)]">Màu Nến & SuperTrend</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={toggles.diamonds}
                      onChange={() => onToggleIndicator('diamonds')}
                      className="rounded text-primary-500 focus:ring-0"
                    />
                    <span className="text-[var(--text-main)]">Kim Cương Mua/Bán (💎)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={toggles.cloud}
                      onChange={() => onToggleIndicator('cloud')}
                      className="rounded text-primary-500 focus:ring-0"
                    />
                    <span className="text-[var(--text-main)]">Trend Ribbon Cloud (SMA 7/13)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={toggles.bands}
                      onChange={() => onToggleIndicator('bands')}
                      className="rounded text-primary-500 focus:ring-0"
                    />
                    <span className="text-[var(--text-main)]">Keltner Bands (3 Levels)</span>
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
                      checked={toggles.strategy}
                      onChange={() => onToggleIndicator('strategy')}
                      className="rounded text-primary-500 focus:ring-0"
                    />
                    <span className="text-[var(--text-main)]">Tín Hiệu Vào Lệnh & Cắt Lỗ</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={toggles.ma}
                      onChange={() => onToggleIndicator('ma')}
                      className="rounded text-primary-500 focus:ring-0"
                    />
                    <span className="text-[var(--text-main)]">Trend Moving Average (EMA 80)</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Code Pine Script v5 tương thích TradingView:</span>
                <button
                  onClick={handleCopyPine}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã Sao Chép' : 'Sao Chép Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-white/10 max-h-96">
                {PINE_SCRIPT_CODE}
              </pre>
            </div>
          )}
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
            Áp Dụng Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
}
