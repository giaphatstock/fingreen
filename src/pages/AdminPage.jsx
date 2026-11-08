import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Users, Scale, CheckCircle2, FileText, Shield, TrendingUp, CheckCircle, XCircle,
  Ban, Lock, Eye, Search, ChevronDown, AlertTriangle, Loader2,
  ClipboardList, UserCheck, UserX, Trash2, RefreshCw, Activity,
  Bot, Key, Sparkles, Check, Globe, Zap, Calendar, Clock, X
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

  // Quản lý gia hạn GreenSmartOne
  const [selectedUserForRenew, setSelectedUserForRenew] = useState(null)
  const [customRenewDate, setCustomRenewDate] = useState('')
  const [savingRenew, setSavingRenew] = useState(false)
  const [gsSubTab, setGsSubTab] = useState('licenses') // 'licenses' | 'consents'
  const [searchGs, setSearchGs] = useState('')

  const handleApplyRenewDuration = (days) => {
    const base = (selectedUserForRenew?.greensmartone_expires_at && new Date(selectedUserForRenew.greensmartone_expires_at) > new Date())
      ? new Date(selectedUserForRenew.greensmartone_expires_at)
      : new Date()
    base.setDate(base.getDate() + days)
    setCustomRenewDate(base.toISOString().slice(0, 10))
  }

  const handleSetLifetime = () => {
    setCustomRenewDate('2099-12-31')
  }

  const handleSaveRenew = async (expiryIsoString) => {
    if (!selectedUserForRenew) return
    setSavingRenew(true)
    try {
      const dateVal = expiryIsoString ? new Date(expiryIsoString).toISOString() : null
      const { error } = await supabase
        .from('profiles')
        .update({ greensmartone_expires_at: dateVal })
        .eq('id', selectedUserForRenew.id)

      if (error) throw error
      toast.success(`Đã cập nhật hạn GreenSmartOne cho ${selectedUserForRenew.full_name || selectedUserForRenew.email}!`)
      setSelectedUserForRenew(null)
      fetchUsers()
    } catch (err) {
      toast.error('Lỗi gia hạn: ' + err.message)
    } finally {
      setSavingRenew(false)
    }
  }

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
    if (activeTab === 'users' || activeTab === 'greensmartone') fetchUsers()
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
    { id: 'greensmartone', label: 'Quản Trị GreenSmartOne', icon: Zap },
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

      {/* TAB GREENSMARTONE: DÀNH RIÊNG QUẢN TRỊ LICENSE & NHẬT KÝ ĐIỀU KHOẢN PHÁP LÝ */}
      {activeTab === 'greensmartone' && (
        <div className="animate-fade-in space-y-6">
          {/* Header Banner GreenSmartOne */}
          <div className="card p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[var(--bg-card)] to-cyan-500/10 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[var(--text-main)]">Trung Tâm Quản Trị GreenSmartOne PRO</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      PRO ENGINE
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Quản lý cấp phép bản quyền, gia hạn thời hạn sử dụng và tra cứu nhật ký bằng chứng chấp thuận điều khoản pháp lý (IP & thời gian).
                  </p>
                </div>
              </div>

              {/* Sub-Tabs: Cấp Phép vs Nhật Ký Pháp Lý */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs font-bold">
                <button
                  onClick={() => setGsSubTab('licenses')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    gsSubTab === 'licenses'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Cấp Phép License ({users.filter(u => u.role === 'admin_fingreen' || (u.greensmartone_expires_at && new Date(u.greensmartone_expires_at) > new Date())).length})</span>
                </button>
                <button
                  onClick={() => setGsSubTab('consents')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    gsSubTab === 'consents'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Nhật Ký Điều Khoản & IP</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-view 1: Cấp Phép & Quản Lý Hạn License */}
          {gsSubTab === 'licenses' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Tìm thành viên theo tên hoặc email để cấp phép / gia hạn..."
                    value={searchGs}
                    onChange={e => setSearchGs(e.target.value)}
                    className="input-field pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
                <button onClick={fetchUsers} className="btn-secondary text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap">
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
                        <th className="px-4 py-3">Thời Hạn GreenSmartOne</th>
                        <th className="px-4 py-3">Trạng Thái Bản Quyền</th>
                        <th className="px-4 py-3">Ngày Đăng Ký</th>
                        <th className="px-4 py-3 text-right">Thao Tác Cấp Phép</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-xs">
                      {users
                        .filter(u => {
                          if (!searchGs.trim()) return true;
                          const q = searchGs.toLowerCase().trim();
                          return (u.full_name && u.full_name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
                        })
                        .map(u => {
                          const isAdminRole = u.role === 'admin_fingreen';
                          const hasExpiry = Boolean(u.greensmartone_expires_at);
                          const isLifetime = u.greensmartone_expires_at && u.greensmartone_expires_at.startsWith('2099');
                          const isValid = isAdminRole || isLifetime || (hasExpiry && new Date(u.greensmartone_expires_at).getTime() >= Date.now());

                          return (
                            <tr key={u.id} className="hover:bg-[var(--bg-subtle)]/60 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-500/40" />
                                  ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                      {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-bold text-[var(--text-main)] truncate max-w-[170px]">{u.full_name || 'Chưa cập nhật'}</p>
                                    <p className="text-[11px] text-[var(--text-muted)] truncate">{u.email}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'} text-[10px] font-bold`}>
                                  {ROLE_LABEL[u.role] || u.role}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 font-mono">
                                {isAdminRole || isLifetime ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" /> Vĩnh Viễn
                                  </span>
                                ) : hasExpiry ? (
                                  <span className={isValid ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                    {new Date(u.greensmartone_expires_at).toLocaleDateString('vi-VN')}
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-muted)] italic">Chưa cấp phép</span>
                                )}
                              </td>

                              <td className="px-4 py-3.5">
                                {isAdminRole || isLifetime ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                    <Zap className="w-3 h-3 text-emerald-400" /> PRO Vĩnh Viễn
                                  </span>
                                ) : isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                                    <CheckCircle className="w-3 h-3" /> Đang Hoạt Động
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                    <AlertTriangle className="w-3 h-3" /> {hasExpiry ? 'Đã Hết Hạn' : 'Chưa Kích Hoạt'}
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-[var(--text-muted)] font-mono text-[11px]">
                                {new Date(u.created_at).toLocaleDateString('vi-VN')}
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedUserForRenew(u);
                                    setCustomRenewDate(u.greensmartone_expires_at ? u.greensmartone_expires_at.slice(0, 10) : new Date(Date.now() + 30*86400000).toISOString().slice(0, 10));
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 ml-auto"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Cấp Phép / Gia Hạn</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view 2: Lịch Sử Chấp Thuận Điều Khoản & Miễn Trừ Trách Nhiệm (Audit Log) */}
          {gsSubTab === 'consents' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
                <Scale className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">
                    Bằng Chứng Pháp Lý & Thỏa Thuận Điện Tử (Electronic Consent Records)
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Theo Điều 3 Điều khoản Sử dụng, toàn bộ dữ liệu nhật ký gồm <strong>Địa chỉ IP</strong>, <strong>Thời gian chấp thuận chính xác</strong> và <strong>Dấu vết số</strong> được lưu trữ an toàn làm bằng chứng ràng buộc trước pháp luật khi người dùng truy cập và sử dụng GreenSmartOne.
                  </p>
                </div>
              </div>

              <div className="card overflow-hidden p-0 border border-[var(--border-color)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Thành Viên</th>
                        <th className="px-4 py-3">Địa Chỉ IP Ghi Nhận</th>
                        <th className="px-4 py-3">Thời Gian Chấp Thuận</th>
                        <th className="px-4 py-3">Phiên Bản Điều Khoản</th>
                        <th className="px-4 py-3">Thiết Bị / User-Agent</th>
                        <th className="px-4 py-3 text-center">Bằng Chứng Pháp Lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-xs font-mono">
                      {users
                        .map((u, idx) => {
                          let consent = null;
                          try {
                            if (u.company_description) {
                              const parsed = typeof u.company_description === 'object' ? u.company_description : JSON.parse(u.company_description);
                              consent = parsed.greensmartone_consent || (parsed.accepted ? parsed : null);
                            }
                          } catch (_) {}

                          // Fallback to localStorage session if testing on local device
                          if (!consent && typeof localStorage !== 'undefined') {
                            try {
                              const local = localStorage.getItem(`gs_disclaimer_consent_${u.id}`);
                              if (local) consent = JSON.parse(local);
                            } catch (_) {}
                          }

                          return { user: u, consent, originalIdx: idx + 1 };
                        })
                        .map(({ user: u, consent, originalIdx }) => (
                          <tr key={u.id} className="hover:bg-[var(--bg-subtle)]/60 transition-colors">
                            <td className="px-4 py-3.5 text-[var(--text-muted)]">#{originalIdx}</td>
                            
                            <td className="px-4 py-3.5 font-sans">
                              <p className="font-bold text-[var(--text-main)]">{u.full_name || 'Chưa cập nhật'}</p>
                              <p className="text-[11px] text-[var(--text-muted)] font-mono">{u.email}</p>
                            </td>

                            <td className="px-4 py-3.5">
                              {consent?.ip ? (
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                                  {consent.ip}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)] italic">Chưa ghi nhận</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              {consent?.accepted_at ? (
                                <div className="flex flex-col">
                                  <span className="text-emerald-400 font-bold">
                                    {new Date(consent.accepted_at).toLocaleDateString('vi-VN')}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    {new Date(consent.accepted_at).toLocaleTimeString('vi-VN')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[var(--text-muted)] italic">Chưa chấp thuận</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[10px]">
                                {consent?.version || '11/2026'}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 max-w-xs truncate text-[10px] text-[var(--text-muted)]" title={consent?.user_agent || ''}>
                              {consent?.user_agent ? (
                                consent.user_agent.includes('Windows') ? 'Chrome trên Windows' :
                                consent.user_agent.includes('Macintosh') ? 'Safari trên macOS' :
                                consent.user_agent.includes('iPhone') ? 'Safari trên iOS' :
                                consent.user_agent.includes('Android') ? 'Chrome trên Android' : 'Trình duyệt Web'
                              ) : 'Chưa có thông tin'}
                            </td>

                            <td className="px-4 py-3.5 text-center font-sans">
                              {consent?.accepted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ KÝ ĐIỆN TỬ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                                  Chờ Người Dùng Vào Xem
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
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
                    <th className="px-4 py-3">Hạn GreenSmartOne</th>
                    <th className="px-4 py-3">Ngày Đăng Ký</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-400" />
                        <span>Đang tải danh sách thành viên...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-[var(--text-muted)]">
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

                      <td className="px-4 py-3.5">
                        {u.role === 'admin_fingreen' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                            <Zap className="w-3 h-3 text-emerald-400" /> Vĩnh Viễn
                          </span>
                        ) : u.greensmartone_expires_at ? (
                          new Date(u.greensmartone_expires_at).getTime() >= Date.now() ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                              <Calendar className="w-3 h-3" />
                              {new Date(u.greensmartone_expires_at).toLocaleDateString('vi-VN')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-bold font-mono">
                              <AlertTriangle className="w-3 h-3" />
                              Hết hạn ({new Date(u.greensmartone_expires_at).toLocaleDateString('vi-VN')})
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 text-[var(--text-muted)] border border-slate-500/20 text-[10px]">
                            Chưa kích hoạt
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[var(--text-muted)] font-medium">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Gia Hạn GreenSmartOne */}
                          <button
                            onClick={() => {
                              setSelectedUserForRenew(u);
                              setCustomRenewDate(u.greensmartone_expires_at ? u.greensmartone_expires_at.slice(0, 10) : new Date(Date.now() + 30*86400000).toISOString().slice(0, 10));
                            }}
                            title="Gia hạn gói GreenSmartOne"
                            className="p-1.5 rounded-lg border border-primary-500/40 text-primary-400 hover:bg-primary-500/15 transition-all flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Gia Hạn</span>
                          </button>

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

          {/* Modal Gia Hạn GreenSmartOne */}
          {selectedUserForRenew && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="card w-full max-w-lg p-6 border border-emerald-500/30 shadow-2xl relative space-y-5 bg-[var(--bg-card)]">
                {/* Nút Đóng */}
                <button
                  onClick={() => setSelectedUserForRenew(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Tiêu Đề */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-main)]">Gia Hạn Gói GreenSmartOne</h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      {selectedUserForRenew.full_name || 'Thành viên'} ({selectedUserForRenew.email})
                    </p>
                  </div>
                </div>

                {/* Trạng Thái Hiện Tại */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Hạn sử dụng hiện tại:</span>
                  <span className="font-bold font-mono text-emerald-400">
                    {selectedUserForRenew.greensmartone_expires_at
                      ? new Date(selectedUserForRenew.greensmartone_expires_at).toLocaleDateString('vi-VN')
                      : 'Chưa cấp hạn'}
                  </span>
                </div>

                {/* Phím Nhanh Chọn Thời Hạn */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-main)] mb-2">
                    Chọn nhanh thời hạn cộng thêm:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyRenewDuration(30)}
                      className="p-2.5 rounded-xl border border-[var(--border-color)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-bold text-[var(--text-main)] transition-all"
                    >
                      +1 Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRenewDuration(90)}
                      className="p-2.5 rounded-xl border border-[var(--border-color)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-bold text-[var(--text-main)] transition-all"
                    >
                      +3 Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRenewDuration(180)}
                      className="p-2.5 rounded-xl border border-[var(--border-color)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-bold text-[var(--text-main)] transition-all"
                    >
                      +6 Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRenewDuration(365)}
                      className="p-2.5 rounded-xl border border-[var(--border-color)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-bold text-[var(--text-main)] transition-all"
                    >
                      +1 Năm
                    </button>
                    <button
                      type="button"
                      onClick={handleSetLifetime}
                      className="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-extrabold transition-all"
                    >
                      ⚡ Vĩnh Viễn
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomRenewDate('')}
                      className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all"
                    >
                      Khóa / Xóa
                    </button>
                  </div>
                </div>

                {/* Chọn Ngày Cụ Thể */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-main)] mb-1.5">
                    Hoặc nhập ngày hết hạn chính xác:
                  </label>
                  <input
                    type="date"
                    value={customRenewDate}
                    onChange={e => setCustomRenewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Nút Thao Tác */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForRenew(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    disabled={savingRenew}
                    onClick={() => handleSaveRenew(customRenewDate ? `${customRenewDate}T23:59:59.000Z` : null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingRenew && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Lưu Kích Hoạt</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
