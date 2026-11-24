import React, { useState, useRef, useEffect } from 'react'
import { Maximize2, Minimize2, ExternalLink, RefreshCw, Activity, ShieldCheck } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function StockPanelPage() {
  const { theme } = useTheme()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const iframeRef = useRef(null)

  // Đồng bộ theme với Tick Stock Panel
  useEffect(() => {
    try {
      localStorage.setItem('tf-theme', theme === 'light' ? 'light' : 'dark')
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.localStorage?.setItem('tf-theme', theme === 'light' ? 'light' : 'dark')
      }
    } catch (_) {}
  }, [theme])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full flex flex-col bg-[#0A0A0B] transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100vh-64px)]'
      }`}
    >
      {/* Sub-header điều khiển tích hợp trên FinGreen */}
      <div className="h-10 bg-[#121215] border-b border-[#242429] px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">
              TICK STOCK PANEL · QUANT TERMINAL
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              VIỆT NAM LIVE
            </span>
          </div>
          <span className="hidden md:inline-block text-[11px] text-[#8E8E96]">
            HOSE · HNX · UPCOM (2.175 Mã) | Dữ liệu thời gian thực
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-md text-[#A1A1AA] hover:text-white hover:bg-[#212126] transition-colors"
            title="Tải lại bảng điều khiển"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href="/stock-panel/index.html#/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-[#A1A1AA] hover:text-white hover:bg-[#212126] transition-colors"
            title="Mở toàn màn hình trong tab mới"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md text-[#A1A1AA] hover:text-white hover:bg-[#212126] transition-colors"
            title={isFullscreen ? "Thoát toàn màn hình" : "Chế độ toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Frame nhúng trực tiếp giao diện Tick Stock Panel hoàn chỉnh */}
      <iframe
        ref={iframeRef}
        src="/stock-panel/index.html#/"
        title="Tick Stock Panel Vietnam"
        className="w-full flex-1 border-0 bg-[#0A0A0B]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  )
}
