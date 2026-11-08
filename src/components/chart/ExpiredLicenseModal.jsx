import React from 'react';
import { Lock, PhoneCall, ExternalLink, ShieldAlert, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExpiredLicenseModal({
  isOpen = true,
  expiresAt = null,
  userName = 'Quý Nhà Đầu Tư'
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const expiryText = expiresAt ? new Date(expiresAt).toLocaleDateString('vi-VN') : 'chưa được kích hoạt';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-white relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>

        {/* Icon Khóa Bản Quyền Sang Trọng */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center mb-5 shadow-inner">
          <Lock className="w-8 h-8 text-emerald-400 animate-pulse" />
        </div>

        {/* Tiêu Đề */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" /> GÓI DỊCH VỤ ĐÃ HẾT HẠN
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Thông Báo Hạn Dùng GreenSmartOne
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Kính gửi <strong className="text-emerald-300 font-semibold">{userName}</strong>,<br />
          Quyền truy cập bộ công cụ tín hiệu chuyên sâu <strong className="text-cyan-300">GreenSmartOne (SmartAdaptive AI)</strong> của bạn đã kết thúc (<span className="text-rose-400 font-semibold">{expiryText}</span>).
        </p>

        {/* Hộp Thông Tin Quyền Lợi */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-xs space-y-2 mb-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quyền lợi khi gia hạn gói:
          </p>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Biểu đồ thời gian thực bám sát dòng tiền 3 sàn HOSE, HNX, UPCoM</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Tự động chấm điểm 7 mức Sensitivity & phát hiện điểm mua Kim Cương (💎)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Cảnh báo đảo chiều QQE (❖) và quản trị rủi ro cắt lỗ kỷ luật</span>
          </div>
        </div>

        {/* Thông Tin Liên Hệ Chuyên Gia */}
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Chuyên Gia Hỗ Trợ 24/7</p>
            <p className="text-xs font-bold text-white">Gia Phát (Admin FinGreen)</p>
          </div>
          <a
            href="tel:0764894250"
            className="text-sm font-extrabold text-emerald-400 font-mono tracking-wide hover:underline"
          >
            0764.894.250
          </a>
        </div>

        {/* Cụm Nút Hành Động */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href="https://zalo.me/0764894250"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02]"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Liên Hệ Zalo 0764.894.250</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
