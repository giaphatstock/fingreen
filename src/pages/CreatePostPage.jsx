import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import RichEditor from '../components/posts/RichEditor'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FileText, Hash, Image, ChevronRight, Sparkles, Eye, Send,
  X, Plus, TrendingUp, BarChart2, Zap, BookOpen, Radio, Loader2
} from 'lucide-react'

const TEMPLATES = [
  {
    id: 'standard',
    icon: <FileText className="w-6 h-6" />,
    label: 'Tin Tức Thị Trường',
    description: 'Phù hợp để chia sẻ tin tức, cập nhật thị trường chứng khoán',
    color: 'from-gray-700 to-gray-800',
    accent: 'border-gray-600',
    sample: { title: 'VN-Index Hồi Phục Mạnh, Nhóm Ngân Hàng Dẫn Dắt Thị Trường' }
  },
  {
    id: 'analysis',
    icon: <BarChart2 className="w-6 h-6" />,
    label: 'Phân Tích Kỹ Thuật',
    description: 'Phân tích biểu đồ, chỉ báo kỹ thuật và xu hướng giá',
    color: 'from-primary-900/60 to-primary-800/40',
    accent: 'border-primary-500/50',
    sample: { title: 'Phân Tích Kỹ Thuật VCB: Breakout Vùng Kháng Cự 85.000đ' }
  },
  {
    id: 'signal',
    icon: <Zap className="w-6 h-6" />,
    label: 'Tín Hiệu Giao Dịch',
    description: 'Khuyến nghị mua/bán, điểm vào lệnh và stop-loss',
    color: 'from-red-900/40 to-red-800/20',
    accent: 'border-red-500/40',
    sample: { title: 'KHUYẾN NGHỊ: Mua HPG tại vùng 23.500 - 24.000đ' }
  },
  {
    id: 'report',
    icon: <BookOpen className="w-6 h-6" />,
    label: 'Báo Cáo Doanh Nghiệp',
    description: 'Phân tích cơ bản, kết quả kinh doanh, dự báo tăng trưởng',
    color: 'from-green-900/40 to-green-800/20',
    accent: 'border-green-500/40',
    sample: { title: 'Báo Cáo Q3/2024: FPT - Tăng Trưởng Mạnh Mảng IT Services' }
  },
  {
    id: 'news',
    icon: <Radio className="w-6 h-6" />,
    label: 'Tin Nhanh',
    description: 'Cập nhật nhanh sự kiện nổi bật, thông tin doanh nghiệp',
    color: 'from-yellow-900/40 to-yellow-800/20',
    accent: 'border-yellow-500/40',
    sample: { title: '[NHANH] ĐHCĐ TCB thông qua kế hoạch chia cổ tức 25%' }
  },
]

const STEPS = [
  { id: 1, label: 'Chọn Template', icon: Sparkles },
  { id: 2, label: 'Viết Nội Dung', icon: FileText },
  { id: 3, label: 'Hashtag & Xuất Bản', icon: Hash },
]

