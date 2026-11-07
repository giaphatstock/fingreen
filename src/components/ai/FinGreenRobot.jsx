import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Bot, X, Send, Maximize2, Settings, Sparkles, Loader2,
  TrendingUp, RefreshCw, Key, HelpCircle, Lock, ArrowRight
} from 'lucide-react'
import {
  sendChatMessage, getOpenRouterKey, saveOpenRouterKey,
  getSelectedModel, saveSelectedModel, AVAILABLE_MODELS
} from '../../services/aiService'
import { DNSE_PROMPT_LIBRARY } from '../../services/dnseService'
import toast from 'react-hot-toast'

export default function FinGreenRobot() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Trạng thái mở/đóng cửa sổ chat mini
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Vị trí con robot (Draggable)
  const [position, setPosition] = useState(() => {
    // Vị trí mặc định ở góc dưới bên phải
    return { x: window.innerWidth - 84, y: window.innerHeight - 96 }
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false })

  // Trạng thái tin nhắn chat
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là **FinGreen AI**, trợ lý phân tích chứng khoán tích hợp dữ liệu **DNSE MCP Studio** và **OpenRouter**.\n\nTôi có thể giúp bạn phân tích mã cổ phiếu, báo cáo tài chính, dòng tiền ngành hay kiểm thử chiến thuật đầu tư!',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Cấu hình AI
  const [apiKey, setApiKey] = useState(getOpenRouterKey())
  const [selectedModel, setSelectedModel] = useState(getSelectedModel())

  const chatEndRef = useRef(null)

  // Tự cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Cập nhật vị trí khi resize màn hình
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 76),
        y: Math.min(prev.y, window.innerHeight - 86)
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Xử lý kéo chuột (Drag)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Chỉ nhận chuột trái
    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      hasMoved: false
    }
  }

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setIsDragging(true)
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y,
      hasMoved: false
    }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - dragStartRef.current.startX
      const deltaY = e.clientY - dragStartRef.current.startY

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragStartRef.current.hasMoved = true
      }

      // Giới hạn trong viewport
      const newX = Math.max(16, Math.min(window.innerWidth - 76, dragStartRef.current.initialX + deltaX))
      const newY = Math.max(16, Math.min(window.innerHeight - 86, dragStartRef.current.initialY + deltaY))

      setPosition({ x: newX, y: newY })
    }

    const handleTouchMove = (e) => {
      if (!isDragging) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStartRef.current.startX
      const deltaY = touch.clientY - dragStartRef.current.startY

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragStartRef.current.hasMoved = true
      }

      const newX = Math.max(16, Math.min(window.innerWidth - 76, dragStartRef.current.initialX + deltaX))
      const newY = Math.max(16, Math.min(window.innerHeight - 86, dragStartRef.current.initialY + deltaY))

      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging])

  // Click vào con robot
  const handleRobotClick = () => {
    // Nếu vừa kéo chuột di chuyển thì không kích hoạt mở đóng
    if (dragStartRef.current.hasMoved) return
    setIsOpen(prev => !prev)
  }

  // Gửi tin nhắn
  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    setInput('')
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const reply = await sendChatMessage({
        messages,
        prompt: text,
        model: selectedModel
      })

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      toast.error('Có lỗi khi trò chuyện với AI: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = (e) => {
    e.preventDefault()
    saveOpenRouterKey(apiKey)
    saveSelectedModel(selectedModel)
    setShowSettings(false)
    toast.success('Đã lưu cấu hình AI thành công!')
  }

  // Tính toán vị trí hiển thị cửa sổ chat (tránh tràn mép)
  const chatWindowStyle = {
    position: 'fixed',
    bottom: `${Math.max(16, window.innerHeight - position.y + 12)}px`,
    right: `${Math.max(16, window.innerWidth - position.x - 48)}px`,
    maxHeight: 'min(640px, 80vh)',
    width: 'min(420px, calc(100vw - 32px))',
  }

  return (
    <>
      {/* 1. CON ROBOT TRÒN CHUYỂN ĐỘNG - KÉO THẢ DRAGGABLE */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleRobotClick}
        className={`group cursor-grab active:cursor-grabbing select-none transition-transform duration-150 ${
          isDragging ? 'scale-110 shadow-2xl' : 'hover:scale-105'
        }`}
        title="FinGreen AI Assistant (Kéo chuột để di chuyển - Click để chat)"
      >
        <div className="relative">
          {/* Hiệu ứng hào quang phát sáng Pulse */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-500 via-purple-500 to-indigo-500 rounded-full blur-md opacity-75 group-hover:opacity-100 animate-pulse transition-opacity" />

          {/* Vỏ ngoài con Robot */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#5154F0] via-[#4338CA] to-[#1E1B4B] border-2 border-white/40 shadow-xl flex items-center justify-center overflow-hidden">
            
            {/* Khuôn mặt Robot */}
            <div className="flex flex-col items-center justify-center">
              {/* Đôi mắt LED AI thông minh */}
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              </div>
              {/* Miệng LED âm thanh */}
              <div className="w-4 sm:w-5 h-1 bg-cyan-200/80 rounded-full shadow-[0_0_6px_#22d3ee]" />
            </div>

            {/* Huy hiệu AI phát sáng */}
            <span className="absolute bottom-1 px-1.5 py-0.2 bg-emerald-500 text-white font-extrabold text-[8px] sm:text-[9px] rounded-full shadow-sm tracking-tighter">
              AI
            </span>
          </div>

          {/* Tooltip nhỏ khi hover */}
          {!isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/85 text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl whitespace-nowrap shadow-lg backdrop-blur-md border border-white/10 hidden sm:block">
              🤖 FinGreen AI (DNSE MCP)
            </div>
          )}
        </div>
      </div>

      {/* 2. CỬA SỔ CHAT NHỎ (CHAT MINI WINDOW) */}
      {isOpen && (
        <div
          style={chatWindowStyle}
          className="z-[9998] flex flex-col rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl"
        >
          {/* Header Cửa sổ Chat */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 text-white flex items-center justify-between border-b border-white/10 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  FinGreen AI
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                    DNSE MCP
                  </span>
                </h3>
                <p className="text-[10px] text-white/80 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Trực tuyến • Phân tích cổ phiếu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              {/* Nút Cài đặt API */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Cài đặt OpenRouter API Key & Model"
                className="p-1.5 rounded-lg hover:bg-white/15 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Nút Toàn Màn hình */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  if (!user) {
                    toast('Vui lòng đăng nhập để mở FinGreen AI Pro Workspace', { icon: '🔒' })
                    navigate('/dang-nhap?redirect=/ai')
                  } else {
                    navigate('/ai')
                  }
                }}
                title="Mở toàn màn hình FinGreen AI"
                className="p-1.5 rounded-lg hover:bg-white/15 hover:text-white transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Nút Đóng */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal cài đặt nhanh OpenRouter */}
          {showSettings && (
            <div className="p-4 bg-[var(--bg-subtle)] border-b border-[var(--border-color)] text-xs space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-main)] flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-primary-400" /> Cấu Hình OpenRouter & DNSE
                </span>
                <button onClick={() => setShowSettings(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">OpenRouter API Key (Tùy chọn)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="input-field py-1.5 px-3 text-xs w-full"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Nếu để trống, hệ thống sẽ tự động dùng bộ dữ liệu DNSE MCP Studio phân tích trực tiếp.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Mô Hình AI (Model)</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="input-field py-1.5 px-2 text-xs w-full"
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="btn-primary py-1.5 px-4 text-xs font-semibold"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          )}

          {/* KIỂM TRA ĐĂNG NHẬP: CHỈ LOGIN MỚI ĐƯỢC DÙNG HOẶC CHAT */}
          {!user ? (
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 my-auto min-h-[300px]">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center shadow-inner">
                <Lock className="w-7 h-7 text-primary-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[var(--text-main)]">
                  Yêu Cầu Đăng Nhập Tài Khoản
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Để sử dụng Trợ lý <strong>FinGreen AI</strong> phân tích dữ liệu <strong>DNSE MCP Studio</strong>, bạn vui lòng đăng nhập tài khoản FinGreen.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/dang-nhap?redirect=/')
                }}
                className="btn-primary py-2.5 px-6 text-xs font-bold inline-flex items-center gap-2"
              >
                <span>Đăng Nhập Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Nội dung tin nhắn chat */}
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 min-h-[260px] max-h-[400px]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center flex-shrink-0 text-xs font-bold border border-primary-500/30">
                        AI
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-primary-500 text-white rounded-br-none shadow-md shadow-primary-500/20'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-main)] border border-[var(--border-color)] rounded-bl-none shadow-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2.5 items-center text-xs text-[var(--text-muted)] animate-pulse">
                    <div className="w-7 h-7 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs border border-primary-500/30">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <span>FinGreen AI đang phân tích dữ liệu DNSE...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Thanh gợi ý câu hỏi nhanh (Prompt Suggestions) */}
              <div className="px-3 py-2 border-t border-[var(--border-color)] bg-[var(--bg-main)]/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  'Phân tích HPG',
                  'Định giá FPT',
                  'Dòng tiền VN-Index',
                  'BCTC VCB',
                  'Chiến thuật SSI'
                ].map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(pill)}
                    disabled={loading}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-primary-400 hover:border-primary-500/50 transition-colors"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Input Chat Box */}
              <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Hỏi về mã cổ phiếu, DNSE BCTC, xu hướng..."
                    className="input-field py-2 px-3 text-xs flex-1 rounded-xl"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="btn-primary p-2.5 rounded-xl disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0"
                    title="Gửi câu hỏi"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
