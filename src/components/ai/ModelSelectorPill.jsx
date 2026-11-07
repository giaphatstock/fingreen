import React, { useState, useRef, useEffect } from 'react'
import { ChevronUp, Check, Zap, Sparkles } from 'lucide-react'

export const MODEL_MODES = [
  {
    id: 'fast',
    label: 'Flash',
    title: 'Nhanh (Flash)',
    desc: 'Thường nhanh hơn, phản hồi tức thì',
  },
  {
    id: 'turbo',
    label: 'Turbo',
    title: 'Turbo',
    desc: 'Thường tốn nhiều thời gian để suy nghĩ',
  }
]

export default function ModelSelectorPill({ currentMode = 'fast', onSelectMode, dropUp = true, align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const selected = MODEL_MODES.find(m => m.id === currentMode) || MODEL_MODES[0]

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Nút Pill giống giao diện Gemini */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-main)] border border-[var(--border-color)] transition-all shadow-sm hover:border-primary-500/40 select-none cursor-pointer"
      >
        <span>{selected.label}</span>
        <ChevronUp className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popup Menu chọn Model - Phong cách Gemini */}
      {isOpen && (
        <div
          className={`absolute ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          } w-60 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl`}
        >
          <div className="space-y-1">
            {MODEL_MODES.map((mode) => {
              const isSelected = mode.id === currentMode
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(mode.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'hover:bg-[var(--bg-subtle)] text-[var(--text-main)]'
                  }`}
                >
                  {/* Cột dấu Check */}
                  <div className="w-4 h-4 mt-0.5 flex items-center justify-center flex-shrink-0">
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-primary-400 stroke-[2.5]" />
                    ) : (
                      <span className="w-3.5 h-3.5 inline-block" />
                    )}
                  </div>

                  {/* Nội dung tiêu đề và mô tả nhỏ */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold leading-tight">
                      {mode.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                      {mode.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