export default function CreatePostPage() {
  const { profile, canPost, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    template: '',
    title: '',
    summary: '',
    content: {},
    cover_image: '',
    hashtags: [],
    stock_codes: [],
  })
  const [hashtagInput, setHashtagInput] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  if (!canPost && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="card">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Bạn Chưa Có Quyền Đăng Bài</h2>
          <p className="text-gray-400 mb-6">
            Chỉ Đối Tác IB và Cộng Tác Viên đã được duyệt mới có thể đăng bài phân tích.
          </p>
          <button onClick={() => navigate('/hop-tac')} className="btn-primary">
            Đăng Ký Hợp Tác Với FinGreen
          </button>
        </div>
      </div>
    )
  }

  const selectTemplate = (tpl) => {
    setForm(f => ({
      ...f,
      template: tpl.id,
      title: f.title || tpl.sample.title,
    }))
    setStep(2)
  }

  const addHashtag = (e) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      e.preventDefault()
      const tag = hashtagInput.trim().toUpperCase().replace(/^#/, '')
      if (!form.hashtags.includes(tag)) {
        setForm(f => ({ ...f, hashtags: [...f.hashtags, tag] }))
      }
      setHashtagInput('')
    }
  }

  const removeHashtag = (tag) => {
    setForm(f => ({ ...f, hashtags: f.hashtags.filter(t => t !== tag) }))
  }

  const handleSubmit = async (asDraft = false) => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    setLoading(true)

    const now = new Date()
    const { data, error } = await supabase.from('posts').insert({
      author_id: profile.id,
      title: form.title,
      summary: form.summary,
      content: form.content,
      cover_image: form.cover_image,
      template: form.template || 'standard',
      status: asDraft ? 'draft' : (isAdmin ? 'published' : 'pending'),
      hashtags: form.hashtags,
      stock_codes: form.hashtags, // dùng hashtag làm stock codes
      published_at: !asDraft && isAdmin ? now.toISOString() : null,
    }).select().single()

    setLoading(false)
    if (error) { toast.error('Lỗi khi đăng bài: ' + error.message); return }

    if (asDraft) {
      toast.success('Đã lưu nháp!')
    } else if (isAdmin) {
      toast.success('Bài viết đã được xuất bản!')
    } else {
      toast.success('Bài viết đã được gửi để xét duyệt!')
    }
    navigate('/')
  }

  const selectedTemplate = TEMPLATES.find(t => t.id === form.template)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gradient mb-2">Đăng Bài Phân Tích</h1>
        <p className="text-gray-400">Chia sẻ phân tích và nhận định của bạn với cộng đồng FinGreen</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              step >= s.id ? 'bg-primary-500/15 text-primary-400' : 'text-gray-600'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.id ? 'bg-primary-500 text-white' :
                step === s.id ? 'bg-primary-500/30 text-primary-400 border border-primary-500' :
                'bg-gray-800 text-gray-600'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={`w-4 h-4 ${step > s.id ? 'text-primary-400' : 'text-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Choose Template */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            Chọn Loại Bài Viết
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => selectTemplate(tpl)}
                className={`card text-left hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 group bg-gradient-to-br ${tpl.color} border ${tpl.accent} hover:shadow-primary-500/10`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tpl.color} border ${tpl.accent} flex items-center justify-center text-primary-300 mb-4 group-hover:scale-110 transition-transform`}>
                  {tpl.icon}
                </div>
                <h3 className="font-bold text-gray-100 mb-1">{tpl.label}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Write content */}
      {step === 2 && (
        <div className="animate-fade-in space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              Viết Nội Dung
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary text-sm py-1.5 px-3">
                ← Quay lại
              </button>
              <button onClick={() => setPreviewMode(p => !p)} className="btn-outline text-sm py-1.5 px-3 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
              </button>
            </div>
          </div>

          {/* Template indicator */}
          {selectedTemplate && (
            <div className={`flex items-center gap-2 text-sm bg-gradient-to-r ${selectedTemplate.color} border ${selectedTemplate.accent} rounded-xl px-4 py-2`}>
              {selectedTemplate.icon}
              <span className="text-gray-300 font-medium">{selectedTemplate.label}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label">Tiêu Đề Bài Viết *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Nhập tiêu đề bài viết..."
              className="input-field text-lg font-semibold"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="label">Tóm Tắt <span className="text-gray-600 font-normal">(không bắt buộc)</span></label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Mô tả ngắn về bài viết, sẽ hiển thị ở danh sách..."
              className="input-field resize-none"
              rows={2}
            />
          </div>

          {/* Cover image URL */}
          <div>
            <label className="label">Ảnh Bìa <span className="text-gray-600 font-normal">(URL)</span></label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.cover_image}
                onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="input-field"
              />
              {form.cover_image && (
                <img src={form.cover_image} alt="Cover preview"
                  className="w-14 h-10 object-cover rounded-lg border border-gray-700 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Editor */}
          <div>
            <label className="label">Nội Dung Bài Viết *</label>
            {!previewMode ? (
              <RichEditor
                content={form.content}
                onChange={content => setForm(f => ({ ...f, content }))}
                placeholder="Viết phân tích chi tiết của bạn tại đây..."
              />
            ) : (
              <div className="card min-h-[300px]">
                <div className="ProseMirror" dangerouslySetInnerHTML={{
                  __html: form.content?.content ? JSON.stringify(form.content) : '<p class="text-gray-500">Chưa có nội dung</p>'
                }} />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
              Tiếp Theo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Hashtags & publish */}
      {step === 3 && (
        <div className="animate-fade-in space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary-400" />
              Hashtag & Xuất Bản
            </h2>
            <button onClick={() => setStep(2)} className="btn-secondary text-sm py-1.5 px-3">
              ← Quay lại
            </button>
          </div>

          {/* Post preview card */}
          <div className="card border-primary-500/20 bg-primary-900/10">
            <div className="flex items-start gap-4">
              {form.cover_image && (
                <img src={form.cover_image} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
              )}
              <div>
                <p className="font-bold text-gray-100">{form.title || 'Chưa có tiêu đề'}</p>
                {form.summary && <p className="text-sm text-gray-400 mt-1">{form.summary}</p>}
                <p className="text-xs text-gray-500 mt-2">
                  Template: {selectedTemplate?.label} • Tác giả: {profile?.full_name}
                </p>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="label">
              Mã Chứng Khoán / Hashtag
              <span className="text-gray-600 font-normal ml-2">— Nhấn Enter để thêm (VD: VNM, VCB, HPG)</span>
            </label>
            <div className="input-field flex flex-wrap gap-2 cursor-text min-h-[48px]" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
              {form.hashtags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2.5 py-1 rounded-full text-sm font-medium">
                  #{tag}
                  <button type="button" onClick={() => removeHashtag(tag)} className="text-primary-400 hover:text-red-400 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={addHashtag}
                placeholder={form.hashtags.length === 0 ? '#VNM, #VCB, #HPG...' : ''}
                className="bg-transparent outline-none text-sm text-gray-300 placeholder-gray-600 min-w-[120px]"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">Hashtag giúp người dùng tìm kiếm bài viết theo mã cổ phiếu</p>
          </div>

          {/* Quick stock suggestions */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Gợi ý mã phổ biến:</p>
            <div className="flex flex-wrap gap-2">
              {['VNM', 'VCB', 'TCB', 'HPG', 'VHM', 'FPT', 'MWG', 'SSI', 'VIC', 'BID', 'CTG', 'GAS', 'SAB'].map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    if (!form.hashtags.includes(code)) {
                      setForm(f => ({ ...f, hashtags: [...f.hashtags, code] }))
                    }
                  }}
                  disabled={form.hashtags.includes(code)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    form.hashtags.includes(code)
                      ? 'bg-primary-500/30 text-primary-400 border border-primary-500/40'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  #{code}
                </button>
              ))}
            </div>
          </div>

          {/* Publish time info */}
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="text-2xl">🕐</div>
            <div>
              <p className="text-sm font-medium text-gray-300">Thời gian đăng tải (Giờ Hà Nội)</p>
              <p className="text-primary-400 font-semibold text-sm">{new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
            </div>
          </div>

          {/* Status info */}
          <div className={`p-4 rounded-xl border ${
            isAdmin
              ? 'bg-green-900/20 border-green-500/30 text-green-300'
              : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
          }`}>
            <p className="text-sm font-medium">
              {isAdmin
                ? '✅ Bài viết sẽ được xuất bản ngay lập tức'
                : '⏳ Bài viết sẽ được gửi cho Admin FinGreen để xét duyệt trước khi xuất bản'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Lưu Nháp
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isAdmin ? 'Xuất Bản Ngay' : 'Gửi Xét Duyệt'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
