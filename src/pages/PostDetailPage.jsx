import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, updateMetaTags } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Eye, Heart, Hash, Calendar, User, Share2,
  TrendingUp, Loader2, AlertTriangle, Lock, LogIn, UserPlus,
  Check, Copy, ExternalLink, X
} from 'lucide-react'
import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'

const TEMPLATE_ICONS = { standard: '📰', analysis: '📊', signal: '🎯', report: '📋', news: '⚡' }
const TEMPLATE_LABELS = { standard: 'Tin Tức', analysis: 'Phân Tích', signal: 'Tín Hiệu', report: 'Báo Cáo', news: 'Tin Nhanh' }

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:author_id(full_name, role, company_name, avatar_url)')
        .eq('id', id)
        .single()
      if (!error && data) {
        setPost(data)
        // Convert JSON content to HTML
        try {
          if (data.content && data.content.type === 'doc') {
            const html = generateHTML(data.content, [
              StarterKit, Underline, Highlight, TextStyle, Image, LinkExtension
            ])
            setHtmlContent(html)
          } else if (typeof data.content === 'string') {
            setHtmlContent(data.content)
          }
        } catch (e) {
          setHtmlContent('<p class="text-[var(--text-muted)]">Nội dung đang được cập nhật...</p>')
        }

        // Cập nhật thẻ meta OpenGraph cho Facebook, Zalo, Twitter preview
        const fullUrl = window.location.href
        const coverImg = data.cover_image || `${window.location.origin}/logo-horizontal.png`
        updateMetaTags({
          title: data.title,
          description: data.summary || `Phân tích chứng khoán: ${data.title} trên FinGreen`,
          image: coverImg,
          url: fullUrl,
        })

        // Tăng lượt xem
        await supabase.from('posts').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)
      }
      setLoading(false)
    }
    fetchPost()
  }, [id])

  const handleLike = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích bài viết')
      return
    }
    if (!post) return
    const newLiked = !liked
    setLiked(newLiked)
    await supabase.from('posts').update({
      like_count: newLiked ? (post.like_count || 0) + 1 : Math.max(0, (post.like_count || 0) - 1)
    }).eq('id', id)
    setPost(p => ({ ...p, like_count: newLiked ? (p.like_count || 0) + 1 : Math.max(0, (p.like_count || 0) - 1) }))
  }

  // Xử lý chia sẻ bài viết (Zalo, Facebook, Copy link, Native Share)
  const handleShareClick = async () => {
    const currentUrl = window.location.href
    const shareTitle = post?.title ? `${post.title} | FinGreen` : 'FinGreen - Kiến tạo giá trị thực'

    // Nếu trình duyệt di động hỗ trợ navigator.share thì ưu tiên dùng
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: post?.summary || 'Đọc bài phân tích chứng khoán trên FinGreen',
          url: currentUrl,
        })
        toast.success('Đã mở chia sẻ!')
        return
      } catch (err) {
        // User hủy hoặc không hỗ trợ, tiếp tục mở modal
      }
    }

    setShareModalOpen(true)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Đã sao chép liên kết vào bộ nhớ tạm!')
    setTimeout(() => setCopied(false), 2500)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : ''

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
    </div>
  )

  if (!post) return (
    <div className="text-center py-20 card max-w-md mx-auto">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Không Tìm Thấy Bài Viết</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">Bài viết có thể đã bị gỡ hoặc đường dẫn không chính xác.</p>
      <button onClick={() => navigate('/')} className="btn-primary">Về Trang Chủ</button>
    </div>
  )

  const shareUrl = encodeURIComponent(window.location.href)
  const shareTitleEncoded = encodeURIComponent(post.title)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] mb-6 transition-colors group text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Quay lại
      </button>

      {/* Article Card */}
      <article className="card relative overflow-hidden">
        {/* Cover image */}
        {post.cover_image && (
          <div className="h-64 sm:h-80 bg-[var(--bg-subtle)] rounded-xl overflow-hidden mb-6 -mx-6 -mt-6 border-b border-[var(--border-color)]">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Meta badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="badge-purple text-xs">
            {TEMPLATE_ICONS[post.template]} {TEMPLATE_LABELS[post.template]}
          </span>
          {post.hashtags?.map(h => (
            <span key={h} className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs">
              #{h}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Summary */}
        {post.summary && (
          <p className="text-[var(--text-muted)] text-base sm:text-lg leading-relaxed mb-6 border-l-4 border-primary-500 pl-4 italic bg-[var(--bg-subtle)]/50 py-2 rounded-r-xl">
            {post.summary}
          </p>
        )}

        {/* Author & Date */}
        <div className="flex items-center justify-between py-4 border-y border-[var(--border-color)] mb-6">
          <div className="flex items-center gap-3">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-primary-500/40"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {post.profiles?.full_name?.charAt(0) || 'F'}
              </div>
            )}
            <div>
              <p className="font-bold text-sm">{post.profiles?.full_name || 'Chuyên gia FinGreen'}</p>
              {post.profiles?.company_name && (
                <p className="text-xs text-[var(--text-muted)]">{post.profiles.company_name}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] justify-end font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* CONTENT WITH 50% BLUR FOR GUEST */}
        {user ? (
          /* Đã đăng nhập: Hiển thị 100% nội dung */
          <div
            className="ProseMirror leading-relaxed"
            dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Nội dung đang được cập nhật...</p>' }}
          />
        ) : (
          /* Khách vãng lai: Hiển thị 50% nội dung + lớp phủ BLUR */
          <div className="relative">
            {/* Vùng nội dung bị cắt và làm mờ dần */}
            <div
              className="ProseMirror max-h-[320px] overflow-hidden select-none filter blur-[1.5px] opacity-80"
              dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Nội dung đang được cập nhật...</p>' }}
            />

            {/* Lớp phủ BLUR + Hộp kêu gọi đăng nhập */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/85 to-transparent backdrop-blur-[4px] flex flex-col items-center justify-end p-6 text-center z-10">
              <div className="max-w-md w-full bg-[var(--bg-card)] border border-primary-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-xl animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center mx-auto mb-3 text-primary-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">
                  Mở Khóa Toàn Bộ Bài Viết
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
                  Bạn đang xem bản rút gọn (50%). Đăng nhập hoặc tạo tài khoản FinGreen hoàn toàn miễn phí để xem trọn vẹn phân tích chuyên sâu, đồ thị kỹ thuật và khuyến nghị đầu tư!
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    to={`/dang-nhap?redirect=/bai-viet/${post.id}`}
                    className="btn-primary text-xs py-2.5 px-4 flex-1 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Đăng Nhập
                  </Link>
                  <Link
                    to={`/dang-nhap?mode=register&redirect=/bai-viet/${post.id}`}
                    className="btn-secondary text-xs py-2.5 px-4 flex-1 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Tạo Tài Khoản
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action bar (Like, View, Share) */}
        <div className="flex items-center justify-between pt-6 border-t border-[var(--border-color)] mt-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                liked
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-semibold'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-red-400 border border-[var(--border-color)]'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current text-red-500' : ''}`} />
              <span className="text-sm font-semibold">{post.like_count || 0}</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
              <Eye className="w-4 h-4" />
              <span>{post.view_count || 1} lượt xem</span>
            </div>
          </div>

          {/* Nút Chia Sẻ hoạt động 100% */}
          <button
            onClick={handleShareClick}
            className="flex items-center gap-2 btn-secondary text-sm py-2 px-4 shadow-sm group"
          >
            <Share2 className="w-4 h-4 text-primary-400 group-hover:scale-110 transition-transform" />
            <span>Chia Sẻ</span>
          </button>
        </div>
      </article>

      {/* Modal Chia Sẻ Chuyên Nghiệp */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Chia Sẻ Bài Viết</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Lan tỏa phân tích tới cộng đồng đầu tư</p>
              </div>
            </div>

            {/* Các tùy chọn chia sẻ */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {/* Chia sẻ Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareModalOpen(false)}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] font-semibold text-xs border border-[#1877F2]/30 transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>

              {/* Chia sẻ Zalo */}
              <a
                href={`https://zalo.me/share?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareModalOpen(false)}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#0068FF]/10 hover:bg-[#0068FF]/20 text-[#0068FF] font-semibold text-xs border border-[#0068FF]/30 transition-all"
              >
                <div className="w-4 h-4 bg-[#0068FF] text-white rounded-full flex items-center justify-center text-[10px] font-black">
                  Z
                </div>
                <span>Zalo</span>
              </a>

              {/* Chia sẻ Telegram */}
              <a
                href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitleEncoded}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareModalOpen(false)}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] font-semibold text-xs border border-[#0088cc]/30 transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Telegram</span>
              </a>

              {/* Mở liên kết trực tiếp */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] font-semibold text-xs border border-[var(--border-color)] transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-primary-400" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>
            </div>

            {/* Input link */}
            <div className="flex items-center gap-2 p-2 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)]">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="bg-transparent text-xs text-[var(--text-muted)] flex-1 outline-none truncate px-1"
              />
              <button
                onClick={handleCopyLink}
                className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
              >
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related by hashtag */}
      {post.hashtags?.length > 0 && (
        <div className="mt-6 flex items-center gap-2 text-xs text-[var(--text-muted)] flex-wrap">
          <Hash className="w-3.5 h-3.5 text-primary-400" />
          <span>Mã liên quan:</span>
          {post.hashtags.map(h => (
            <button
              key={h}
              onClick={() => navigate(`/?tag=${h}`)}
              className="badge bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 border border-primary-500/20 font-semibold"
            >
              #{h}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
