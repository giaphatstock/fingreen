import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, TrendingUp, Hash, Eye, Heart, Clock, Sparkles, Filter, ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const TEMPLATE_ICONS = {
  standard: '📰',
  analysis: '📊',
  signal: '🎯',
  report: '📋',
  news: '⚡',
}

const TEMPLATE_LABELS = {
  standard: 'Tin Tức',
  analysis: 'Phân Tích',
  signal: 'Tín Hiệu',
  report: 'Báo Cáo',
  news: 'Nhanh',
}

const TEMPLATE_COLORS = {
  standard: 'badge-gray',
  analysis: 'badge-purple',
  signal: 'badge-red',
  report: 'badge-green',
  news: 'badge-yellow',
}

export default function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTag = searchParams.get('tag') || ''
  
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTemplate, setFilterTemplate] = useState('all')
  const [filterTag, setFilterTag] = useState(initialTag)

  useEffect(() => {
    if (searchParams.get('tag')) {
      setFilterTag(searchParams.get('tag'))
    }
  }, [searchParams])

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select(`*, profiles:author_id (full_name, role, company_name, avatar_url)`)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (filterTemplate !== 'all') query = query.eq('template', filterTemplate)
    if (filterTag) query = query.contains('hashtags', [filterTag.toUpperCase()])
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error } = await query
    if (!error) setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [filterTemplate, filterTag, search])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="bg-mesh min-h-screen">
      {/* Hero section */}
      <div className="mb-10 text-center relative">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          FinGreen • Kiến Tạo Giá Trị Thực
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gradient mb-3 tracking-tight">
          Tin Tức & Phân Tích Chứng Khoán
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Cập nhật thị trường chứng khoán Việt Nam, tín hiệu kỹ thuật và góc nhìn chuyên sâu từ đội ngũ phân tích FinGreen.
        </p>

        {/* Banner kết nối mạng xã hội TikTok & YouTube */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://www.tiktok.com/@fingreenvn?_r=1&_t=ZS-9BCMKxpo7yT"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-semibold shadow-md hover:scale-105 transition-transform"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.5V8.85a8.28 8.28 0 0 0 5.21 1.84V7.24a4.84 4.84 0 0 1-1.3-.55z"/>
            </svg>
            <span>Kênh TikTok @fingreenvn</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </a>

          <a
            href="https://m.youtube.com/@greeninvestmentvn?si=-4DoUDMlBDVCRIOi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold shadow-md hover:scale-105 transition-transform"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>Kênh YouTube Green Investment</span>
            <ChevronRight className="w-3 h-3 text-red-200" />
          </a>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết theo tiêu đề, mã cổ phiếu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>

          {/* Template filter */}
          <select
            value={filterTemplate}
            onChange={e => setFilterTemplate(e.target.value)}
            className="input-field sm:w-48 text-sm"
          >
            <option value="all">Tất Cả Thể Loại</option>
            {Object.entries(TEMPLATE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{TEMPLATE_ICONS[k]} {v}</option>
            ))}
          </select>
        </div>

        {/* Quick stock tags */}
        <div className="flex gap-1.5 mt-4 flex-wrap items-center">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mr-1 font-semibold">
            <Hash className="w-3 h-3 text-primary-400" /> Mã HOT:
          </span>
          {['VNM', 'VCB', 'TCB', 'HPG', 'VHM', 'FPT', 'MWG', 'SSI', 'VIC', 'BID'].map(tag => (
            <button
              key={tag}
              onClick={() => {
                const nextTag = filterTag === tag ? '' : tag
                setFilterTag(nextTag)
                setSearchParams(nextTag ? { tag: nextTag } : {})
              }}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterTag === tag
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
              }`}
            >
              #{tag}
            </button>
          ))}
          {filterTag && (
            <button
              onClick={() => {
                setFilterTag('')
                setSearchParams({})
              }}
              className="text-xs text-red-400 hover:underline ml-2 font-medium"
            >
              Xóa bộ lọc (#{filterTag})
            </button>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-44 bg-[var(--bg-subtle)] rounded-xl mb-4" />
              <div className="h-4 bg-[var(--bg-subtle)] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[var(--bg-subtle)] rounded w-1/2 mb-4" />
              <div className="h-3 bg-[var(--bg-subtle)] rounded w-full mb-1" />
              <div className="h-3 bg-[var(--bg-subtle)] rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-20 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-[var(--bg-subtle)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
            <TrendingUp className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-main)] text-lg font-bold mb-1">Chưa có bài viết phù hợp</p>
          <p className="text-[var(--text-muted)] text-xs mb-4">
            {filterTag || search ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc hashtag' : 'Các bài phân tích mới nhất sẽ được đăng tải sớm.'}
          </p>
          {filterTag && (
            <button
              onClick={() => {
                setFilterTag('')
                setSearch('')
                setSearchParams({})
              }}
              className="btn-outline text-xs py-2 px-4"
            >
              Xem Tất Cả Bài Viết
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, formatDate }) {
  return (
    <Link to={`/bai-viet/${post.id}`} className="card-hover group flex flex-col h-full animate-fade-in overflow-hidden p-5">
      {/* Cover image or Logo placeholder */}
      {post.cover_image ? (
        <div className="h-44 bg-[var(--bg-subtle)] rounded-xl overflow-hidden mb-4 -mx-5 -mt-5 border-b border-[var(--border-color)]">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-44 bg-[var(--bg-subtle)] rounded-xl overflow-hidden mb-4 -mx-5 -mt-5 flex items-center justify-center border-b border-[var(--border-color)] p-6 group-hover:bg-[var(--bg-card-hover)] transition-colors">
          <img
            src="/logo-horizontal.png"
            alt="FinGreen"
            className="h-12 w-auto object-contain opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all"
          />
        </div>
      )}

      {/* Template badge & date */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={`${TEMPLATE_COLORS[post.template]} text-[11px] font-semibold`}>
          {TEMPLATE_ICONS[post.template]} {TEMPLATE_LABELS[post.template]}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-medium">
          <Clock className="w-3 h-3" />
          {formatDate(post.published_at || post.created_at)}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-[var(--text-main)] text-base mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors leading-snug">
        {post.title}
      </h3>

      {/* Summary */}
      {post.summary && (
        <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2 leading-relaxed flex-1">
          {post.summary}
        </p>
      )}

      {/* Stock hashtags */}
      {post.hashtags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {post.hashtags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="text-[10px] bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2 py-0.5 rounded-full font-bold"
            >
              #{tag}
            </span>
          ))}
          {post.hashtags.length > 4 && (
            <span className="text-[10px] text-[var(--text-muted)]">+{post.hashtags.length - 4}</span>
          )}
        </div>
      )}

      {/* Author & stats footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] mt-auto">
        <div className="flex items-center gap-2">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-primary-500/30"
            />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {post.profiles?.full_name?.charAt(0) || 'F'}
            </div>
          )}
          <span className="text-xs text-[var(--text-muted)] font-medium truncate max-w-[120px]">
            {post.profiles?.full_name || 'FinGreen'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count || 1}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.like_count || 0}</span>
        </div>
      </div>
    </Link>
  )
}
