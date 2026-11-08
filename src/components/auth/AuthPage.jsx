import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft, Shield, KeyRound, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import SecurityCaptcha from './SecurityCaptcha'
import toast from 'react-hot-toast'

const COOLDOWN_SECONDS = 5
const OTP_RESEND_SECONDS = 60

export default function AuthPage() {
  const { theme, switchTheme, THEMES } = useTheme()
  const isLight = theme === 'light'
  const logoVerticalSrc = isLight ? '/logo-vertical-light.png' : '/logo-vertical-dark.png'

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const redirectPath = searchParams.get('redirect') || '/'

  const [mode, setMode] = useState(initialMode) // 'login' | 'register' | 'otp'
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', confirmPassword: '' })

  // State cho mã Captcha chống spam
  const [captchaInput, setCaptchaInput] = useState('')
  const [isCaptchaValid, setIsCaptchaValid] = useState(false)

  // State cho xác thực mã OTP 6 số
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const otpRefs = useRef([])

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register')
    }
  }, [searchParams])

  // Đếm ngược chống spam đăng nhập / đăng ký
  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS)
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // Đếm ngược gửi lại mã OTP (60s)
  const startOtpCooldown = () => {
    setOtpCooldown(OTP_RESEND_SECONDS)
    const interval = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // Xử lý đăng nhập
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
          // Người dùng chưa kích hoạt email -> Chuyển ngay sang màn hình nhập OTP và gửi lại mã
          const unconfirmedEmail = form.email.trim()
          setPendingEmail(unconfirmedEmail)
          setMode('otp')
          startOtpCooldown()
          try {
            await supabase.auth.resend({
              type: 'signup',
              email: unconfirmedEmail,
              options: {
                emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dang-nhap` : undefined
              }
            })
            toast('Tài khoản chưa được kích hoạt. Mã OTP mới đã được gửi tới email của bạn!', {
              icon: '🔐',
              duration: 5000
            })
          } catch (_) {
            toast.error('Tài khoản chưa xác nhận email. Vui lòng nhập mã OTP đã nhận!')
          }
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

  // Xử lý đăng ký tài khoản mới kèm Captcha & gửi OTP
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
    // Kiểm tra Captcha chống bot spam
    if (!isCaptchaValid) {
      toast.error('Vui lòng nhập chính xác mã bảo vệ Captcha (5 ký tự)')
      return
    }

    setLoading(true)
    startCooldown()
    const targetEmail = form.email.trim()

    try {
      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password: form.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dang-nhap` : undefined,
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
        // Nếu dự án đã bật Email Confirmation (yêu cầu xác thực OTP):
        if (!data?.session) {
          setPendingEmail(targetEmail)
          setOtpDigits(['', '', '', '', '', ''])
          setMode('otp')
          startOtpCooldown()
          toast.success('Mã xác thực 6 số đã được gửi đến email của bạn!')
        } else {
          // Trường hợp Supabase chưa bật xác thực bắt buộc
          toast.success('Đăng ký và kích hoạt tài khoản thành công!')
          navigate(redirectPath)
        }
      }
    } catch (err) {
      setLoading(false)
      toast.error(err?.message || 'Có lỗi xảy ra khi kết nối máy chủ')
    }
  }

  // Xử lý thay đổi từng ô số OTP
  const handleOtpChange = (index, value) => {
    // Chỉ chấp nhận số hoặc chữ cái
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '')
    if (!cleaned && value !== '') return

    const newDigits = [...otpDigits]
    newDigits[index] = cleaned.slice(-1) // Chỉ lấy ký tự cuối cùng
    setOtpDigits(newDigits)

    // Tự động nhảy sang ô tiếp theo nếu đã nhập
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  // Xử lý phím Backspace lùi ô
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Xử lý khi người dùng dán (Paste) cả chuỗi 6 ký tự
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim().replace(/[^a-zA-Z0-9]/g, '')
    if (!pasted) return

    const newDigits = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setOtpDigits(newDigits)

    // Focus vào ô cuối cùng hoặc ô trống tiếp theo
    const nextIdx = Math.min(pasted.length, 5)
    otpRefs.current[nextIdx]?.focus()
  }

  // Xác thực mã OTP gửi về email
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const token = otpDigits.join('').trim()
    if (token.length < 6) {
      toast.error('Vui lòng nhập đủ 6 ký tự mã xác thực')
      return
    }

    setVerifyLoading(true)
    try {
      // 1. Thử verify với type 'signup'
      let { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: token,
        type: 'signup',
      })

      // 2. Nếu type 'signup' không khớp, thử fallback type 'email'
      if (error) {
        const retry = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token: token,
          type: 'email',
        })
        if (!retry.error) {
          data = retry.data
          error = null
        }
      }

      setVerifyLoading(false)

      if (error) {
        if (error.message.includes('Token has expired') || error.message.includes('invalid')) {
          toast.error('Mã xác thực không chính xác hoặc đã hết hạn. Vui lòng bấm gửi lại mã!')
        } else {
          toast.error(error.message || 'Xác thực OTP thất bại')
        }
      } else {
        toast.success('Kích hoạt tài khoản FinGreen thành công! Chào mừng bạn.')
        navigate(redirectPath)
      }
    } catch (err) {
      setVerifyLoading(false)
      toast.error(err?.message || 'Lỗi kết nối khi xác thực OTP')
    }
  }

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (otpCooldown > 0 || resendLoading) return
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dang-nhap` : undefined
        }
      })
      setResendLoading(false)
      if (error) {
        toast.error(error.message || 'Không thể gửi lại mã OTP')
      } else {
        startOtpCooldown()
        toast.success(`Đã gửi lại mã xác thực mới tới ${pendingEmail}!`)
      }
    } catch (err) {
      setResendLoading(false)
      toast.error('Lỗi khi gửi lại mã OTP')
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

        {/* LOGO DỌC FINGREEN */}
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

        {/* Auth Card */}
        <div className="card shadow-xl p-6 sm:p-8 rounded-3xl border border-[var(--border-color)]">
          {mode !== 'otp' ? (
            <>
              {/* Tabs Đăng Nhập / Đăng Ký */}
              <div className="flex bg-[var(--bg-subtle)] rounded-xl p-1 mb-6 border border-[var(--border-color)]">
                <button
                  type="button"
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
                  type="button"
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
                    className="btn-primary w-full flex items-center justify-center gap-2 text-xs sm:text-sm py-3 mt-2 font-bold shadow-lg shadow-primary-500/20">
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

                  {/* Widget Captcha Chống Spam Bot Hàng Loạt */}
                  <div className="pt-1">
                    <SecurityCaptcha
                      value={captchaInput}
                      onChange={setCaptchaInput}
                      onValidityChange={setIsCaptchaValid}
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" disabled={loading || cooldown > 0 || !isCaptchaValid}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-xs sm:text-sm py-3 mt-2 font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                    ) : cooldown > 0 ? (
                      `Vui lòng chờ ${cooldown}s (chống spam)...`
                    ) : (
                      <><span>Tiếp Tục & Nhận Mã Xác Thực</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Màn hình Nhập Mã Xác Thực OTP 6 Số */
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/40 text-primary-400 mx-auto flex items-center justify-center shadow-inner">
                  <KeyRound className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
                  Nhập Mã Xác Thực 6 Số
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Mã OTP kích hoạt tài khoản đã được gửi đến:
                </p>
                <div className="inline-block px-3 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-color)] font-mono text-xs font-bold text-emerald-400">
                  {pendingEmail}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]/80 italic">
                  (Vui lòng kiểm tra kỹ cả mục Hộp thư đến và mục Thư rác / Spam)
                </p>
              </div>

              {/* 6 Ô Nhập Mã OTP */}
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpRefs.current[idx] = el}
                      type="text"
                      inputMode="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-extrabold font-mono rounded-xl sm:rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner uppercase"
                    />
                  ))}
                </div>

                {/* Nút Xác Nhận Kích Hoạt */}
                <button
                  type="submit"
                  disabled={verifyLoading || otpDigits.join('').length < 6}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-xs sm:text-sm py-3 font-bold shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /><span>Kích Hoạt Tài Khoản</span></>
                  )}
                </button>

                {/* Gửi Lại Mã OTP hoặc Đổi Email */}
                <div className="pt-2 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpCooldown > 0 || resendLoading}
                    className="inline-flex items-center gap-1.5 font-bold text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendLoading ? 'Đang gửi lại...' : otpCooldown > 0 ? `Gửi lại mã sau ${otpCooldown}s` : 'Gửi lại mã xác thực'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register')
                      setOtpDigits(['', '', '', '', '', ''])
                    }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  >
                    ← Đổi địa chỉ email khác
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          © {new Date().getFullYear()} FinGreen. Kiến Tạo Giá Trị Thực.
        </p>
      </div>
    </div>
  )
}
