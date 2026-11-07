import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Users, FileText, Shield, TrendingUp, CheckCircle, XCircle,
  Ban, Lock, Eye, Search, ChevronDown, AlertTriangle, Loader2,
  ClipboardList, UserCheck, UserX, Trash2, RefreshCw, Activity,
  Bot, Key, Sparkles, Check, Globe
} from 'lucide-react'
import {
  getGeminiApiKey, saveGeminiApiKey,
  getFastModel, saveFastModel,
  getTurboModel, saveTurboModel,
  SUGGESTED_FAST_MODELS, SUGGESTED_TURBO_MODELS
} from '../services/aiService'
import { DNSE_MCP_TOOLS } from '../services/dnseService'

const ROLE_OPTIONS = [
  { value: 'guest', label: 'Thành Viên' },
  { value: 'cong_tac_vien', label: 'Cộng Tác Viên' },
  { value: 'doi_tac', label: 'Đối Tác IB' },
  { value: 'admin_fingreen', label: 'Admin FinGreen' },
]

const ROLE_BADGE = {
  admin_fingreen: 'badge-purple',
  doi_tac: 'badge-green',
  cong_tac_vien: 'badge-yellow',
  guest: 'badge-gray',
}
const ROLE_LABEL = {
  admin_fingreen: 'Admin FinGreen',
  doi_tac: 'Đối Tác IB',
  cong_tac_vien: 'Cộng Tác Viên',
  guest: 'Thành Viên',
}

const POST_STATUS_BADGE = {
  draft: 'badge-gray',
  pending: 'badge-yellow',
  published: 'badge-green',
  rejected: 'badge-red',
}
const POST_STATUS_LABEL = {
  draft: 'Nháp',
  pending: 'Chờ Duyệt',
  published: 'Đã Đăng',
  rejected: 'Từ Chối',
}

