import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Users, FileText, Shield, TrendingUp, CheckCircle, XCircle,
  Ban, Lock, Eye, Search, ChevronDown, AlertTriangle, Loader2,
  ClipboardList, UserCheck, UserX, Trash2, RefreshCw, Activity
} from 'lucide-react'

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

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-100 mb-2">Truy Cập Bị Từ Chối</h2>
        <p className="text-gray-400">Bạn không có quyền truy cập trang quản trị</p>
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
    // Update application status
    await supabase.from('partner_applications').update({
      status: 'approved',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', app.id)
    // Update user role
    await supabase.from('profiles').update({
      role: app.role_requested,
      is_approved: true,
      company_name: app.company_name,
    }).eq('id', app.user_id)
    toast.success('Đã phê duyệt đối tác!')
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
    fetchApplications()
  }

  const TABS = [
    { id: 'dashboard', label: 'Tổng Quan', icon: Activity },
    { id: 'users', label: 'Quản Lý Thành Viên', icon: Users },
    { id: 'posts', label: 'Duyệt Bài Viết', icon: FileText, badge: stats.pending },
    { id: 'applications', label: 'Đơn Hợp Tác', icon: ClipboardList, badge: stats.applications },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gradient">Quản Trị Hệ Thống</h1>
          <p className="text-sm text-gray-500">FinGreen Admin Panel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all relative ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Tổng Thành Viên', value: stats.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Bài Đã Đăng', value: stats.posts, icon: FileText, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Chờ Duyệt Bài', value: stats.pending, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Đơn Hợp Tác', value: stats.applications, icon: ClipboardList, color: 'text-primary-400', bg: 'bg-primary-500/10' },
            ].map((s, i) => (
              <div key={i} className="card">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="card text-center py-10">
            <TrendingUp className="w-12 h-12 text-primary-400 mx-auto mb-3" />
            <p className="text-gray-400">Chào mừng đến trang quản trị FinGreen</p>
            <p className="text-sm text-gray-600 mt-1">Chọn tab ở trên để bắt đầu quản lý</p>
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" placeholder="Tìm theo tên hoặc email..."
                value={searchUser} onChange={e => setSearchUser(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button onClick={fetchUsers} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Làm Mới
            </button>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Thành Viên</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Vai Trò</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Trạng Thái</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Ngày Tham Gia</th>
                    <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Đang tải...
                    </td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-800/30 transition-colors ${u.is_banned ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-white font-bold">{u.full_name?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-200">{u.full_name || 'Chưa cập nhật'}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={e => updateUserRole(u.id, e.target.value)}
                          disabled={u.id === profile.id}
                          className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {u.is_banned && <span className="badge-red text-[10px]">🔒 Bị Khóa</span>}
                          {u.is_approved && <span className="badge-green text-[10px]">✓ Đã Duyệt</span>}
                          {!u.is_banned && !u.is_approved && <span className="badge-gray text-[10px]">Bình Thường</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {u.id !== profile.id && (
                            <>
                              <button
                                onClick={() => toggleApproved(u)}
                                title={u.is_approved ? 'Thu hồi phê duyệt' : 'Phê duyệt'}
                                className={`p-1.5 rounded-lg transition-colors text-xs ${
                                  u.is_approved
                                    ? 'text-yellow-400 hover:bg-yellow-500/10'
                                    : 'text-green-400 hover:bg-green-500/10'
                                }`}
                              >
                                {u.is_approved ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => toggleBan(u)}
                                title={u.is_banned ? 'Mở khóa' : 'Khóa tài khoản'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.is_banned
                                    ? 'text-green-400 hover:bg-green-500/10'
                                    : 'text-red-400 hover:bg-red-500/10'
                                }`}
                              >
                                {u.is_banned ? <Lock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                          {u.id === profile.id && (
                            <span className="text-xs text-gray-600 italic">Bạn</span>
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

      {/* POSTS */}
      {activeTab === 'posts' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">{posts.length} bài viết</p>
            <button onClick={fetchPosts} className="btn-secondary text-sm py-1.5 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </button>
          </div>
          {loading ? (
            <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></div>
          ) : posts.map(post => (
            <div key={post.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`${POST_STATUS_BADGE[post.status]} text-xs`}>
                      {POST_STATUS_LABEL[post.status]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {post.profiles?.full_name || 'Unknown'} •{' '}
                      {new Date(post.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-100 mb-1 truncate">{post.title}</h3>
                  {post.summary && <p className="text-sm text-gray-500 line-clamp-1">{post.summary}</p>}
                  {post.hashtags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {post.hashtags.map(h => (
                        <span key={h} className="text-[10px] badge-purple">#{h}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {post.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updatePostStatus(post.id, 'published')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/25 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt('Lý do từ chối:')
                          if (reason !== null) updatePostStatus(post.id, 'rejected', reason)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/25 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Từ Chối
                      </button>
                    </>
                  )}
                  {post.status === 'published' && (
                    <button
                      onClick={() => updatePostStatus(post.id, 'rejected', 'Gỡ bởi Admin')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/25 transition-colors"
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

      {/* APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">{applications.length} đơn đăng ký</p>
            <button onClick={fetchApplications} className="btn-secondary text-sm py-1.5 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </button>
          </div>
          {loading ? (
            <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></div>
          ) : applications.length === 0 ? (
            <div className="card text-center py-10">
              <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có đơn đăng ký nào</p>
            </div>
          ) : applications.map(app => (
            <div key={app.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs ${
                      app.status === 'pending' ? 'badge-yellow' :
                      app.status === 'approved' ? 'badge-green' : 'badge-red'
                    }`}>
                      {app.status === 'pending' ? 'Chờ Duyệt' : app.status === 'approved' ? 'Đã Duyệt' : 'Từ Chối'}
                    </span>
                    <span className={`text-xs ${ROLE_BADGE[app.role_requested]} `}>
                      {ROLE_LABEL[app.role_requested]}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-100">{app.full_name}</h3>
                  <p className="text-sm text-gray-400">{app.email} {app.phone && `• ${app.phone}`}</p>
                  {app.company_name && <p className="text-sm text-gray-500">🏢 {app.company_name}</p>}
                  {app.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{app.description}</p>}
                  <p className="text-xs text-gray-600 mt-2">
                    {new Date(app.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </p>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approveApplication(app)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/25 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button onClick={() => rejectApplication(app.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/25 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Từ Chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
