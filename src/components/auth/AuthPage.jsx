import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft, Shield } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

const COOLDOWN_SECONDS = 5

export default function AuthPage() {
  const { theme, switchTheme, THEMES } = useTheme()
  const isLight = theme === 'light'
  const logoVerticalSrc = isLight ? '/logo-vertical-light.png' : '/logo-vertical-dark.png'

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const redirectPath = searchParams.get('redirect') || '/'

  const [mode, setMode] = useState(initialMode) // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', confirmPassword: '' })

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register')
    }
  }, [searchParams])

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS)
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    if (cooldown > 0) return
    setLoading(true)
    startCooldown()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      setLoading(false)
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email hoặc mật khẩu không chính xác')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Tài khoản chưa được xác nhận email. Vui lòng kiểm tra hộp thư đến!')
        } else {
          toast.error(error.message || 'Đăng nhập thất bại')
        }
      } else {
        toast.success('Đăng nhập thành công!')
        navigate(redirectPath)
      }
    } catch (err) {
      setLoading(false)
      toast.error(err?.message || 'Có lỗi xảy ra khi kết nối máy chủ')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (cooldown > 0) return
    if (!form.full_name.trim()) {
      toast.error('Vui lòng nhập họ và tên')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    if (form.password.length < 6) {
      toast.error('Mật khẩu phải ít nhất 6 ký tự')
      return
    }
    setLoading(true)
    startCooldown()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
          }
        }
      })
      setLoading(false)
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập!')
          setMode('login')
        } else {
          toast.error(error.message || 'Đăng ký thất bại')
        }
      } else {
        if (data?.session) {
          toast.success('Đăng ký và đăng nhập thành công!')
          navigate(redirectPath)
        } else {
          toast.success('Đăng ký thành công! Bạn có thể thử đăng nhập ngay hoặc kiểm tra email xác nhận nếu có.')
          setMode('login')
        }
      }
    } catch (err) {
      setLoading(false)
      toast.error(err?.message || 'Có lỗi xảy ra khi kết nối máy chủ')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-md animate-fade-in my-auto py-8">
        {/* Thanh công cụ: Nút về trang chủ & Đổi theme */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Trang chủ FinGreen</span>
          </Link>

          {/* Nút chọn theme */}
          <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => switchTheme(t.id)}
                title={t.name}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  theme === t.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>{t.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LOGO DỌC FINGREEN (Tự đổi màu chữ FIN đen trên Light, trắng trên Dark) */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block hover:scale-105 transition-transform duration-200">
            <img 
              src={logoVerticalSrc} 
              alt="FinGreen - Kiến tạo giá trị thực" 
              className="w-36 sm:w-44 h-auto object-contain mx-auto drop-shadow-sm"
            />
          </Link>
          <p className="text-xs text-[var(--text-muted)] mt-3 font-medium">
            Nền tảng phân tích chứng khoán & dữ liệu đầu tư chuyên sâu
          </p>
        </div>

        {/* Auth Card đồng bộ màu phẳng 100% */}
        <div className="card shadow-xl p-6 sm:p-8 rounded-3xl border border-[var(--border-color)]">
          {/* Tabs Đăng Nhập / Đăng Ký */}
          <div className="flex bg-[var(--bg-subtle)] rounded-xl p-1 mb-6 border border-[var(--border-color)]">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email" name="email" required
                    value={form.email} onChange={handleChange}
                    placeholder="email@example.com"
                    className="input-field pl-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="label">Mật Khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" required
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10 text-xs sm:text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || cooldown > 0}
                className="btn-primary w-full flex items-center justify-center gap-2 text-xs sm:text-sm py-3 mt-2 font-bold">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                ) : cooldown > 0 ? (
                  `Vui lòng chờ ${cooldown}s (chống spam)...`
                ) : (
                  <><span>Đăng Nhập Ngay</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text" name="full_name" required
                    value={form.full_name} onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="input-field pl-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email" name="email" required
                    value={form.email} onChange={handleChange}
                    placeholder="email@example.com"
                    className="input-field pl-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="label">Mật Khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" required
                    value={form.password} onChange={handleChange}
                    placeholder="Ít nhất 6 ký tự"
                    className="input-field pl-10 pr-10 text-xs sm:text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Xác Nhận Mật Khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword" required
                    value={form.confirmPassword} onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    className="input-field pl-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || cooldown > 0}
                className="btn-primary w-full flex items-center justify-center gap-2 text-xs sm:text-sm py-3 mt-2 font-bold">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                ) : cooldown > 0 ? (
                  `Vui lòng chờ ${cooldown}s (chống spam)...`
                ) : (
                  <><span>Tạo Tài Khoản FinGreen</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          © {new Date().getFullYear()} FinGreen. Kiến Tạo Giá Trị Thực.
        </p>
      </div>
    </div>
  )
}
