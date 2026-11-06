import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, FileText, Handshake, Shield, LogOut,
  Menu, X, ChevronDown, User, Bell, TrendingUp, Newspaper
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Newspaper, label: 'Tin Tức & Phân Tích' },
  { path: '/hop-tac', icon: Handshake, label: 'Hợp Tác FinGreen' },
]

const PARTNER_NAV = [
  { path: '/dang-bai', icon: FileText, label: 'Đăng Bài Viết' },
]

const ADMIN_NAV = [
  { path: '/admin', icon: Shield, label: 'Quản Trị Hệ Thống' },
]

const ROLE_LABEL = {
  admin_fingreen: { label: 'Admin FinGreen', className: 'badge-purple' },
  doi_tac: { label: 'Đối Tác IB', className: 'badge-green' },
  cong_tac_vien: { label: 'Cộng Tác Viên', className: 'badge-yellow' },
  guest: { label: 'Thành Viên', className: 'badge-gray' },
}

export default function Navbar() {
  const { profile, signOut, isAdmin, canPost } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const allNav = [
    ...NAV_ITEMS,
    ...(canPost ? PARTNER_NAV : []),
    ...(isAdmin ? ADMIN_NAV : []),
  ]

  const roleInfo = ROLE_LABEL[profile?.role] || ROLE_LABEL.guest

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/25 transition-shadow">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-600 rounded-sm" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-lg leading-none">
                <span className="text-gray-100">FIN</span>
                <span className="text-green-500">GREEN</span>
              </span>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Kiến Tạo Giá Trị Thực</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {allNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 transition-all duration-200"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-200 leading-none">
                    {profile?.full_name || 'Người dùng'}
                  </p>
                  <span className={`text-[10px] ${roleInfo.className} px-1.5 py-0.5 rounded-full mt-0.5 inline-block`}>
                    {roleInfo.label}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-fade-in">
                  <div className="p-3 border-b border-gray-800">
                    <p className="text-sm font-semibold text-gray-200">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                    <span className={`text-xs ${roleInfo.className} mt-1 inline-block`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <div className="p-1">
                    <Link to="/ho-so" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                      <User className="w-4 h-4" />
                      Hồ Sơ Của Tôi
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" />
                      Đăng Xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-800 animate-fade-in">
            {allNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-all ${
                  isActive(item.path)
                    ? 'bg-primary-500/15 text-primary-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Overlay to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </nav>
  )
}
