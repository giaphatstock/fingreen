import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Bot, Send, Sparkles, TrendingUp, Building2, Shield,
  Settings, Key, Trash2, RefreshCw, Loader2, ArrowRight,
  HelpCircle, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react'
import {
  sendChatMessage, getOpenRouterKey, saveOpenRouterKey,
  getSelectedModel, saveSelectedModel, AVAILABLE_MODELS
} from '../services/aiService'
import { DNSE_PROMPT_LIBRARY, DNSE_MCP_TOOLS } from '../services/dnseService'
import toast from 'react-hot-toast'

export default function AIAssistantPage() {
  const { user, isAdmin } = useAuth()
  
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('fingreen_ai_history')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { }
    }
    return [
      {
        id: 'init',
        role: 'assistant',
        content: `### 🤖 Chào mừng bạn đến với FinGreen AI Pro!

Tôi là trợ lý phân tích đầu tư chứng khoán thông minh của FinGreen, được kết nối trực tiếp với hệ sinh thái dữ liệu **DNSE MCP Studio** và mô hình ngôn ngữ **OpenRouter**.

**Bạn có thể thử các yêu cầu mẫu:**
- 📈 *Phân tích toàn diện mã cổ phiếu HPG*
- 🏢 *Tóm tắt BCTC quý gần nhất của VCB*
- 📊 *VN-Index dẫn dắt bởi ngành nào? Thanh khoản hôm nay ra sao?*
- 💡 *Tạo cho tôi một chiến thuật đầu tư cổ phiếu phù hợp với thị trường hiện tại*

Chọn prompt ở thanh bên trái hoặc nhập trực tiếp câu hỏi của bạn vào khung bên dưới!`,
        timestamp: new Date().toISOString()
      }
    ]
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('prompts') // 'prompts' | 'tools' | 'settings'

  // Settings
  const [apiKey, setApiKey] = useState(getOpenRouterKey())
  const [selectedModel, setSelectedModel] = useState(getSelectedModel())

  const chatEndRef = useRef(null)

  // Lưu lịch sử chat
  useEffect(() => {
    localStorage.setItem('fingreen_ai_history', JSON.stringify(messages))
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
        model: selectedModel
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
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
      const resetMsg = [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Hãy đặt câu hỏi cho tôi!',
        timestamp: new Date().toISOString()
      }]
      setMessages(resetMsg)
      localStorage.removeItem('fingreen_ai_history')
      toast.success('Đã xóa lịch sử trò chuyện!')
    }
  }

  const handleSaveSettings = (e) => {
    e.preventDefault()
    saveOpenRouterKey(apiKey)
    saveSelectedModel(selectedModel)
    toast.success('Đã lưu cấu hình AI thành công!')
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
                DNSE MCP Studio
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Phân tích cổ phiếu toàn diện, báo cáo tài chính và kiểm thử chiến thuật thời gian thực.
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
        
        {/* CỘT TRÁI (4 Cols): THƯ VIỆN PROMPTS DNSE, TOOLS & CÀI ĐẶT */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tabs chuyển đổi thanh bên */}
          <div className="flex bg-[var(--bg-subtle)] p-1 rounded-2xl border border-[var(--border-color)]">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'prompts'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Thư Viện Prompts
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'tools'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              MCP Tools ({DNSE_MCP_TOOLS.length})
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'settings'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                Cấu Hình (Admin)
              </button>
            )}
          </div>

          {/* TAB 1: THƯ VIỆN PROMPTS DNSE */}
          {activeTab === 'prompts' && (
            <div className="card space-y-4 max-h-[640px] overflow-y-auto">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Mẫu Câu Hỏi Tối Ưu DNSE
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
          )}

          {/* TAB 2: DANH SÁCH MCP TOOLS DNSE */}
          {activeTab === 'tools' && (
            <div className="card space-y-3 max-h-[640px] overflow-y-auto">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Công Cụ DNSE MCP Đang Hoạt Động
                </h3>
              </div>

              {DNSE_MCP_TOOLS.map((tool, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <code className="text-[11px] font-mono text-primary-400 font-bold">
                      {tool.name}
                    </code>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Sẵn sàng" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CÀI ĐẶT OPENROUTER & MODEL (CHỈ ADMIN) */}
          {isAdmin && activeTab === 'settings' && (
            <div className="card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                <Settings className="w-4 h-4 text-primary-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Cấu Hình API OpenRouter
                </h3>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="label">OpenRouter API Key (Tùy chọn)</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="input-field pl-10 text-xs"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Đăng ký lấy key tại <strong>openrouter.ai</strong> để sử dụng không giới hạn các model lớn (Gemini, Claude, GPT-4, Llama 3). Nếu chưa có key, hệ thống tự động dùng bộ dữ liệu DNSE MCP Studio.
                  </p>
                </div>

                <div>
                  <label className="label">Mô Hình AI (Model)</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="input-field text-xs"
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-primary w-full text-xs font-bold py-2.5">
                  Lưu Cấu Hình
                </button>
              </form>
            </div>
          )}
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
              <span className="text-[10px] text-[var(--text-muted)]">
                (Model: {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || 'Gemini 2.0 Flash'})
              </span>
            </div>
            <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              DNSE Connected
            </div>
          </div>

          {/* Vùng Tin Nhắn */}
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
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed max-w-[88%] whitespace-pre-wrap ${
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
              <div className="flex gap-3 items-center text-xs text-[var(--text-muted)] animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <span>FinGreen AI đang truy vấn dữ liệu DNSE MCP Studio và phản hồi...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Ô Nhập Tin Nhắn */}
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
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
                placeholder="Nhập mã cổ phiếu (HPG, FPT, VCB...) hoặc câu hỏi phân tích thị trường DNSE..."
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
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
