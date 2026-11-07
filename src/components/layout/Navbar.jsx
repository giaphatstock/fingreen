import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
  FileText, Handshake, Shield, LogOut, Menu, X, ChevronDown,
  User, Newspaper, Palette, LogIn, ExternalLink, Sparkles
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
  const { user, profile, signOut, isAdmin, canPost } = useAuth()
  const { theme, switchTheme, THEMES } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const allNav = [
    ...NAV_ITEMS,
    ...(canPost ? PARTNER_NAV : []),
    ...(isAdmin ? ADMIN_NAV : []),
  ]

  const roleInfo = ROLE_LABEL[profile?.role] || ROLE_LABEL.guest
  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo FinGreen */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 px-1 py-0.5 bg-white rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden">
              <img 
                src="/logo.png" 
                alt="FinGreen - Kiến tạo giá trị thực" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="hidden lg:block text-left">
              <span className="font-extrabold text-sm tracking-wider uppercase block leading-tight text-gradient">
                FinGreen
              </span>
              <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5 font-medium">
                Kiến tạo giá trị thực
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {allNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side: Social channels, Theme switcher, User menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Social channels: TikTok & YouTube */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@fingreenvn?_r=1&_t=ZS-9BCMKxpo7yT"
                target="_blank"
                rel="noopener noreferrer"
                title="Kênh TikTok FinGreen"
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-[var(--text-muted)] hover:text-black hover:bg-white transition-all group"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.5V8.85a8.28 8.28 0 0 0 5.21 1.84V7.24a4.84 4.84 0 0 1-1.3-.55z"/>
                </svg>
                <span className="hidden xl:inline">TikTok</span>
              </a>

              {/* YouTube */}
              <a
                href="https://m.youtube.com/@greeninvestmentvn?si=-4DoUDMlBDVCRIOi"
                target="_blank"
                rel="noopener noreferrer"
                title="Kênh YouTube Green Investment"
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all group"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="hidden xl:inline">YouTube</span>
              </a>
            </div>

            {/* Theme Switcher Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setThemeMenuOpen(o => !o)
                  setUserMenuOpen(false)
                }}
                title="Đổi giao diện"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-sm transition-all"
              >
                <span className="text-base">{currentTheme.icon}</span>
                <span className="hidden md:inline text-xs font-medium text-[var(--text-muted)]">{currentTheme.name}</span>
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
              </button>

              {themeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 card p-2 z-50 animate-fade-in shadow-2xl">
                  <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-primary-400" /> Chọn Giao Diện
                    </p>
                  </div>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchTheme(t.id)
                        setThemeMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all mb-1 ${
                        theme === t.id
                          ? 'bg-primary-500/15 border border-primary-500/40 text-primary-400 font-semibold'
                          : 'hover:bg-[var(--bg-subtle)] text-[var(--text-main)]'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold">{t.name}</p>
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: t.bgPreview }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons OR User Profile Menu */}
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dang-nhap"
                  className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(o => !o)
                    setThemeMenuOpen(false)
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] transition-all"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'Avatar'}
                      className="w-7 h-7 rounded-lg object-cover border border-primary-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-xs text-white font-bold">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold leading-none truncate max-w-[110px]">
                      {profile?.full_name || 'Người dùng'}
                    </p>
                    <span className={`text-[10px] ${roleInfo.className} px-1.5 py-0.5 rounded-full mt-0.5 inline-block`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card p-1 z-50 animate-fade-in shadow-2xl">
                    <div className="p-3 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-2.5 mb-2">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-primary-500/40"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {profile?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">{profile?.full_name}</p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{profile?.email}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] ${roleInfo.className}`}>
                        {roleInfo.label}
                      </span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <Link
                        to="/ho-so"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors font-medium"
                      >
                        <User className="w-4 h-4 text-primary-400" />
                        Hồ Sơ Của Tôi
                      </Link>
                      {canPost && (
                        <Link
                          to="/dang-bai"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors font-medium"
                        >
                          <FileText className="w-4 h-4 text-green-400" />
                          Đăng Bài Phân Tích
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors font-medium"
                        >
                          <Shield className="w-4 h-4 text-primary-400" />
                          Quản Trị Hệ Thống
                        </Link>
                      )}
                      <div className="border-t border-[var(--border-color)] my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng Xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-[var(--border-color)] animate-fade-in space-y-1">
            {allNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-primary-500/15 text-primary-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}

            {/* Social channels on mobile */}
            <div className="pt-2 border-t border-[var(--border-color)] flex gap-2 px-2">
              <a
                href="https://www.tiktok.com/@fingreenvn?_r=1&_t=ZS-9BCMKxpo7yT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-main)]"
              >
                TikTok FinGreen
              </a>
              <a
                href="https://m.youtube.com/@greeninvestmentvn?si=-4DoUDMlBDVCRIOi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--bg-subtle)] text-xs font-semibold text-red-400"
              >
                YouTube FinGreen
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop overlay */}
      {(userMenuOpen || themeMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => {
            setUserMenuOpen(false)
            setThemeMenuOpen(false)
          }}
        />
      )}
    </nav>
  )
}