export default function AdminPage() {
  const { profile, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [stats, setStats] = useState({ users: 0, posts: 0, pending: 0, applications: 0 })

  // Cấu hình FinGreen AI & Google AI Studio (Chỉ Admin)
  const [aiApiKey, setAiApiKey] = useState(getGeminiApiKey())
  const [fastModel, setFastModel] = useState(getFastModel())
  const [turboModel, setTurboModel] = useState(getTurboModel())
  const [testingAi, setTestingAi] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleSaveAiConfig = (e) => {
    e?.preventDefault()
    saveGeminiApiKey(aiApiKey)
    saveFastModel(fastModel)
    saveTurboModel(turboModel)
    toast.success('Đã lưu cấu hình FinGreen AI thành công!')
  }

  const handleTestAi = async () => {
    if (!aiApiKey.trim()) {
      toast.error('Vui lòng nhập Google Gemini API Key trước khi test')
      return
    }
    setTestingAi(true)
    setTestResult(null)
    try {
      const modelToTest = turboModel || 'gemini-3.6-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${aiApiKey.trim()}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Chào bạn! Hãy trả lời ngắn gọn 1 câu: FinGreen AI đã kết nối thành công với Google Gemini Studio chưa?' }]
            }
          ]
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || `Lỗi HTTP ${res.status}`)
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Kết nối thành công!'
      setTestResult({
        success: true,
        reply
      })
      toast.success('Kết nối Google Gemini API thành công!')
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      })
      toast.error('Kiểm tra thất bại: ' + err.message)
    } finally {
      setTestingAi(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20 card max-w-md mx-auto">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Truy Cập Bị Từ Chối</h2>
        <p className="text-xs text-[var(--text-muted)]">Chỉ tài khoản có vai trò Admin FinGreen mới có thể truy cập trang quản trị này.</p>
      </div>
    )
  }

  const fetchStats = async () => {
    const [{ count: uCount }, { count: pCount }, { count: pendCount }, { count: appCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    setStats({ users: uCount || 0, posts: pCount || 0, pending: pendCount || 0, applications: appCount || 0 })
  }

  const fetchUsers = async () => {
    setLoading(true)
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (searchUser) query = query.or(`full_name.ilike.%${searchUser}%,email.ilike.%${searchUser}%`)
    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:author_id(full_name, email)')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  const fetchApplications = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('partner_applications')
      .select('*, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchStats() }, [])
  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'posts') fetchPosts()
    if (activeTab === 'applications') fetchApplications()
  }, [activeTab, searchUser])

  const updateUserRole = async (userId, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) toast.error('Lỗi cập nhật vai trò')
    else { toast.success('Đã cập nhật vai trò'); fetchUsers() }
  }

  const toggleBan = async (user) => {
    const reason = !user.is_banned ? window.prompt('Lý do khóa tài khoản:') : null
    if (!user.is_banned && reason === null) return
    const { error } = await supabase.from('profiles')
      .update({ is_banned: !user.is_banned, ban_reason: !user.is_banned ? reason : null })
      .eq('id', user.id)
    if (error) toast.error('Lỗi')
    else { toast.success(user.is_banned ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản'); fetchUsers() }
  }

  const toggleApproved = async (user) => {
    const { error } = await supabase.from('profiles')
      .update({ is_approved: !user.is_approved })
      .eq('id', user.id)
    if (error) toast.error('Lỗi')
    else { toast.success(user.is_approved ? 'Đã thu hồi phê duyệt' : 'Đã phê duyệt'); fetchUsers() }
  }

  const updatePostStatus = async (postId, status, reason = null) => {
    const { error } = await supabase.from('posts').update({
      status,
      reviewed_by: profile.id,
      published_at: status === 'published' ? new Date().toISOString() : null,
      rejected_reason: reason,
    }).eq('id', postId)
    if (error) toast.error('Lỗi')
    else { toast.success(`Bài viết đã được ${status === 'published' ? 'duyệt' : 'từ chối'}`); fetchPosts(); fetchStats() }
  }

  const approveApplication = async (app) => {
    await supabase.from('partner_applications').update({
      status: 'approved',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', app.id)

    await supabase.from('profiles').update({
      role: app.role_requested,
      is_approved: true,
      company_name: app.company_name,
    }).eq('id', app.user_id)
    toast.success('Đã phê duyệt đối tác thành công!')
    fetchApplications(); fetchStats()
  }

  const rejectApplication = async (appId) => {
    const reason = window.prompt('Lý do từ chối:')
    if (reason === null) return
    await supabase.from('partner_applications').update({
      status: 'rejected',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    }).eq('id', appId)
    toast.success('Đã từ chối đơn đăng ký')
    fetchApplications(); fetchStats()
  }

  const TABS = [
    { id: 'dashboard', label: 'Tổng Quan', icon: Activity },
    { id: 'users', label: 'Quản Lý Thành Viên', icon: Users },
    { id: 'posts', label: 'Duyệt Bài Viết', icon: FileText, badge: stats.pending },
    { id: 'applications', label: 'Đơn Hợp Tác', icon: ClipboardList, badge: stats.applications },
    { id: 'ai_config', label: 'Cấu Hình FinGreen AI', icon: Bot },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center border border-primary-500/30">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gradient">Quản Trị Hệ Thống</h1>
          <p className="text-xs text-[var(--text-muted)] font-medium">FinGreen Admin Control Panel</p>
        </div>
      </div>

      {/* THANH TABS ĐỒNG BỘ MÀU HOÀN TOÀN THEO THEME (Không còn thanh đen thui) */}
      <div className="flex gap-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1.5 mb-8 overflow-x-auto shadow-sm">
        {TABS.map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all relative ${
                active
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.2 font-black shadow-sm">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Tổng Thành Viên', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Bài Đã Xuất Bản', value: stats.posts, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Bài Chờ Duyệt', value: stats.pending, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Đơn Xin Hợp Tác', value: stats.applications, icon: ClipboardList, color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
            ].map((s, i) => (
              <div key={i} className="card p-5 border border-[var(--border-color)] shadow-sm">
                <div className={`w-10 h-10 ${s.bg} border rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[var(--text-muted)] font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card text-center py-12 border border-[var(--border-color)]">
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-400 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
              Trung Tâm Quản Trị FinGreen
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Sử dụng các tab phía trên để phê duyệt bài viết phân tích, quản lý người dùng, duyệt hồ sơ Đối tác IB và Cộng tác viên.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Tìm thành viên theo họ tên hoặc địa chỉ email..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                className="input-field pl-10 text-xs sm:text-sm"
              />
            </div>
            <button onClick={fetchUsers} className="btn-secondary text-xs sm:text-sm flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> <span>Làm Mới</span>
            </button>
          </div>

          <div className="card overflow-hidden p-0 border border-[var(--border-color)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Thành Viên</th>
                    <th className="px-4 py-3">Vai Trò</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                    <th className="px-4 py-3">Ngày Đăng Ký</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[var(--text-muted)]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-400" />
                        <span>Đang tải danh sách thành viên...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-[var(--text-muted)]">
                        Không tìm thấy thành viên nào.
                      </td>
                    </tr>
                  ) : users.map(u => (
                    <tr key={u.id} className={`hover:bg-[var(--bg-subtle)]/60 transition-colors ${u.is_banned ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-500/40" />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {u.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--text-main)] truncate max-w-[160px]">{u.full_name || 'Chưa cập nhật'}</p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={u.role}
                          onChange={e => updateUserRole(u.id, e.target.value)}
                          disabled={u.id === profile.id}
                          className="input-field py-1 px-2.5 text-xs w-auto font-semibold rounded-lg"
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {u.is_banned && <span className="badge-red text-[10px] font-bold">🔒 Bị Khóa</span>}
                          {u.is_approved && <span className="badge-green text-[10px] font-bold">✓ Đã Duyệt</span>}
                          {!u.is_banned && !u.is_approved && <span className="badge-gray text-[10px] font-medium">Bình Thường</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-[var(--text-muted)] font-medium">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.id !== profile.id ? (
                            <>
                              <button
                                onClick={() => toggleApproved(u)}
                                title={u.is_approved ? 'Thu hồi phê duyệt' : 'Phê duyệt tài khoản'}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  u.is_approved
                                    ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'
                                    : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                }`}
                              >
                                {u.is_approved ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => toggleBan(u)}
                                title={u.is_banned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  u.is_banned
                                    ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                    : 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                                }`}
                              >
                                {u.is_banned ? <Lock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">Bạn</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POSTS */}
      {activeTab === 'posts' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-[var(--text-muted)]">{posts.length} bài viết trong hệ thống</p>
            <button onClick={fetchPosts} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> <span>Làm Mới</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></div>
          ) : posts.length === 0 ? (
            <div className="card text-center py-12 border border-[var(--border-color)]">
              <FileText className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[var(--text-muted)]">Chưa có bài viết nào.</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} className="card p-5 border border-[var(--border-color)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`${POST_STATUS_BADGE[post.status]} text-[10px] font-bold`}>
                      {POST_STATUS_LABEL[post.status]}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">
                      {post.profiles?.full_name || 'Tác giả ẩn'} • {new Date(post.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--text-main)] text-base mb-1 truncate">{post.title}</h3>
                  {post.summary && <p className="text-xs text-[var(--text-muted)] line-clamp-1 mb-2">{post.summary}</p>}
                  {post.hashtags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {post.hashtags.map(h => (
                        <span key={h} className="text-[10px] badge-purple">#{h}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updatePostStatus(post.id, 'published')}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Duyệt Bài
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt('Lý do từ chối:')
                          if (reason !== null) updatePostStatus(post.id, 'rejected', reason)
                        }}
                        className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Từ Chối
                      </button>
                    </>
                  )}
                  {post.status === 'published' && (
                    <button
                      onClick={() => updatePostStatus(post.id, 'rejected', 'Gỡ bởi Ban Quản Trị')}
                      className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Gỡ Bài
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-[var(--text-muted)]">{applications.length} đơn đăng ký hợp tác</p>
            <button onClick={fetchApplications} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> <span>Làm Mới</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></div>
          ) : applications.length === 0 ? (
            <div className="card text-center py-12 border border-[var(--border-color)]">
              <ClipboardList className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[var(--text-muted)]">Chưa có đơn đăng ký hợp tác nào.</p>
            </div>
          ) : applications.map(app => (
            <div key={app.id} className="card p-5 border border-[var(--border-color)]">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-bold ${
                      app.status === 'pending' ? 'badge-yellow' :
                      app.status === 'approved' ? 'badge-green' : 'badge-red'
                    }`}>
                      {app.status === 'pending' ? 'Chờ Duyệt' : app.status === 'approved' ? 'Đã Duyệt' : 'Từ Chối'}
                    </span>
                    <span className={`text-[10px] font-bold ${ROLE_BADGE[app.role_requested]}`}>
                      {ROLE_LABEL[app.role_requested]}
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--text-main)] text-base">{app.full_name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {app.email} {app.phone && `• ${app.phone}`}
                  </p>
                  {app.company_name && (
                    <p className="text-xs font-semibold text-primary-400 mt-1">🏢 {app.company_name}</p>
                  )}
                  {app.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-2 italic bg-[var(--bg-subtle)] p-2 rounded-lg border border-[var(--border-color)]">
                      "{app.description}"
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    Nộp lúc: {new Date(app.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </p>
                </div>

                {app.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveApplication(app)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Phê Duyệt
                    </button>
                    <button
                      onClick={() => rejectApplication(app.id)}
                      className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Từ Chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: CẤU HÌNH FINGREEN AI & OPENROUTER (CHỈ ADMIN) */}
      {activeTab === 'ai_config' && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Cấu Hình */}
            <div className="lg:col-span-7 card space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center border border-primary-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)]">
                    Cấu Hình OpenRouter API & Model AI
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Thiết lập API key và mô hình AI dùng chung cho toàn bộ hệ thống FinGreen.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Lưu ý phân quyền bảo mật:
                </p>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Người dùng thông thường (thành viên, đối tác, cộng tác viên) <strong>KHÔNG</strong> có quyền xem hoặc chỉnh sửa Google Gemini API Key hay cấu hình AI. Tất cả các yêu cầu chat đều tự động sử dụng cấu hình do Admin thiết lập tại đây.
                </p>
              </div>

              <form onSubmit={handleSaveAiConfig} className="space-y-4">
                <div>
                  <label className="label">Google Gemini API Key (AI Studio)</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder="AQ.Ab8RN6I89a..."
                      className="input-field pl-10 text-xs sm:text-sm font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    Lấy API key miễn phí tại Google AI Studio: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary-400 underline font-semibold">aistudio.google.com/apikey</a>
                  </p>
                </div>

                {/* Cấu hình Model Nhanh (Flash) */}
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Mô Hình Chế Độ "Nhanh (Flash)"</span>
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] italic">
                      Thường nhanh hơn, phản hồi tức thì
                    </span>
                  </div>
                  <select
                    value={fastModel}
                    onChange={(e) => setFastModel(e.target.value)}
                    className="input-field text-xs sm:text-sm"
                  >
                    {SUGGESTED_FAST_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-[var(--text-muted)]">Hoặc nhập Model ID tùy chỉnh:</span>
                    <input
                      type="text"
                      value={fastModel}
                      onChange={(e) => setFastModel(e.target.value)}
                      placeholder="e.g. gemini-3.6-flash"
                      className="input-field py-1 px-2.5 text-xs font-mono flex-1"
                    />
                  </div>
                </div>

                {/* Cấu hình Model Turbo */}
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Mô Hình Chế Độ "Turbo"</span>
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] italic">
                      Chuyên sâu, phân tích toàn diện
                    </span>
                  </div>
                  <select
                    value={turboModel}
                    onChange={(e) => setTurboModel(e.target.value)}
                    className="input-field text-xs sm:text-sm"
                  >
                    {SUGGESTED_TURBO_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-[var(--text-muted)]">Hoặc nhập Model ID tùy chỉnh:</span>
                    <input
                      type="text"
                      value={turboModel}
                      onChange={(e) => setTurboModel(e.target.value)}
                      placeholder="e.g. gemini-3.6-flash"
                      className="input-field py-1 px-2.5 text-xs font-mono flex-1"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="btn-primary py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Cấu Hình AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestAi}
                    disabled={testingAi}
                    className="btn-secondary py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    {testingAi ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 text-primary-400" /> Kiểm Tra Kết Nối API</>
                    )}
                  </button>
                </div>
              </form>

              {/* Kết quả kiểm tra API */}
              {testResult && (
                <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{testResult.success ? 'Kết nối thành công!' : 'Kiểm tra thất bại'}</span>
                  </div>
                  {testResult.reply && (
                    <div className="p-3 rounded-xl bg-black/20 text-white font-mono text-[11px] whitespace-pre-wrap">
                      AI Phản hồi: {testResult.reply}
                    </div>
                  )}
                  {testResult.error && (
                    <div className="text-[11px] leading-relaxed">
                      Chi tiết lỗi: <code>{testResult.error}</code>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thông tin kết nối MCP DNSE */}
            <div className="lg:col-span-5 space-y-4">
              <div className="card space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-main)]">
                      DNSE MCP Studio
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Trạng thái kết nối dịch vụ chứng khoán
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)]">Endpoint MCP:</span>
                    <code className="text-primary-400 font-bold font-mono">https://mcp.dnse.com.vn/mcp</code>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)]">Trạng thái:</span>
                    <span className="badge-green font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sẵn Sàng
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)]">Số Tools tích hợp:</span>
                    <span className="font-bold text-[var(--text-main)]">{DNSE_MCP_TOOLS.length} công cụ</span>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Các công cụ DNSE chính:
                  </h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {DNSE_MCP_TOOLS.map((t, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[11px] flex items-center justify-between border border-[var(--border-color)]">
                        <code className="text-emerald-400 font-mono font-semibold">{t.name}</code>
                        <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px]">{t.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
