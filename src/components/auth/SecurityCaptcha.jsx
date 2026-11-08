import React, { useState, useEffect, useRef } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'

// Bộ ký tự dễ đọc, tránh nhầm lẫn giữa 0/O, 1/I/l
const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export default function SecurityCaptcha({
  value = '',
  onChange,
  onValidityChange,
  disabled = false
}) {
  const canvasRef = useRef(null)
  const [captchaText, setCaptchaText] = useState('')
  const [isRotating, setIsRotating] = useState(false)

  // Tạo chuỗi Captcha ngẫu nhiên 5 ký tự
  const generateCaptchaText = () => {
    let text = ''
    for (let i = 0; i < 5; i++) {
      text += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    }
    return text
  }

  // Vẽ Captcha lên Canvas với hiệu ứng làm méo và nhiễu chống bot
  const drawCaptcha = (text) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Nền tối chuẩn FinGreen
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, width, height)

    // Đường kẻ nhiễu ngẫu nhiên
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 200 + 55)}, ${Math.floor(Math.random() * 200 + 55)}, ${Math.floor(Math.random() * 200 + 55)}, 0.4)`
      ctx.lineWidth = Math.random() * 2 + 1
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.stroke()
    }

    // Các điểm chấm nhiễu ngẫu nhiên
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.1})`
      ctx.beginPath()
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Vẽ từng ký tự với góc xoay ngẫu nhiên
    const colors = ['#34d399', '#38bdf8', '#fbbf24', '#a78bfa', '#f472b6', '#4ade80']
    const charSpacing = width / (text.length + 1)

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const angle = (Math.random() - 0.5) * 0.45 // Xoay -15 đến +15 độ
      const x = (i + 1) * charSpacing
      const y = height / 2 + Math.random() * 6 - 3

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.font = 'bold 22px "Courier New", monospace, sans-serif'
      ctx.fillStyle = colors[i % colors.length]
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 4
      ctx.fillText(char, 0, 0)
      ctx.restore()
    }
  }

  const refreshCaptcha = () => {
    setIsRotating(true)
    const newText = generateCaptchaText()
    setCaptchaText(newText)
    setTimeout(() => {
      drawCaptcha(newText)
      setIsRotating(false)
    }, 50)
    if (onChange) onChange('')
    if (onValidityChange) onValidityChange(false)
  }

  useEffect(() => {
    refreshCaptcha()
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase().trim()
    if (onChange) onChange(val)
    const isValid = val === captchaText
    if (onValidityChange) onValidityChange(isValid)
  }

  const isMatched = value.length === 5 && value.toUpperCase() === captchaText

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
          <span>Mã Bảo Mật Chống Spam (Captcha)</span>
        </label>
        {isMatched && (
          <span className="text-[10px] font-bold text-emerald-400 animate-fade-in flex items-center gap-1">
            ✓ Đã xác thực
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Khung hiển thị Canvas Captcha */}
        <div className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-[#111827] shadow-inner flex-shrink-0">
          <canvas
            ref={canvasRef}
            width={130}
            height={42}
            className="block select-none"
            title="Mã Captcha bảo vệ"
          />
        </div>

        {/* Nút đổi mã Captcha */}
        <button
          type="button"
          onClick={refreshCaptcha}
          disabled={disabled}
          title="Đổi mã bảo mật khác"
          className="p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-primary-400 transition-all flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin text-primary-400' : ''}`} />
        </button>

        {/* Ô nhập mã Captcha */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            maxLength={5}
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="Nhập 5 ký tự..."
            className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border text-xs sm:text-sm font-mono tracking-widest uppercase transition-all focus:outline-none ${
              isMatched
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold'
                : value.length === 5
                ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold'
                : 'border-[var(--border-color)] text-[var(--text-main)] focus:border-primary-400'
            }`}
          />
        </div>
      </div>
    </div>
  )
}
