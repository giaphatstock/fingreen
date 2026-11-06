import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { User, Mail, Building2, Phone, Save, Loader2, Shield } from 'lucide-react'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
    company_description: profile?.company_description || '',
  })

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('profiles').update({
      ...form,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)
    setLoading(false)
    if (error) toast.error('Lỗi cập nhật: ' + error.message)
    else {
      await refreshProfile()
      toast.success('Đã cập nhật hồ sơ!')
    }
  }

  const ROLE_LABEL = {
    admin_fingreen: 'Admin FinGreen',
    doi_tac: 'Đối Tác IB',
    cong_tac_vien: 'Cộng Tác Viên',
    guest: 'Thành Viên',
  }
  const ROLE_BADGE = {
    admin_fingreen: 'badge-purple',
    doi_tac: 'badge-green',
    cong_tac_vien: 'badge-yellow',
    guest: 'badge-gray',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gradient mb-6">Hồ Sơ Của Tôi</h1>

      {/* Profile card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-black text-white">
              {profile?.full_name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">{profile?.full_name || 'Chưa cập nhật'}</h2>
            <p className="text-sm text-gray-500 mb-1">{profile?.email}</p>
            <div className="flex items-center gap-2">
              <span className={`${ROLE_BADGE[profile?.role] || 'badge-gray'} text-xs`}>
                {ROLE_LABEL[profile?.role] || 'Thành Viên'}
              </span>
              {profile?.is_approved && (
                <span className="badge-green text-xs">✓ Đã Duyệt</span>
              )}
              {profile?.is_banned && (
                <span className="badge-red text-xs">🔒 Bị Khóa</span>
              )}
            </div>
          </div>
        </div>

        {/* Ban notice */}
        {profile?.is_banned && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl mb-4 text-sm text-red-300">
            <p className="font-semibold">Tài khoản bị khóa</p>
            {profile.ban_reason && <p className="text-xs mt-1 text-red-400">Lý do: {profile.ban_reason}</p>}
          </div>
        )}

        {/* Info stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-800/50 rounded-xl mb-6">
          <div className="text-center">
            <p className="text-xs text-gray-500">Ngày Tham Gia</p>
            <p className="text-sm font-semibold text-gray-300">
              {new Date(profile?.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="text-center border-x border-gray-700">
            <p className="text-xs text-gray-500">Vai Trò</p>
            <p className="text-sm font-semibold text-gray-300">{ROLE_LABEL[profile?.role]}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Trạng Thái</p>
            <p className={`text-sm font-semibold ${profile?.is_approved ? 'text-green-400' : 'text-yellow-400'}`}>
              {profile?.is_approved ? 'Hoạt Động' : 'Chờ Duyệt'}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Họ và Tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" name="full_name"
                value={form.full_name} onChange={handleChange}
                className="input-field pl-10" placeholder="Nguyễn Văn A"
              />
            </div>
          </div>
          <div>
            <label className="label">Email <span className="text-gray-600 font-normal">(không thể thay đổi)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email" value={profile?.email || ''} disabled
                className="input-field pl-10 opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="label">Số Điện Thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="tel" name="phone"
                value={form.phone} onChange={handleChange}
                className="input-field pl-10" placeholder="0901 234 567"
              />
            </div>
          </div>
          <div>
            <label className="label">Công Ty / Tổ Chức</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" name="company_name"
                value={form.company_name} onChange={handleChange}
                className="input-field pl-10" placeholder="Công ty Chứng Khoán ABC"
              />
            </div>
          </div>
          <div>
            <label className="label">Giới Thiệu</label>
            <textarea
              name="company_description"
              value={form.company_description} onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Mô tả về bản thân hoặc doanh nghiệp..."
            />
          </div>
          <button type="submit" disabled={loading || profile?.is_banned}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu Thay Đổi
          </button>
        </form>
      </div>
    </div>
  )
}
