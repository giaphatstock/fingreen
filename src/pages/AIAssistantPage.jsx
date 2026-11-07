import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Bot, Send, Sparkles, TrendingUp, Building2, Shield,
  Trash2, Loader2, ChevronRight, CheckCircle2
} from 'lucide-react'
import { sendChatMessage, getChatMode, saveChatMode } from '../services/aiService'
import { DNSE_PROMPT_LIBRARY } from '../services/dnseService'
import MarkdownRenderer from '../components/common/MarkdownRenderer'
import ModelSelectorPill from '../components/ai/ModelSelectorPill'
import toast from 'react-hot-toast'

const INITIAL_MESSAGE = `Xin chào! Tôi là **FinGreen AI**, trợ lý dữ liệu và thuật toán chứng khoán thông minh.

Tôi có thể giúp bạn phân tích mã cổ phiếu, báo cáo tài chính, dữ liệu dòng tiền ngành hay kiểm thử chiến thuật đầu tư!

**Bạn có thể thử các yêu cầu mẫu:**
- 📈 *Phân tích toàn diện mã cổ phiếu HPG*
- 🏢 *Tóm tắt BCTC quý gần nhất của VCB*
- 📊 *VN-Index dẫn dắt bởi ngành nào? Thanh khoản hôm nay ra sao?*
- 💡 *Tạo cho tôi một chiến thuật đầu tư cổ phiếu phù hợp với thị trường hiện tại*

---
> ⚠️ **Tuyên bố miễn trừ trách nhiệm:** Tín hiệu từ dữ liệu thuật toán/kỹ thuật mang tính chất THAM KHẢO, không phải là lời khuyên hay khuyến nghị đầu tư chính thức. Đầu tư chứng khoán luôn tiềm ẩn rủi ro. Nhà đầu tư tự chịu trách nhiệm về quyết định mua bán của mình.`

export default function AIAssistantPage() {
  const { user } = useAuth()
  
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('fingreen_ai_history_v2')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { }
    }
    return [
      {
        id: 'init',
        role: 'assistant',
        content: INITIAL_MESSAGE,
        timestamp: new Date().toISOString()
      }
    ]
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatMode, setChatMode] = useState(() => getChatMode())

  const chatEndRef = useRef(null)

  // Lưu lịch sử chat
  useEffect(() => {
    localStorage.setItem('fingreen_ai_history_v2', JSON.stringify(messages))
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (customPrompt) => {
    const promptToSend = (customPrompt || input).trim()
    if (!promptToSend || loading) return

    setInput('')
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const reply = await sendChatMessage({
        messages,
        prompt: promptToSend,
        mode: chatMode
      })

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      toast.error('Lỗi khi gửi câu hỏi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới cuộc trò chuyện?')) {
      const resetMsg = [{
        id: Date.now().toString(),
        role: 'assistant',
        content: INITIAL_MESSAGE,
        timestamp: new Date().toISOString()
      }]
      setMessages(resetMsg)
      localStorage.removeItem('fingreen_ai_history_v2')
      toast.success('Đã làm mới cuộc trò chuyện!')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 animate-fade-in">
      {/* Header Banner */}
      <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-primary-600/15 via-purple-600/10 to-indigo-600/15 border border-primary-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 flex-shrink-0">
            <Bot className="w-7 h-7 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
                FinGreen AI Workspace
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI Chuyên Gia
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Phân tích cổ phiếu toàn diện, báo cáo tài chính và dữ liệu thị trường chuyên sâu.
            </p>
          </div>
        </div>

        {/* Nút thao tác nhanh */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={handleClearHistory}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Làm mới cuộc trò chuyện"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Làm mới Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CỘT TRÁI (4 Cols): THƯ VIỆN CÂU HỎI MẪU (KHÔNG CÓ CÀI ĐẶT / SETTINGS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card space-y-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Mẫu Câu Hỏi Phân Tích
              </h3>
            </div>

            {DNSE_PROMPT_LIBRARY.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <div className="text-xs font-bold text-primary-400 flex items-center gap-1.5">
                  <span>{group.category}</span>
                </div>
                <div className="space-y-1.5">
                  {group.prompts.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSend(p.text)}
                      disabled={loading}
                      className="w-full text-left p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-primary-500/15 hover:border-primary-500/40 border border-[var(--border-color)] text-xs text-[var(--text-main)] transition-all flex items-center justify-between group"
                    >
                      <span className="line-clamp-2 pr-2 leading-relaxed">{p.text}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI (8 Cols): KHUNG CHAT TOÀN DIỆN */}
        <div className="lg:col-span-8 flex flex-col h-[700px] card p-0 overflow-hidden">
          
          {/* Header Chat */}
          <div className="px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-xs font-bold text-[var(--text-main)]">
                Trợ Lý FinGreen AI
              </span>
            </div>
            <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              ● Trực Tuyến
            </div>
          </div>

          {/* Vùng Tin Nhắn - DÙNG MarkdownRenderer ĐỂ IN ĐẬM VÀ ĐỊNH DẠNG CHUẨN */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md shadow-primary-500/20">
                    <Bot className="w-4 h-4 text-cyan-300" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed max-w-[88%] ${
                    m.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-none shadow-md shadow-primary-500/20 whitespace-pre-wrap'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-main)] border border-[var(--border-color)] rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <MarkdownRenderer content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-[var(--text-muted)] animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <span>FinGreen AI đang phân tích dữ liệu và phản hồi...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Ô Nhập Tin Nhắn & Chế Độ Model */}
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập mã cổ phiếu (HPG, FPT, VCB...) hoặc câu hỏi phân tích thị trường..."
                  className="input-field py-3 px-4 text-xs sm:text-sm flex-1 rounded-xl"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn-primary py-3 px-5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Gửi</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Thanh chọn chế độ Model Flash / Turbo giống Gemini */}
              <div className="flex items-center justify-between">
                <ModelSelectorPill
                  currentMode={chatMode}
                  onSelectMode={(m) => {
                    setChatMode(m)
                    saveChatMode(m)
                  }}
                  dropUp={true}
                />
                <span className="text-xs text-[var(--text-muted)] select-none">
                  {chatMode === 'fast'
                    ? '⚡ Chế độ Flash: Thường nhanh hơn, phản hồi tức thì'
                    : '🧠 Chế độ Turbo: Thường tốn nhiều thời gian để suy nghĩ'}
                </span>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
