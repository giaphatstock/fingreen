import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, ShieldAlert, ArrowLeft, Home, Sparkles, Activity } from 'lucide-react';

export default function MaintenanceNotice({ tab, isAdmin = false, children }) {
  if (!tab || !tab.is_maintenance) {
    return children || null;
  }

  // Nếu là Admin, cho phép xem nội dung kèm theo banner cảnh báo trên đỉnh
  if (isAdmin && children) {
    return (
      <div className="relative">
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-4 py-2 text-xs font-semibold flex items-center justify-between z-40 sticky top-16">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>CHẾ ĐỘ BẢO TRÌ ĐANG BẬT:</strong> Người dùng thông thường sẽ không xem được trang này ({tab.name}). Bạn đang xem với quyền Admin.
            </span>
          </div>
          <Link to="/admin" className="underline hover:text-white text-[11px] font-bold">
            Quản trị Tab &rarr;
          </Link>
        </div>
        {children}
      </div>
    );
  }

  const estimatedDate = tab.maintenance_estimated_end 
    ? new Date(tab.maintenance_estimated_end)
    : null;

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
        {/* Glow hiệu ứng nền */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Biểu tượng bảo trì Neon */}
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            <Wrench className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-950 border border-slate-700 text-amber-400 shadow-md">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Tên Tab / Tính Năng */}
        <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">
          {tab.name || 'Tính Năng'}
        </div>

        {/* Tiêu đề bảo trì */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
          {tab.maintenance_title || 'Hệ Thống Đang Được Bảo Trì Nâng Cấp'}
        </h2>

        {/* Nội dung thông báo */}
        <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto mb-6">
          {tab.maintenance_message || 'Tính năng này đang được chúng tôi tạm ngừng để tiến hành nâng cấp hạ tầng và tối ưu hóa trải nghiệm tốt nhất cho quý nhà đầu tư.'}
        </p>

        {/* Thời gian hoàn tất dự tính */}
        {estimatedDate && !isNaN(estimatedDate.getTime()) && (
          <div className="mb-6 p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-amber-300 inline-flex flex-col sm:flex-row items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Dự kiến hoàn thành:</span>
            </div>
            <span className="font-bold text-white px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
              {estimatedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {estimatedDate.toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}

        {/* Lời cảm ơn sự kiên nhẫn */}
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 mb-6 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
          <span>FinGreen chân thành cảm ơn sự kiên nhẫn và đồng hành của bạn!</span>
        </div>

        {/* Nút điều hướng */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Về Trang Chủ</span>
          </Link>
          <Link
            to="/bang-dien"
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Xem Bảng Điện Live</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
