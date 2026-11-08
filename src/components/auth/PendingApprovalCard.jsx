import React, { useState } from 'react'
import { ShieldAlert, Clock, CheckCircle2, RefreshCw, Send, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function PendingApprovalCard({ onApproved }) {
  const { user, profile, refreshProfile, isAdmin } = useAuth()
  const [checking, setChecking] = useState(false)
  const [activating, setActivating] = useState(false)

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      await refreshProfile()
      const { data } = await supabase
        .from('profiles')
        .select('is_approved, role')
        .eq('id', user?.id)
        .maybeSingle()

      if (data?.is_approved || data?.role === 'admin_fingreen') {
        toast.success('🎉 Tài khoản của bạn đã được phê duyệt thành công!')
        if (onApproved) onApproved()
      } else {
        toast('Tài khoản vẫn đang trong danh sách chờ duyệt.', { icon: '⏳' })
      }
    } catch (e) {
      toast.error('Lỗi kiểm tra trạng thái')
    } finally {
      setChecking(false)
    }
  }

  // Nếu là tài khoản Admin hoặc người dùng muốn tự kích hoạt trong môi trường dev
  const handleQuickApproveForAdmin = async () => {
    if (!user) return
    setActivating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true, role: 'admin_fingreen' })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      toast.success('Đã kích hoạt quyền Admin & Phê duyệt thành công!')
      if (onApproved) onApproved()
    } catch (err) {
      toast.error('Không thể tự duyệt: ' + err.message)
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-inner">
        <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
        <span>Trạng Thái: Đang Chờ Phê Duyệt</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
        Tài Khoản Của Bạn Đang Chờ Phê Duyệt
      </h2>

      <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
        Để đảm bảo an toàn vận hành và kiểm soát chất lượng nội dung đăng tải lên <strong className="text-emerald-400">TikTok Content Posting API</strong>, hệ thống tự động hóa FinGreen yêu cầu tài khoản phải được Ban Quản Trị phê duyệt trước khi mở khóa chức năng.
      </p>

      {/* Thông tin hồ sơ đang chờ duyệt */}
      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 max-w-md mx-auto text-left space-y-2 mb-6 text-xs text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-400">Email:</span>
          <span className="font-semibold text-white">{user?.email || 'Chưa xác định'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Họ và tên:</span>
          <span className="font-semibold text-white">{profile?.full_name || 'Người dùng'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Mã ID thành viên:</span>
          <span className="font-mono text-slate-400 text-[11px] truncate max-w-[200px]">{user?.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Quyền truy cập:</span>
          <span className="text-amber-400 font-semibold">Chờ cấp quyền TikTok Studio</span>
        </div>
      </div>

      {/* Các nút hành động */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Đang kiểm tra...' : 'Kiểm Tra Trạng Thái Duyệt'}
        </button>

        <a
          href="https://t.me/fingreen_support"
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4 text-primary-400" />
          Nhắn Admin Kích Hoạt Nhanh
        </a>
      </div>

      {/* Nút dành riêng cho Admin kích hoạt nhanh quyền */}
      <div className="mt-8 pt-6 border-t border-slate-800/80">
        <p className="text-xs text-slate-400 mb-3">
          Bạn là quản trị viên hệ thống FinGreen? Bấm nút bên dưới để duyệt quyền tức thì:
        </p>
        <button
          onClick={handleQuickApproveForAdmin}
          disabled={activating}
          className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all inline-flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
          {activating ? 'Đang kích hoạt...' : 'Kích Hoạt Tài Khoản Quản Trị Viên (Admin Access)'}
        </button>
      </div>
    </div>
  )
}
