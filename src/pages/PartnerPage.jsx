import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Handshake, CheckCircle, ArrowRight, Building2, Phone, Mail,
  User, FileText, Loader2, Star, TrendingUp, Shield, Zap
} from 'lucide-react'

const BENEFITS = [
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Tiếp Cận Cộng Đồng', desc: 'Chia sẻ phân tích đến hàng nghìn nhà đầu tư' },
  { icon: <Shield className="w-5 h-5" />, title: 'Uy Tín Thương Hiệu', desc: 'Xây dựng thương hiệu cá nhân và doanh nghiệp' },
  { icon: <Zap className="w-5 h-5" />, title: 'Công Cụ Chuyên Nghiệp', desc: 'Hệ thống đăng bài phân tích tiên tiến' },
  { icon: <Star className="w-5 h-5" />, title: 'Hỗ Trợ Tận Tâm', desc: 'Đội ngũ FinGreen hỗ trợ 24/7' },
]

export default function PartnerPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: '',
    company_name: '',
    role_requested: 'doi_tac',
    description: '',
  })

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.email) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('partner_applications').insert({
      user_id: profile.id,
      ...form,
    })
    setLoading(false)
    if (error) {
      toast.error('Lỗi gửi đơn: ' + error.message)
    } else {
      toast.success('Đã gửi đơn thành công! Chúng tôi sẽ liên hệ bạn trong 24-48 giờ.')
      setSubmitted(true)
    }
  }

  // Check if already partner
  const isPartner = profile?.role === 'doi_tac' || profile?.role === 'cong_tac_vien' || profile?.role === 'admin_fingreen'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Handshake className="w-3.5 h-3.5" />
          Chương Trình Hợp Tác
        </div>
        <h1 className="text-4xl font-black text-gradient mb-4">Hợp Tác Với FinGreen</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Nếu bạn là chuyên gia phân tích, Đối Tác IB hoặc Cộng Tác Viên tại công ty chứng khoán,
          hãy tham gia cùng chúng tôi để chia sẻ kiến thức và xây dựng cộng đồng đầu tư chuyên nghiệp.
        </p>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {BENEFITS.map((b, i) => (
          <div key={i} className="card text-center group hover:border-primary-500/30 transition-all">
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary-400 group-hover:scale-110 transition-transform">
              {b.icon}
            </div>
            <h3 className="text-sm font-bold text-gray-200 mb-1">{b.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Already partner */}
      {isPartner ? (
        <div className="card border-green-500/30 bg-green-900/10 text-center py-10">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-100 mb-2">Bạn Đã Là Đối Tác FinGreen</h2>
          <p className="text-gray-400 mb-4">
            Tài khoản của bạn đã có quyền đăng bài phân tích
            {profile?.is_approved ? ' và đã được phê duyệt' : ' nhưng đang chờ phê duyệt'}.
          </p>
          {profile?.is_approved && (
            <a href="/dang-bai" className="btn-primary inline-flex items-center gap-2">
              Đăng Bài Ngay <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      ) : submitted ? (
        <div className="card border-primary-500/30 bg-primary-900/10 text-center py-10">
          <CheckCircle className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-100 mb-2">Đơn Đã Được Gửi!</h2>
          <p className="text-gray-400 mb-2">Cảm ơn bạn đã quan tâm đến chương trình hợp tác FinGreen.</p>
          <p className="text-gray-500 text-sm">Chúng tôi sẽ xem xét và liên hệ với bạn trong vòng 24-48 giờ làm việc.</p>
        </div>
      ) : (
        /* Application Form */
        <div className="card">
          <h2 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-400" />
            Đăng Ký Hợp Tác
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Họ và Tên *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text" name="full_name" required
                    value={form.full_name} onChange={handleChange}
                    className="input-field pl-10" placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email" name="email" required
                    value={form.email} onChange={handleChange}
                    className="input-field pl-10" placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="label">Vai Trò Đăng Ký</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'doi_tac', label: 'Đối Tác IB', desc: 'Môi giới chứng khoán, IB', icon: '🤝' },
                  { value: 'cong_tac_vien', label: 'Cộng Tác Viên', desc: 'Chuyên gia phân tích', icon: '📊' },
                ].map(r => (
                  <label
                    key={r.value}
                    className={`card cursor-pointer transition-all ${
                      form.role_requested === r.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'hover:border-gray-600'
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
                      <div>
                        <p className="font-semibold text-gray-200 text-sm">{r.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                      </div>
                      {form.role_requested === r.value && (
                        <CheckCircle className="w-4 h-4 text-primary-400 ml-auto flex-shrink-0" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Giới Thiệu Bản Thân & Kinh Nghiệm</label>
              <textarea
                name="description"
                value={form.description} onChange={handleChange}
                rows={4}
                placeholder="Mô tả kinh nghiệm đầu tư, chuyên môn phân tích, lý do muốn hợp tác với FinGreen..."
                className="input-field resize-none"
              />
            </div>

            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 text-sm text-gray-400">
              <p className="font-medium text-gray-300 mb-1">📋 Lưu ý:</p>
              <ul className="space-y-1 text-xs">
                <li>• Đơn đăng ký sẽ được Admin FinGreen xem xét trong 24-48 giờ</li>
                <li>• Sau khi được phê duyệt, bạn có thể đăng bài phân tích</li>
                <li>• Mỗi bài viết cần được Admin duyệt trước khi xuất bản công khai</li>
              </ul>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
              ) : (
                <><Handshake className="w-4 h-4" /> Gửi Đơn Đăng Ký</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
