import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Handshake, CheckCircle, ArrowRight, Building2, Phone, Mail,
  User, FileText, Loader2, Star, TrendingUp, Shield, Zap, LogIn
} from 'lucide-react'

const BENEFITS = [
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Tiếp Cận Nhà Đầu Tư', desc: 'Chia sẻ góc nhìn phân tích đến hàng chục nghìn nhà đầu tư chứng khoán' },
  { icon: <Shield className="w-5 h-5" />, title: 'Khẳng Định Uy Tín', desc: 'Được bảo chứng thương hiệu chuyên gia bởi nền tảng FinGreen' },
  { icon: <Zap className="w-5 h-5" />, title: 'Công Cụ Chuyên Nghiệp', desc: 'Trình soạn thảo bài viết cao cấp, tích hợp 5 mẫu phân tích chuẩn Fintech' },
  { icon: <Star className="w-5 h-5" />, title: 'Cơ Hội Hợp Tác IB', desc: 'Mở rộng tệp khách hàng giao dịch chứng khoán bền vững' },
]

export default function PartnerPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
    role_requested: 'doi_tac',
    description: '',
  })

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Vui lòng đăng nhập trước khi nộp đơn hợp tác')
      return
    }
    if (!form.full_name || !form.email) {
      toast.error('Vui lòng điền đầy đủ họ tên và email')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('partner_applications').insert({
      user_id: user.id,
      ...form,
    })
    setLoading(false)
    if (error) {
      toast.error('Lỗi khi gửi đơn: ' + error.message)
    } else {
      toast.success('Đã gửi đơn thành công! FinGreen sẽ liên hệ bạn trong 24-48 giờ.')
      setSubmitted(true)
    }
  }

  const isPartner = profile?.role === 'doi_tac' || profile?.role === 'cong_tac_vien' || profile?.role === 'admin_fingreen'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-4 shadow-sm">
          <Handshake className="w-3.5 h-3.5" />
          Chương Trình Đối Tác & Cộng Tác Viên
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-3">
          Hợp Tác Phát Triển Cùng FinGreen
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Dành cho các chuyên gia phân tích kỹ thuật, Đối Tác IB (Broker) và Cộng Tác Viên tại các công ty chứng khoán (SSI, VPS, VNDIRECT, TCBS...). Hãy cùng FinGreen kiến tạo giá trị thực!
        </p>

        {/* Social channels */}
        <div className="flex items-center justify-center gap-3 mt-4 text-xs font-semibold">
          <a
            href="https://www.tiktok.com/@fingreenvn?_r=1&_t=ZS-9BCMKxpo7yT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-muted)] hover:text-primary-400 flex items-center gap-1"
          >
            TikTok: @fingreenvn
          </a>
          <span className="text-[var(--border-color)]">•</span>
          <a
            href="https://m.youtube.com/@greeninvestmentvn?si=-4DoUDMlBDVCRIOi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-muted)] hover:text-red-400 flex items-center gap-1"
          >
            YouTube: Green Investment
          </a>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {BENEFITS.map((b, i) => (
          <div key={i} className="card p-5 group hover:border-primary-500/40 transition-all text-center">
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary-400 group-hover:scale-110 transition-transform">
              {b.icon}
            </div>
            <h3 className="text-sm font-bold mb-1.5">{b.title}</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Nếu chưa đăng nhập: Kêu gọi đăng nhập trước */}
      {!user ? (
        <div className="card text-center py-10 max-w-lg mx-auto border-primary-500/30 bg-primary-500/5">
          <Handshake className="w-12 h-12 text-primary-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">Đăng Nhập Để Nộp Đơn Hợp Tác</h2>
          <p className="text-xs text-[var(--text-muted)] mb-5 max-w-sm mx-auto leading-relaxed">
            Vui lòng đăng nhập hoặc tạo tài khoản FinGreen trước khi gửi thông tin đăng ký trở thành Đối Tác IB hoặc Cộng Tác Viên.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/dang-nhap?redirect=/hop-tac" className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2">
              <LogIn className="w-3.5 h-3.5" /> Đăng Nhập Ngay
            </Link>
            <Link to="/dang-nhap?mode=register&redirect=/hop-tac" className="btn-secondary text-xs py-2.5 px-5">
              Tạo Tài Khoản Mới
            </Link>
          </div>
        </div>
      ) : isPartner ? (
        <div className="card border-green-500/30 bg-green-500/10 text-center py-10">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Bạn Đã Là Đối Tác Của FinGreen!</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Tài khoản của bạn đã được kích hoạt quyền tác giả ({profile?.role === 'admin_fingreen' ? 'Admin' : profile?.role === 'doi_tac' ? 'Đối Tác IB' : 'CCTV'}).
          </p>
          <Link to="/dang-bai" className="btn-primary inline-flex items-center gap-2 text-sm">
            Đăng Bài Phân Tích Mới <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : submitted ? (
        <div className="card border-primary-500/30 bg-primary-500/10 text-center py-10">
          <CheckCircle className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Đơn Đăng Ký Đã Được Gửi Thành Công!</h2>
          <p className="text-sm text-[var(--text-muted)] mb-2">Ban Quản Trị FinGreen đã ghi nhận hồ sơ của bạn.</p>
          <p className="text-xs text-[var(--text-muted)]">Chúng tôi sẽ liên hệ phỏng vấn và kích hoạt tài khoản trong vòng 24-48 giờ làm việc.</p>
        </div>
      ) : (
        /* Application Form */
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-400" />
            Biểu Mẫu Đăng Ký Hợp Tác
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Họ và Tên *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text" name="full_name" required
                    value={form.full_name} onChange={handleChange}
                    className="input-field pl-10 text-sm" placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email Liên Hệ *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email" name="email" required
                    value={form.email} onChange={handleChange}
                    className="input-field pl-10 text-sm" placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Số Điện Thoại / Zalo</label>
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
                <label className="label">Công Ty Chứng Khoán Đang Làm Việc</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text" name="company_name"
                    value={form.company_name} onChange={handleChange}
                    className="input-field pl-10 text-sm" placeholder="Ví dụ: VPS, SSI, VNDIRECT..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Vai Trò Đăng Ký</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'doi_tac', label: 'Đối Tác IB', desc: 'Môi giới chứng khoán, quản lý tài sản cá nhân', icon: '🤝' },
                  { value: 'cong_tac_vien', label: 'Cộng Tác Viên', desc: 'Chuyên viên viết bài phân tích kỹ thuật/cơ bản', icon: '📊' },
                ].map(r => (
                  <label
                    key={r.value}
                    className={`card p-4 cursor-pointer transition-all ${
                      form.role_requested === r.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <input
                      type="radio" name="role_requested" value={r.value}
                      checked={form.role_requested === r.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{r.label}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{r.desc}</p>
                      </div>
                      {form.role_requested === r.value && (
                        <CheckCircle className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Kinh Nghiệm & Giới Thiệu Bản Thân</label>
              <textarea
                name="description"
                value={form.description} onChange={handleChange}
                rows={4}
                placeholder="Mô tả kinh nghiệm thị trường, trường phái phân tích, kênh mạng xã hội hoặc nhóm khách hàng đang quản lý..."
                className="input-field resize-none text-sm"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi hồ sơ...</>
              ) : (
                <><Handshake className="w-4 h-4" /> Gửi Đơn Đăng Ký Hợp Tác</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
