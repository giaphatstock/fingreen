import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'
import {
  FileText, Handshake, Shield, LogOut, Menu, X, ChevronDown,
  User, Newspaper, Palette, LogIn, ExternalLink, Sparkles, Bot
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Newspaper, label: 'Tin Tức & Phân Tích' },
  { path: '/hop-tac', icon: Handshake, label: 'Hợp Tác FinGreen' },
  { path: '/ai', icon: Bot, label: 'FinGreen AI', requireAuth: true },
]

const PARTNER_NAV = [
  { path: '/dang-bai', icon: FileText, label: 'Đăng Bài Viết' },
]

const ADMIN_NAV = [
  { path: '/admin', icon: Shield, label: 'Quản Trị Hệ Thống' },
]

const ROLE_INFO = {
  admin_fingreen: {
    label: 'Admin FinGreen',
    badgeClass: 'bg-primary-500/20 text-primary-300 border border-primary-500/40',
    colorText: 'text-primary-400',
  },
  doi_tac: {
    label: 'Đối Tác IB',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    colorText: 'text-emerald-400',
  },
  cong_tac_vien: {
    label: 'Cộng Tác Viên',
    badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    colorText: 'text-amber-400',
  },
  guest: {
    label: 'Thành Viên',
    badgeClass: 'bg-gray-500/20 text-gray-300 border border-gray-500/40',
    colorText: 'text-[var(--text-muted)]',
  },
}

export default function Navbar() {
  const { user, profile, signOut, isAdmin, canPost } = useAuth()
  const { theme, switchTheme, THEMES } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  const isLight = theme === 'light'
  const logoSrc = isLight ? '/logo-horizontal-light.png' : '/logo-horizontal-dark.png'

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

  const role = ROLE_INFO[profile?.role] || ROLE_INFO.guest
  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* LOGO FINGREEN TO RÕ, SẮC NÉT (Không còn bị nhỏ) */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group py-0.5">
            <img
              src={logoSrc}
              alt="FinGreen - Kiến tạo giá trị thực"
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {allNav.map(item => {
              const active = isActive(item.path)
              const handleClick = (e) => {
                if (item.requireAuth && !user) {
                  e.preventDefault()
                  toast('Vui lòng đăng nhập để sử dụng FinGreen AI', { icon: '🔒' })
                  navigate(`/dang-nhap?redirect=${encodeURIComponent(item.path)}`)
                }
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleClick}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                    active
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? 'text-primary-400' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right Section: Socials, Theme Switcher, Account User */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Social Channels: TikTok & YouTube icon pills */}
            <div className="hidden md:flex items-center gap-1 px-1.5 py-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <a
                href="https://www.tiktok.com/@fingreenvn?_r=1&_t=ZS-9BCMKxpo7yT"
                target="_blank"
                rel="noopener noreferrer"
                title="Kênh TikTok @fingreenvn"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-black hover:bg-white transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.5V8.85a8.28 8.28 0 0 0 5.21 1.84V7.24a4.84 4.84 0 0 1-1.3-.55z"/>
                </svg>
              </a>
              <div className="w-px h-3.5 bg-[var(--border-color)]" />
              <a
                href="https://m.youtube.com/@greeninvestmentvn?si=-4DoUDMlBDVCRIOi"
                target="_blank"
                rel="noopener noreferrer"
                title="Kênh YouTube Green Investment"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-semibold transition-all"
              >
                <span className="text-sm">{currentTheme.icon}</span>
                <span className="hidden sm:inline text-[11px] text-[var(--text-muted)]">{currentTheme.name}</span>
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
              </button>

              {themeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 card p-2 z-50 animate-fade-in shadow-2xl">
                  <div className="px-3 py-1.5 border-b border-[var(--border-color)] mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <Palette className="w-3 h-3 text-primary-400" /> Giao Diện
                    </p>
                  </div>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchTheme(t.id)
                        setThemeMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all mb-1 ${
                        theme === t.id
                          ? 'bg-primary-500/15 border border-primary-500/40 text-primary-400 font-bold'
                          : 'hover:bg-[var(--bg-subtle)] text-[var(--text-main)]'
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold truncate">{t.name}</p>
                          <span
                            className="w-3 h-3 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: t.bgPreview }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* USER PROFILE HOẶC NÚT ĐĂNG NHẬP */}
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dang-nhap"
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-md"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </Link>
              </div>
            ) : (
              /* NÚT TÀI KHOẢN TINH CHỈNH SANG TRỌNG (Khắc phục lỗi hiển thị ở ảnh 2) */
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(o => !o)
                    setThemeMenuOpen(false)
                  }}
                  className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-primary-500/40 transition-all duration-150 group shadow-sm"
                >
                  {/* Avatar tròn viền gọn gàng */}
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'Avatar'}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-primary-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  {/* Thông tin tên & role được căn chỉnh tinh tế */}
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-xs font-bold text-[var(--text-main)] truncate max-w-[120px]">
                      {profile?.full_name || 'Người dùng'}
                    </p>
                    <p className={`text-[10px] font-semibold ${role.colorText} mt-0.5`}>
                      {role.label}
                    </p>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Chuyên Nghiệp */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 card p-1.5 z-50 animate-fade-in shadow-2xl border border-[var(--border-color)]">
                    {/* Header thông tin người dùng */}
                    <div className="p-3 bg-[var(--bg-subtle)] rounded-xl mb-1.5 border border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                            {profile?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-[var(--text-main)]">
                            {profile?.full_name || 'Người dùng FinGreen'}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                            {profile?.email}
                          </p>
                          <div className="mt-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${role.badgeClass}`}>
                              {role.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách hành động */}
                    <div className="p-1 space-y-0.5">
                      <Link
                        to="/ho-so"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4 text-primary-400" />
                        <span>Hồ Sơ Của Tôi</span>
                      </Link>

                      {canPost && (
                        <Link
                          to="/dang-bai"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span>Đăng Bài Phân Tích</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4 text-primary-400" />
                          <span>Quản Trị Hệ Thống</span>
                        </Link>
                      )}

                      <div className="border-t border-[var(--border-color)] my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng Xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="lg:hidden py-3 border-t border-[var(--border-color)] animate-fade-in space-y-1">
            {allNav.map(item => {
              const handleMobileClick = (e) => {
                setMenuOpen(false)
                if (item.requireAuth && !user) {
                  e.preventDefault()
                  toast('Vui lòng đăng nhập để sử dụng FinGreen AI', { icon: '🔒' })
                  navigate(`/dang-nhap?redirect=${encodeURIComponent(item.path)}`)
                }
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleMobileClick}
                  className={`flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive(item.path)
                      ? 'bg-primary-500/15 text-primary-400'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            <div className="pt-2 border-t border-[var(--border-color)] flex gap-2 px-1">
              <a
                href="https://www.tiktok.com/@fingreenvn?_r=1&_t=ZS-9BCMKxpo7yT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black text-white text-xs font-bold shadow-sm"
              >
                TikTok @fingreenvn
              </a>
              <a
                href="https://m.youtube.com/@greeninvestmentvn?si=-4DoUDMlBDVCRIOi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm"
              >
                YouTube Green
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop overlay */}
      {(userMenuOpen || themeMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => {
            setUserMenuOpen(false)
            setThemeMenuOpen(false)
          }}
        />
      )}
    </nav>
  )
}
