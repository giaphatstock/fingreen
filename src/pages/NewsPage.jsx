import React, { useState, useEffect } from 'react'
import { supabase, getHanoiTime } from '../lib/supabase'
import { Search, TrendingUp, Hash, Eye, Heart, Clock, Filter, ChevronDown, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  const { profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTemplate, setFilterTemplate] = useState('all')
  const [filterTag, setFilterTag] = useState('')

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select(`*, profiles:author_id (full_name, role, company_name, avatar_url)`)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (filterTemplate !== 'all') query = query.eq('template', filterTemplate)
    if (filterTag) query = query.contains('hashtags', [filterTag])
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

  const getContent = (post) => {
    if (!post.content) return ''
    if (typeof post.content === 'string') return post.content.replace(/<[^>]*>/g, '').slice(0, 150)
    return post.summary || ''
  }

  return (
    <div className="bg-mesh min-h-screen">
      {/* Hero section */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Nền Tảng Phân Tích Chứng Khoán
        </div>
        <h1 className="text-4xl font-black text-gradient mb-3">Tin Tức & Phân Tích</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Cập nhật thông tin thị trường chứng khoán, phân tích kỹ thuật và tín hiệu giao dịch từ các chuyên gia FinGreen
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text" placeholder="Tìm kiếm bài viết, mã cổ phiếu..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Template filter */}
          <select
            value={filterTemplate} onChange={e => setFilterTemplate(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="all">Tất Cả Loại</option>
            {Object.entries(TEMPLATE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Quick stock tags */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
            <Hash className="w-3 h-3" /> Hot:
          </span>
          {['VNM', 'VCB', 'TCB', 'HPG', 'VHM', 'FPT', 'MWG', 'SSI'].map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterTag === tag
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-800 rounded-xl mb-4" />
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
              <div className="h-3 bg-gray-800 rounded w-full mb-1" />
              <div className="h-3 bg-gray-800 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg font-medium">Chưa có bài viết nào</p>
          <p className="text-gray-600 mt-2">Hãy thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} formatDate={formatDate} getContent={getContent} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, formatDate, getContent }) {
  return (
    <Link to={`/bai-viet/${post.id}`} className="card-hover group block animate-fade-in">
      {/* Cover image */}
      {post.cover_image ? (
        <div className="h-44 bg-gray-800 rounded-xl overflow-hidden mb-4 -mx-6 -mt-6">
          <img src={post.cover_image} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-primary-900/50 to-gray-800 rounded-xl overflow-hidden mb-4 -mx-6 -mt-6 flex items-center justify-center">
          <span className="text-5xl">{TEMPLATE_ICONS[post.template] || '📰'}</span>
        </div>
      )}

      {/* Template badge & date */}
      <div className="flex items-center justify-between mb-3">
        <span className={`${TEMPLATE_COLORS[post.template]} text-xs`}>
          {TEMPLATE_ICONS[post.template]} {TEMPLATE_LABELS[post.template]}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatDate(post.published_at)}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-100 text-lg mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors leading-tight">
        {post.title}
      </h3>

      {/* Summary */}
      {post.summary && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {post.summary}
        </p>
      )}

      {/* Stock hashtags */}
      {post.hashtags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {post.hashtags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[11px] bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2 py-0.5 rounded-full font-medium">
              #{tag}
            </span>
          ))}
          {post.hashtags.length > 4 && (
            <span className="text-[11px] text-gray-600">+{post.hashtags.length - 4}</span>
          )}
        </div>
      )}

      {/* Author & stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">
              {post.profiles?.full_name?.charAt(0) || 'F'}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-medium truncate max-w-[100px]">
            {post.profiles?.full_name || 'FinGreen'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.like_count}</span>
        </div>
      </div>
    </Link>
  )
}
