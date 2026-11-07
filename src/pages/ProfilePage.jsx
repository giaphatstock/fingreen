import React, { useState, useRef } from 'react'
import { supabase, uploadMedia } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  User, Mail, Building2, Phone, Save, Loader2, Shield,
  Camera, UploadCloud, CheckCircle
} from 'lucide-react'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
    company_description: profile?.company_description || '',
  })

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // Đăng tải ảnh avatar trực tiếp từ máy
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh đại diện tối đa là 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const publicUrl = await uploadMedia(file, 'avatars')

      // Cập nhật vào DB
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      await refreshProfile()
      toast.success('Đã cập nhật ảnh đại diện thành công!')
    } catch (err) {
      console.error(err)
      toast.error('Lỗi khi tải ảnh đại diện: ' + (err.message || 'Thử lại sau'))
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

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
      toast.success('Đã cập nhật thông tin hồ sơ!')
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
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 text-center sm:text-left">
          {/* Avatar với nút upload từ máy */}
          <div className="relative group">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile?.full_name || 'Avatar'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-500/50 shadow-lg group-hover:brightness-75 transition-all"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:brightness-75 transition-all">
                <span className="text-3xl font-black text-white">
                  {profile?.full_name?.charAt(0) || '?'}
                </span>
              </div>
            )}

            {/* Overlay nút camera tải ảnh */}
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
              title="Đổi ảnh đại diện từ máy tính"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary-300" />
              ) : (
                <>
                  <Camera className="w-6 h-6 mb-0.5 text-primary-300" />
                  <span className="text-[10px] font-semibold">Tải ảnh</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{profile?.full_name || 'Chưa cập nhật'}</h2>
            <p className="text-xs text-[var(--text-muted)] mb-2">{profile?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className={`${ROLE_BADGE[profile?.role] || 'badge-gray'} text-xs font-semibold`}>
                {ROLE_LABEL[profile?.role] || 'Thành Viên'}
              </span>
              {profile?.is_approved && (
                <span className="badge-green text-xs font-semibold">✓ Đã Phê Duyệt</span>
              )}
              {profile?.is_banned && (
                <span className="badge-red text-xs font-semibold">🔒 Đang Bị Khóa</span>
              )}
            </div>

            {/* Nút bấm tải ảnh cho người dùng mobile/dễ thấy */}
            <div className="mt-3">
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-sm"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-primary-400" />
                )}
                <span>Đổi ảnh đại diện từ máy tính</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ban notice */}
        {profile?.is_banned && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl mb-4 text-xs text-red-300">
            <p className="font-bold">Tài khoản của bạn đang bị khóa</p>
            {profile.ban_reason && <p className="mt-1">Lý do: {profile.ban_reason}</p>}
          </div>
        )}

        {/* Info stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--bg-subtle)] rounded-xl mb-6 border border-[var(--border-color)]">
          <div className="text-center">
            <p className="text-[11px] text-[var(--text-muted)]">Ngày Tham Gia</p>
            <p className="text-xs font-bold mt-0.5">
              {new Date(profile?.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="text-center border-x border-[var(--border-color)]">
            <p className="text-[11px] text-[var(--text-muted)]">Vai Trò</p>
            <p className="text-xs font-bold text-primary-400 mt-0.5">{ROLE_LABEL[profile?.role]}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-[var(--text-muted)]">Trạng Thái</p>
            <p className={`text-xs font-bold mt-0.5 ${profile?.is_approved ? 'text-green-400' : 'text-yellow-400'}`}>
              {profile?.is_approved ? 'Hoạt Động' : 'Chờ Duyệt'}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Họ và Tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text" name="full_name"
                value={form.full_name} onChange={handleChange}
                className="input-field pl-10 text-sm" placeholder="Nguyễn Văn A"
              />
            </div>
          </div>
          <div>
            <label className="label">Email <span className="text-[var(--text-muted)] font-normal">(không thể thay đổi)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email" value={profile?.email || ''} disabled
                className="input-field pl-10 opacity-50 cursor-not-allowed text-sm"
              />
            </div>
          </div>
          <div>
            <label className="label">Số Điện Thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="tel" name="phone"
                value={form.phone} onChange={handleChange}
                className="input-field pl-10 text-sm" placeholder="0901 234 567"
              />
            </div>
          </div>
          <div>
            <label className="label">Công Ty / Tổ Chức Chứng Khoán</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text" name="company_name"
                value={form.company_name} onChange={handleChange}
                className="input-field pl-10 text-sm" placeholder="Công ty Chứng Khoán..."
              />
            </div>
          </div>
          <div>
            <label className="label">Giới Thiệu Bản Thân</label>
            <textarea
              name="company_description"
              value={form.company_description} onChange={handleChange}
              rows={3}
              className="input-field resize-none text-sm"
              placeholder="Kinh nghiệm đầu tư, trường phái phân tích kỹ thuật hoặc cơ bản..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || profile?.is_banned}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu Thay Đổi
          </button>
        </form>
      </div>
    </div>
  )
}
