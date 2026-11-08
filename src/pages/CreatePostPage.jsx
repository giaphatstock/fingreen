import React, { useState, useRef } from 'react'
import { supabase, uploadMedia } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import RichEditor from '../components/posts/RichEditor'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FileText, Hash, Image as ImageIcon, ChevronRight, Sparkles, Eye, Send,
  X, Plus, TrendingUp, BarChart2, Zap, BookOpen, Radio, Loader2,
  UploadCloud, Trash2, Link as LinkIcon, CheckCircle2
} from 'lucide-react'

const TEMPLATES = [
  {
    id: 'standard',
    icon: <FileText className="w-6 h-6" />,
    label: 'Tin Tức Thị Trường',
    description: 'Phù hợp để chia sẻ tin tức, sự kiện và tổng hợp phiên giao dịch chứng khoán',
    iconColor: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
    hoverBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
    sample: { title: 'VN-Index Hồi Phục Mạnh, Nhóm Ngân Hàng Dẫn Dắt Thị Trường' }
  },
  {
    id: 'analysis',
    icon: <BarChart2 className="w-6 h-6" />,
    label: 'Phân Tích Kỹ Thuật',
    description: 'Phân tích biểu đồ, chỉ báo dòng tiền, xu hướng giá và các ngưỡng kháng cự - hỗ trợ',
    iconColor: 'text-primary-400 bg-primary-500/10 border-primary-500/25',
    hoverBorder: 'hover:border-primary-500/50 hover:shadow-primary-500/10',
    sample: { title: 'Phân Tích Kỹ Thuật VCB: Breakout Vùng Kháng Cự 85.000đ' }
  },
  {
    id: 'signal',
    icon: <Zap className="w-6 h-6" />,
    label: 'Tín Hiệu Giao Dịch',
    description: 'Khuyến nghị điểm mua/bán chi tiết, tỷ lệ chốt lời (Take Profit) và cắt lỗ (Stop Loss)',
    iconColor: 'text-rose-500 bg-rose-500/10 border-rose-500/25',
    hoverBorder: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
    sample: { title: 'KHUYẾN NGHỊ: Mua HPG tại vùng 23.500 - 24.000đ' }
  },
  {
    id: 'report',
    icon: <BookOpen className="w-6 h-6" />,
    label: 'Báo Cáo Doanh Nghiệp',
    description: 'Định giá cổ phiếu, phân tích cơ bản, kết quả kinh doanh quý và dự báo tăng trưởng',
    iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25',
    hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    sample: { title: 'Báo Cáo Q3/2024: FPT - Tăng Trưởng Mạnh Mảng IT Services' }
  },
  {
    id: 'news',
    icon: <Radio className="w-6 h-6" />,
    label: 'Tin Nhanh',
    description: 'Cập nhật nóng hổi sự kiện doanh nghiệp, đại hội cổ đông, chia cổ tức',
    iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/25',
    hoverBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
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
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverMode, setCoverMode] = useState('upload') // 'upload' | 'url'
  const fileInputRef = useRef(null)

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
          <h2 className="text-xl font-bold mb-2">Bạn Chưa Có Quyền Đăng Bài</h2>
          <p className="text-[var(--text-muted)] mb-6 text-sm">
            Chỉ Đối Tác IB và Cộng Tác Viên đã được duyệt bởi Admin FinGreen mới có thể đăng bài phân tích.
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

  // Upload ảnh bìa từ thư mục máy tính
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Kiểm tra định dạng ảnh
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WebP...)')
      return
    }

    // Giới hạn 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 10MB')
      return
    }

    setUploadingCover(true)
    try {
      const publicUrl = await uploadMedia(file, 'covers')
      setForm(f => ({ ...f, cover_image: publicUrl }))
      toast.success('Đã tải ảnh bìa thành công!')
    } catch (err) {
      console.error(err)
      toast.error('Lỗi khi tải ảnh lên máy chủ: ' + (err.message || 'Thử lại sau'))
    } finally {
      setUploadingCover(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
    const { error } = await supabase.from('posts').insert({
      author_id: profile.id,
      title: form.title,
      summary: form.summary,
      content: form.content,
      cover_image: form.cover_image,
      template: form.template || 'standard',
      status: asDraft ? 'draft' : (isAdmin ? 'published' : 'pending'),
      hashtags: form.hashtags,
      stock_codes: form.hashtags,
      published_at: !asDraft && isAdmin ? now.toISOString() : null,
    })

    setLoading(false)
    if (error) { toast.error('Lỗi khi đăng bài: ' + error.message); return }

    if (asDraft) {
      toast.success('Đã lưu bài nháp!')
    } else if (isAdmin) {
      toast.success('Bài viết đã được xuất bản thành công!')
    } else {
      toast.success('Bài viết đã được gửi! Vui lòng chờ Admin FinGreen xét duyệt.')
    }
    navigate('/')
  }

  const selectedTemplate = TEMPLATES.find(t => t.id === form.template)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gradient mb-2">Đăng Bài Phân Tích</h1>
        <p className="text-[var(--text-muted)] text-sm">Chia sẻ góc nhìn và phân tích thị trường cùng cộng đồng FinGreen</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              step >= s.id ? 'bg-primary-500/15 text-primary-400 font-semibold' : 'text-[var(--text-muted)]'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.id ? 'bg-primary-500 text-white' :
                step === s.id ? 'bg-primary-500/30 text-primary-400 border border-primary-500' :
                'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span className="text-sm">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={`w-4 h-4 flex-shrink-0 ${step > s.id ? 'text-primary-400' : 'text-[var(--text-muted)] opacity-40'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Choose Template */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            Chọn Khuôn Mẫu (Template) Phù Hợp
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => selectTemplate(tpl)}
                className={`card text-left hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 group border border-[var(--border-color)] ${tpl.hoverBorder} p-6 shadow-md flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${tpl.iconColor}`}>
                    {tpl.icon}
                  </div>
                  <h3 className="font-extrabold text-[var(--text-main)] text-base mb-1.5 leading-snug">
                    {tpl.label}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px] font-bold text-primary-400 group-hover:translate-x-1 transition-transform">
                  <span>Dùng mẫu này</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Write content */}
      {step === 2 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              Nội Dung Bài Viết
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary text-xs py-1.5 px-3">
                ← Chọn lại mẫu
              </button>
              <button onClick={() => setPreviewMode(p => !p)} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? 'Sửa tiếp' : 'Xem trước'}
              </button>
            </div>
          </div>

          {/* Template info banner */}
          {selectedTemplate && (
            <div className={`flex items-center gap-2.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl px-4 py-2.5`}>
              <span className="text-base">{selectedTemplate.icon}</span>
              <span className="font-bold text-[var(--text-main)]">{selectedTemplate.label}:</span>
              <span className="text-[var(--text-muted)]">{selectedTemplate.description}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label">Tiêu Đề Bài Phân Tích *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ví dụ: Phân Tích Kỹ Thuật VCB: Vùng Mua Đẹp Cho Nhịp Sóng Mới..."
              className="input-field text-base sm:text-lg font-bold"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="label">Tóm Tắt Ngắn <span className="text-[var(--text-muted)] font-normal">(Hiển thị ở trang danh sách)</span></label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Tóm tắt nhận định chính, điểm nhấn kỹ thuật, mục tiêu giá..."
              className="input-field resize-none text-sm"
              rows={2}
            />
          </div>

          {/* UPLOAD ẢNH BÌA TỪ THƯ MỤC MÁY */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Ảnh Bìa Bài Viết</label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCoverMode('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    coverMode === 'upload' ? 'bg-primary-500 text-white font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  Tải từ máy
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('url')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    coverMode === 'url' ? 'bg-primary-500 text-white font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  Nhập link URL
                </button>
              </div>
            </div>

            {/* Chế độ Upload từ máy */}
            {coverMode === 'upload' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileUpload}
                  className="hidden"
                />

                {!form.cover_image ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-[var(--border-color)] hover:border-primary-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-subtle)]/50 group ${
                      uploadingCover ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingCover ? (
                      <div className="py-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto mb-2" />
                        <p className="text-xs text-primary-400 font-semibold">Đang tải ảnh bìa lên Supabase Storage...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-main)] mb-1">
                          Bấm vào đây để chọn ảnh từ máy tính của bạn
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Hỗ trợ JPG, PNG, WebP (Dung lượng tối đa 10MB)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] group">
                    <img
                      src={form.cover_image}
                      alt="Ảnh bìa"
                      className="w-full h-48 sm:h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shadow-lg"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Thay ảnh khác
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                        className="btn-danger text-xs py-2 px-3 flex items-center gap-1.5 shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Chế độ nhập link URL */
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.cover_image}
                    onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                    placeholder="https://example.com/hinh-anh.jpg"
                    className="input-field text-sm"
                  />
                  {form.cover_image && (
                    <img
                      src={form.cover_image}
                      alt=""
                      className="w-14 h-12 object-cover rounded-xl border border-[var(--border-color)] flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/logo-horizontal.png'
                      }}
                    />
                  )}
                </div>
                {form.cover_image && (form.cover_image.includes('discordapp.com') || form.cover_image.includes('discord.gg')) && (
                  <p className="text-[11px] text-amber-400 flex items-center gap-1">
                    ⚠️ Link Discord sẽ tự động hết hạn sau 24 giờ gây lỗi ảnh. Hãy chuyển sang chế độ "Tải từ máy" để lưu ảnh vĩnh viễn trên FinGreen!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* TipTap Editor */}
          <div>
            <label className="label">Soạn Thảo Bài Viết *</label>
            {!previewMode ? (
              <RichEditor
                content={form.content}
                onChange={content => setForm(f => ({ ...f, content }))}
                placeholder="Nhập nội dung phân tích chi tiết, chèn hình ảnh biểu đồ kỹ thuật..."
              />
            ) : (
              <div className="card min-h-[300px]">
                <p className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wider font-bold">Xem Trước Nội Dung</p>
                <div
                  className="ProseMirror"
                  dangerouslySetInnerHTML={{
                    __html: form.content?.content ? JSON.stringify(form.content) : '<p class="text-gray-500">Chưa có nội dung</p>'
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
              Tiếp Theo (Gắn Hashtag) <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Hashtags & publish */}
      {step === 3 && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary-400" />
              Hashtag Mã Cổ Phiếu & Xuất Bản
            </h2>
            <button onClick={() => setStep(2)} className="btn-secondary text-xs py-1.5 px-3">
              ← Sửa lại bài viết
            </button>
          </div>

          {/* Post preview card */}
          <div className="card bg-primary-500/10 border-primary-500/30">
            <div className="flex items-start gap-4">
              {form.cover_image && (
                <img
                  src={form.cover_image}
                  alt=""
                  className="w-28 h-20 object-cover rounded-xl flex-shrink-0 border border-primary-500/20"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base mb-1 truncate">{form.title || 'Chưa có tiêu đề'}</p>
                {form.summary && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">{form.summary}</p>}
                <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                  <span>Mẫu: <b>{selectedTemplate?.label}</b></span>
                  <span>•</span>
                  <span>Tác giả: <b>{profile?.full_name}</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Hashtags input */}
          <div>
            <label className="label">
              Mã Chứng Khoán / Hashtag
              <span className="text-[var(--text-muted)] font-normal ml-2">— Nhấn Enter để thêm (VD: VCB, HPG, SSI, FPT)</span>
            </label>
            <div
              className="input-field flex flex-wrap gap-2 cursor-text min-h-[50px] items-center"
              onClick={e => e.currentTarget.querySelector('input')?.focus()}
            >
              {form.hashtags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-primary-500/20 text-primary-300 border border-primary-500/40 px-3 py-1 rounded-full text-xs font-bold"
                >
                  #{tag}
                  <button type="button" onClick={() => removeHashtag(tag)} className="text-primary-300 hover:text-red-400 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={addHashtag}
                placeholder={form.hashtags.length === 0 ? 'Gõ mã cổ phiếu như VNM, VCB và nhấn Enter...' : ''}
                className="bg-transparent outline-none text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] min-w-[150px] flex-1"
              />
            </div>
          </div>

          {/* Quick suggestions */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Gợi ý mã phổ biến:</p>
            <div className="flex flex-wrap gap-1.5">
              {['VNM', 'VCB', 'TCB', 'HPG', 'VHM', 'FPT', 'MWG', 'SSI', 'VIC', 'BID', 'CTG', 'MBB', 'DGC'].map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    if (!form.hashtags.includes(code)) {
                      setForm(f => ({ ...f, hashtags: [...f.hashtags, code] }))
                    }
                  }}
                  disabled={form.hashtags.includes(code)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    form.hashtags.includes(code)
                      ? 'bg-primary-500/30 text-primary-400 border border-primary-500/50'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                  }`}
                >
                  #{code}
                </button>
              ))}
            </div>
          </div>

          {/* Hanoi Time Stamp */}
          <div className="flex items-center gap-3 p-4 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-color)]">
            <div className="text-2xl">🕒</div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Thời gian đăng bài (Chuẩn Giờ Hà Nội - GMT+7)</p>
              <p className="text-primary-400 font-bold text-sm">
                {new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Status info */}
          <div className={`p-4 rounded-xl border ${
            isAdmin
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}>
            <p className="text-xs font-semibold">
              {isAdmin
                ? '✅ Với quyền Admin FinGreen, bài viết sẽ được xuất bản công khai ngay lập tức.'
                : '⏳ Bài viết của bạn sẽ được gửi tới Ban Biên Tập Admin FinGreen xét duyệt trước khi xuất bản.'}
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
              Lưu Bản Nháp
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isAdmin ? 'Xuất Bản Ngay Lập Tức' : 'Gửi Bài Để Xét Duyệt'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
