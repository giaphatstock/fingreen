import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft, Eye, Heart, Hash, Calendar, User, Share2,
  TrendingUp, Loader2, AlertTriangle
} from 'lucide-react'
import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'

const TEMPLATE_ICONS = { standard: '📰', analysis: '📊', signal: '🎯', report: '📋', news: '⚡' }
const TEMPLATE_LABELS = { standard: 'Tin Tức', analysis: 'Phân Tích', signal: 'Tín Hiệu', report: 'Báo Cáo', news: 'Tin Nhanh' }

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')

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
              StarterKit, Underline, Highlight, TextStyle, Image, Link
            ])
            setHtmlContent(html)
          }
        } catch (e) {
          setHtmlContent('<p class="text-gray-400">Nội dung đang được cập nhật...</p>')
        }
        // Increment view count
        await supabase.from('posts').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)
      }
      setLoading(false)
    }
    fetchPost()
  }, [id])

  const handleLike = async () => {
    if (!post) return
    const newLiked = !liked
    setLiked(newLiked)
    await supabase.from('posts').update({
      like_count: newLiked ? post.like_count + 1 : post.like_count - 1
    }).eq('id', id)
    setPost(p => ({ ...p, like_count: newLiked ? p.like_count + 1 : p.like_count - 1 }))
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
    <div className="text-center py-20">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-100 mb-2">Không Tìm Thấy Bài Viết</h2>
      <button onClick={() => navigate('/')} className="btn-primary mt-4">Về Trang Chủ</button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Quay lại
      </button>

      {/* Article */}
      <article className="card">
        {/* Cover image */}
        {post.cover_image && (
          <div className="h-64 bg-gray-800 rounded-xl overflow-hidden mb-6 -mx-6 -mt-6">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Meta */}
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
        <h1 className="text-2xl sm:text-3xl font-black text-gray-100 mb-4 leading-tight">{post.title}</h1>

        {/* Summary */}
        {post.summary && (
          <p className="text-gray-400 text-lg leading-relaxed mb-6 border-l-4 border-primary-500/50 pl-4 italic">
            {post.summary}
          </p>
        )}

        {/* Author & Date */}
        <div className="flex items-center justify-between py-4 border-y border-gray-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {post.profiles?.full_name?.charAt(0) || 'F'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-200 text-sm">{post.profiles?.full_name || 'FinGreen'}</p>
              {post.profiles?.company_name && (
                <p className="text-xs text-gray-500">{post.profiles.company_name}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(post.published_at)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="ProseMirror"
          dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-gray-500">Nội dung đang được tải...</p>' }}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800 mt-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                liked
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-red-400 border border-gray-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.like_count}</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{post.view_count} lượt xem</span>
            </div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); }}
            className="flex items-center gap-2 btn-secondary text-sm py-2 px-3"
          >
            <Share2 className="w-4 h-4" />
            Chia Sẻ
          </button>
        </div>
      </article>

      {/* Related by hashtag */}
      {post.hashtags?.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Hash className="w-4 h-4" />
            Tìm kiếm theo:
            {post.hashtags.map(h => (
              <span key={h} className="text-primary-400 cursor-pointer hover:underline" onClick={() => navigate(`/?tag=${h}`)}>
                #{h}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
