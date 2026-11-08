import React, { useState, useEffect, useRef } from 'react'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles,
  Share2, Heart, MessageCircle, Bookmark, CheckCircle2,
  ChevronLeft, ChevronRight, Check, AlertTriangle, Flame, ShoppingBag, Radio
} from 'lucide-react'
import { getVietnameseAudioUrl, VSC_13_SLIDES_STORYBOARD } from '../../services/tikTokAutomationService'

export default function TikTokKineticPlayer({
  campaign,
  onFinish
}) {
  const slides = campaign?.slides || VSC_13_SLIDES_STORYBOARD
  const totalSlides = slides.length

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('nam') // 'nam' (vi-VN-NamMinhNeural) | 'nu' (vi-VN-HoaiMyNeural)
  const [viewMode, setViewMode] = useState('kinetic') // 'kinetic' | 'video_mp4'
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [slideProgress, setSlideProgress] = useState(0)

  const audioRef = useRef(null)
  const fallbackTimerRef = useRef(null)

  const curSlide = slides[currentSlideIndex] || slides[0]

  // Phát âm thanh tiếng bíp nhẹ chuyển cảnh qua Web Audio API (100% hoạt động mọi trình duyệt)
  const playTransitionChime = () => {
    if (isMuted) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5 note
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5 note
        gain.gain.setValueAtTime(0.03, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      }
    } catch (e) {}
  }

  // Quản lý audio và chuyển slide đồng bộ 100% với giọng đọc Neural tiếng Việt
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    if (isPlaying) {
      playTransitionChime()
      setSlideProgress(0)

      const voiceText = curSlide?.voiceText || ''

      if (!isMuted && voiceText) {
        audio.src = getVietnameseAudioUrl(voiceText, selectedVoice)
        audio.currentTime = 0

        // Khi audio đang phát, cập nhật slideProgress mượt mà
        const handleTimeUpdate = () => {
          if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            const pct = Math.min((audio.currentTime / audio.duration) * 100, 100)
            setSlideProgress(pct)
          }
        }

        // KHI GIỌNG ĐỌC NÓI XONG 100% TOÀN BỘ CÂU CHỮ MỚI CHUYỂN SANG SLIDE TIẾP THEO
        const handleEnded = () => {
          setSlideProgress(100)
          setTimeout(() => {
            if (currentSlideIndex < totalSlides - 1) {
              setCurrentSlideIndex(prev => prev + 1)
            } else {
              setIsPlaying(false)
              if (onFinish) onFinish()
            }
          }, 350)
        }

        const handleError = () => {
          console.warn('Lỗi stream audio, dùng bộ đếm dự phòng theo độ dài câu')
          const readingDurationMs = Math.max(3500, voiceText.length * 75)
          const startTime = Date.now()
          fallbackTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime
            const pct = Math.min((elapsed / readingDurationMs) * 100, 100)
            setSlideProgress(pct)
            if (elapsed >= readingDurationMs) {
              clearInterval(fallbackTimerRef.current)
              fallbackTimerRef.current = null
              if (currentSlideIndex < totalSlides - 1) {
                setCurrentSlideIndex(prev => prev + 1)
              } else {
                setIsPlaying(false)
                if (onFinish) onFinish()
              }
            }
          }, 50)
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        audio.play().catch(err => {
          console.warn('Tự động phát bị chặn hoặc lỗi mạng:', err)
          handleError()
        })

        return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate)
          audio.removeEventListener('ended', handleEnded)
          audio.removeEventListener('error', handleError)
          if (fallbackTimerRef.current) {
            clearInterval(fallbackTimerRef.current)
            fallbackTimerRef.current = null
          }
        }
      } else {
        // Chế độ tắt tiếng (Muted): Chạy thời lượng chuẩn theo tốc độ đọc
        const readingDurationMs = Math.max(3500, (voiceText.length || 30) * 75)
        const startTime = Date.now()
        fallbackTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime
          const pct = Math.min((elapsed / readingDurationMs) * 100, 100)
          setSlideProgress(pct)
          if (elapsed >= readingDurationMs) {
            clearInterval(fallbackTimerRef.current)
            fallbackTimerRef.current = null
            if (currentSlideIndex < totalSlides - 1) {
              setCurrentSlideIndex(prev => prev + 1)
            } else {
              setIsPlaying(false)
              if (onFinish) onFinish()
            }
          }
        }, 50)

        return () => {
          if (fallbackTimerRef.current) {
            clearInterval(fallbackTimerRef.current)
            fallbackTimerRef.current = null
          }
        }
      }
    } else {
      audio.pause()
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [isPlaying, currentSlideIndex, isMuted, selectedVoice, curSlide?.voiceText, totalSlides])

  const togglePlay = () => {
    if (currentSlideIndex >= totalSlides - 1) {
      setCurrentSlideIndex(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleRestart = () => {
    if (audioRef.current) audioRef.current.pause()
    setCurrentSlideIndex(0)
    setIsPlaying(true)
  }

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      if (audioRef.current) audioRef.current.pause()
      setCurrentSlideIndex(prev => prev - 1)
    }
  }

  const handleNextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) {
      if (audioRef.current) audioRef.current.pause()
      setCurrentSlideIndex(prev => prev + 1)
    }
  }

  // =========================================================================
  // BỘ RENDER 13 DẠNG VISUAL INFOGRAPHICS ĐỘC BẢN THEO TỪNG CỔ PHIẾU
  // =========================================================================
  const renderSlideContent = () => {
    const s = curSlide
    const type = s.type

    // 0. BIG METRIC STAT (SỐ LIỆU ĐỘT BIẾN KHỔNG LỒ PHÁT SÁNG)
    if (type === 'big_metric_stat') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">{s.titleMain}</p>
          <div className="relative py-2 my-1">
            <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative px-6 py-4 rounded-3xl bg-slate-950/90 border-2 border-amber-500/70 shadow-2xl flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight drop-shadow-[0_0_25px_#f59e0b]">
                {s.metricValue || s.highlightText || 'ĐỘT BIẾN'}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest mt-1">
                {s.metricLabel || s.subText || 'SỐ LIỆU TÀI CHÍNH NỔI BẬT'}
              </span>
            </div>
          </div>
          {s.pillBadge && (
            <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase shadow-lg shadow-emerald-500/30">
              {s.pillBadge}
            </span>
          )}
        </div>
      )
    }

    // 1. TYPOGRAPHY HOOK
    if (type === 'typography_hook' || type === 'hook_question') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <p className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wide">{s.titleTop}</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase">
            {s.titleMain}
          </h2>
          <div className="py-1">
            <span
              className="text-3xl sm:text-4xl font-black tracking-tight uppercase"
              style={{
                color: s.highlightColor || '#F59E0B',
                textShadow: `0 0 25px ${s.highlightColor || '#F59E0B'}80`
              }}
            >
              {s.highlightText}
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">{s.subText}</p>
          {s.pillBadge && (
            <div className="pt-2">
              <span className="px-4 py-1.5 rounded-full bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/50 animate-bounce inline-block">
                {s.pillBadge}
              </span>
            </div>
          )}
        </div>
      )
    }

    // 2. BLAST FURNACE (LÒ CAO DUNG QUẤT - DÀNH CHO THÉP HPG)
    if (type === 'blast_furnace') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase">{s.titleMain}</h2>
          <p className="text-xs sm:text-sm font-bold text-amber-400 uppercase">{s.titleSub}</p>

          {/* Minh họa Lò cao Thép đỏ rực */}
          <div className="relative w-56 h-36 flex flex-col items-center justify-center my-1">
            <div className="absolute inset-0 bg-orange-600/20 rounded-full blur-2xl animate-pulse" />
            <svg viewBox="0 0 160 110" className="w-44 h-32 drop-shadow-[0_0_15px_#f97316]">
              {/* Thân lò cao */}
              <polygon points="50,20 110,20 125,85 35,85" fill="#334155" stroke="#64748b" strokeWidth="2" />
              {/* Lòng lò nung đỏ lửa */}
              <rect x="55" y="55" width="50" height="25" rx="3" fill="#ea580c" className="animate-pulse" />
              <circle cx="80" cy="67" r="8" fill="#fbbf24" className="animate-ping" />
              <text x="80" y="71" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">1.500°C</text>
              {/* Ống khói và tia lửa */}
              <rect x="75" y="5" width="10" height="15" fill="#475569" />
              <circle cx="80" cy="3" r="3" fill="#f97316" className="animate-bounce" />
              {/* Dòng thép nóng chảy ra */}
              <path d="M 80 85 L 80 105" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          <span className="px-4 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase shadow-md shadow-rose-600/40">
            {s.pillBadge}
          </span>
        </div>
      )
    }

    // 3. RETAIL NETWORK (MẠNG LƯỚI BÁN LẺ & MIẾNG BÁNH 1 TỶ USD - DÀNH CHO DGW)
    if (type === 'retail_network') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase">{s.titleMain}</h2>
          <p className="text-xs sm:text-sm font-bold text-sky-400 uppercase">{s.titleSub}</p>

          <div className="relative w-56 h-36 flex items-center justify-center my-1">
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-emerald-500/60 flex flex-col items-center justify-center bg-slate-900/80 shadow-2xl shadow-emerald-500/30">
              <span className="text-2xl font-black text-emerald-400">1 TỶ $</span>
              <span className="text-[9px] text-slate-300 font-bold uppercase">MIẾNG BÁNH ICT</span>
            </div>
          </div>

          <span className="px-4 py-1 rounded-full bg-sky-500 text-slate-950 font-black text-xs uppercase shadow">
            {s.pillBadge}
          </span>
        </div>
      )
    }

    // 4. RISK ALERT & CÂY THÔNG SỤP ĐỔ (CẢNH BÁO THAO TÚNG)
    if (type === 'risk_alert_tree') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 mx-auto animate-bounce">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-rose-500 uppercase">{s.titleMain}</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-300 uppercase">{s.titleSub}</p>

          <div className="w-48 h-28 bg-slate-950 rounded-xl border border-rose-900/40 p-2 flex items-end justify-center gap-1">
            {/* Mô hình cây thông lao dốc */}
            {[10, 25, 45, 75, 95, 20, 10, 10, 10].map((h, i) => (
              <div
                key={i}
                className={`w-4 rounded-t-sm ${i < 5 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <span className="px-4 py-1 rounded-full bg-rose-600 text-white font-bold text-xs uppercase">
            {s.pillBadge}
          </span>
        </div>
      )
    }

    // 5. SHIP VECTOR (VSC - CẢNG BIỂN)
    if (type === 'ship_vector') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase">{s.titleMain}</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-300 uppercase">{s.titleSub}</p>

          <div className="relative w-56 h-32 flex flex-col items-center justify-center my-1">
            <svg viewBox="0 0 200 100" className="w-44 h-24 drop-shadow-2xl">
              <rect x="130" y="30" width="30" height="30" rx="3" fill="#cbd5e1" />
              <rect x="145" y="15" width="8" height="18" fill="#ef4444" />
              <rect x="40" y="35" width="28" height="25" rx="2" fill="#10b981" />
              <rect x="70" y="35" width="28" height="25" rx="2" fill="#f59e0b" />
              <rect x="100" y="35" width="28" height="25" rx="2" fill="#8b5cf6" />
              <path d="M 20 60 L 175 60 L 160 85 L 45 85 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            </svg>
            <div className="w-40 h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 rounded-full blur-[1px] animate-pulse" />
          </div>

          <span className="px-4 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase shadow-md">
            {s.pillBadge}
          </span>
        </div>
      )
    }

    // 6. CHART RALLY
    if (type === 'chart_rally') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <span className="text-xs font-bold text-slate-400">{s.yearTag}</span>
          <h2 className="text-xl font-black text-white uppercase">{s.titleMain}</h2>

          <div className="relative w-64 h-44 bg-slate-950/90 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Đồ thị kỹ thuật</span>
              <span className="text-emerald-400 font-bold">{s.endPrice}</span>
            </div>

            <svg viewBox="0 0 200 120" className="w-full h-full">
              <line x1="90" y1="92" x2="130" y2="20" stroke="#10b981" strokeWidth="6" strokeLinecap="round" className="drop-shadow-[0_0_12px_#10b981]" />
              <polygon points="125,12 140,22 122,28" fill="#10b981" />
              <circle cx="90" cy="92" r="4" fill="#f59e0b" />
              <text x="90" y="110" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">{s.startPrice}</text>
              <circle cx="130" cy="20" r="5" fill="#f59e0b" />
              <text x="155" y="24" fill="#f59e0b" fontSize="10" fontWeight="bold">{s.endPrice}</text>
            </svg>

            <div className="absolute top-1/2 left-6 -translate-y-1/2 px-3 py-1 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 font-black text-base shadow">
              {s.gainBadge}
            </div>
          </div>
        </div>
      )
    }

    // 7. CHART CRASH
    if (type === 'chart_crash') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <h2 className="text-2xl font-black text-white uppercase">
            RỒI NÓ <span className="text-rose-500 underline">RƠI.</span>
          </h2>
          <p className="text-xs font-bold text-slate-400">{s.titleSub}</p>

          <div className="relative w-64 h-44 bg-slate-950/90 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between">
            <svg viewBox="0 0 200 120" className="w-full h-full">
              <line x1="130" y1="20" x2="175" y2="100" stroke="#ef4444" strokeWidth="5" strokeDasharray="6,4" className="drop-shadow-[0_0_10px_#ef4444]" />
              <polygon points="175,108 165,95 183,98" fill="#ef4444" />
            </svg>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2 px-3">
              <span className="text-lg font-black text-rose-500">{s.lossBadge}</span>
              <span className="text-[10px] text-slate-300 font-medium">{s.lossText}</span>
            </div>
          </div>
        </div>
      )
    }

    // 8. CHART BASE
    if (type === 'chart_base') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <p className="text-xs text-slate-400 font-semibold">{s.introText}</p>
          <h2 className="text-2xl font-black uppercase" style={{ color: s.titleColor || '#E879F9' }}>
            {s.titleMain}
          </h2>

          <div className="relative w-64 h-44 bg-slate-950/90 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <rect x="10" y="70" width="180" height="25" fill="#a855f7" opacity="0.25" rx="3" stroke="#a855f7" />
              <text x="100" y="86" fill="#f3e8ff" fontSize="9" fontWeight="bold" textAnchor="middle">{s.zoneText}</text>
              <path d="M 15 80 Q 40 40 65 80 T 115 80 T 165 80" fill="none" stroke="#e879f9" strokeWidth="2" />
            </svg>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-bold text-amber-400">{s.timeframeText}</span>
              <span>{s.dotAnnotation}</span>
            </div>
          </div>
        </div>
      )
    }

    // 9. CYCLE WAVE
    if (type === 'cycle_wave') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <p className="text-sm font-bold text-slate-500 line-through decoration-rose-500">{s.strike1}</p>
          <p className="text-sm font-bold text-slate-500 line-through decoration-rose-500">{s.strike2}</p>
          <p className="text-xs text-slate-400">mà là...</p>
          <h2 className="text-3xl font-black text-emerald-400">{s.bottomLabel}</h2>
          <p className="text-xs font-bold text-white uppercase">{s.bottomSub}</p>
        </div>
      )
    }

    // 10. CANDLESTICK BREAKOUT
    if (type === 'candlestick_breakout') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <p className="text-xs text-slate-400">{s.topText}</p>
          <h2 className="text-2xl font-black uppercase" style={{ color: s.titleColor || '#D946EF' }}>
            {s.titleMain}
          </h2>

          <div className="relative w-64 h-44 bg-slate-950/90 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <rect x="25" y="65" width="8" height="15" fill="#ef4444" rx="1" />
              <rect x="45" y="68" width="8" height="12" fill="#10b981" rx="1" />
              <rect x="65" y="66" width="8" height="14" fill="#10b981" rx="1" />
              <rect x="115" y="20" width="16" height="50" fill="#d946ef" rx="2" className="drop-shadow-[0_0_12px_#d946ef]" />
            </svg>
            <p className="text-[10px] text-slate-300 font-medium">{s.descText}</p>
          </div>
        </div>
      )
    }

    // 11. GOLDEN COIN
    if (type === 'golden_coin') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 line-through decoration-rose-500">{s.strike1}</p>
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1 shadow-2xl flex items-center justify-center my-2">
            <div className="w-full h-full rounded-full border-2 border-dashed border-amber-800 flex items-center justify-center bg-amber-400 font-black text-xl text-slate-900">
              {s.coinText}
            </div>
          </div>
          <h2 className="text-lg font-black text-amber-400 uppercase">{s.titleMain}</h2>
        </div>
      )
    }

    // 12. CHECKLIST CARD
    if (type === 'checklist_card') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-2.5 w-full">
          <h2 className="text-base sm:text-lg font-black text-white uppercase">{s.titleMain}</h2>
          <div className="w-full max-w-xs space-y-2 text-left">
            {s.items?.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-700 flex items-start gap-2 shadow">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white mr-1">{item.bold}:</span>
                  <span className="text-slate-300">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
          <span className="px-4 py-1 rounded-full bg-emerald-500 text-white font-black text-xs uppercase shadow">
            {s.pillBadge}
          </span>
        </div>
      )
    }

    // 13. EXECUTIVE VERDICT (ĐÚC KẾT CHIẾN LƯỢC FINGREEN - TUYỆT ĐỐI KHÔNG HỎI KHÁN GIẢ)
    if (type === 'executive_verdict' || type === 'poll_cta' || type === 'why_question') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-4 w-full animate-scale-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ĐÚC KẾT CHIẾN LƯỢC FINGREEN
          </div>
          
          <h2 className="text-lg sm:text-xl font-black text-amber-400 uppercase tracking-tight leading-snug drop-shadow-md">
            {s.titleMain || 'KẾT LUẬN & GÓC NHÌN ĐẦU TƯ'}
          </h2>

          <div className="w-full max-w-xs p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950 border border-slate-700/80 shadow-2xl text-left space-y-3 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs font-black">
                ✓
              </div>
              <p className="text-xs font-bold text-slate-100 leading-relaxed">
                {s.highlightText || s.subText || s.voiceText?.slice(0, 100) || 'Dữ liệu bám sát diễn biến thị trường thực tế'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Định hướng hành động:</span>
              <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                {s.pillBadge || 'THEO DÕI SÁT'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            FinGreen Fintech Intelligence
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      )
    }

    // 15. MONEY FUNNEL
    if (type === 'money_funnel') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-white uppercase">{s.titleMain || 'DÒNG TIỀN CHỌN LỌC'}</h2>
          <p className="text-xs text-slate-300 font-bold">{s.subtitle}</p>

          <div className="relative w-48 h-32 flex flex-col items-center justify-center my-1">
            <svg viewBox="0 0 160 100" className="w-40 h-28 drop-shadow-[0_0_15px_#10b981]">
              <polygon points="10,10 150,10 105,70 55,70" fill="#1e293b" stroke="#10b981" strokeWidth="2" opacity="0.9" />
              <rect x="70" y="70" width="20" height="25" fill="#10b981" rx="2" />
              <text x="80" y="32" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">THỊ TRƯỜNG DÀN TRẢI</text>
              <text x="80" y="50" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">CÔ ĐẶC DÒNG TIỀN</text>
            </svg>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase shadow">
            {s.funnelLabel || 'DÒNG TIỀN HẤP THỤ'}
          </span>
        </div>
      )
    }

    // 16. RADAR SCAN
    if (type === 'radar_scan') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <p className="text-xs text-slate-400 font-semibold">{s.introText || 'Tầm soát cơ hội'}</p>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase">{s.titleMain || 'RADAR TẦM SOÁT'}</h2>

          <div className="relative w-32 h-32 rounded-full border-2 border-emerald-500/40 bg-slate-950 flex items-center justify-center overflow-hidden my-1 shadow-[0_0_25px_#10b98130]">
            <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/20" />
            <div className="absolute inset-4 rounded-full border border-emerald-500/30" />
            <div className="absolute inset-8 rounded-full border border-emerald-500/20" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/20 to-emerald-400/50 rounded-full animate-spin origin-center" style={{ animationDuration: '3s' }} />
            <div className="relative z-10 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-400 text-emerald-400 font-black text-xs shadow animate-pulse">
              {s.radarTarget || 'TÂM ĐIỂM'}
            </div>
          </div>

          <span className="px-4 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase shadow">
            {s.pillBadge || 'ĐẶT LÊN RADAR'}
          </span>
        </div>
      )
    }

    // 17. AI CHIP
    if (type === 'ai_chip') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
          <h2 className="text-xl font-black text-white uppercase">{s.titleMain || 'CHIP BÁN DẪN AI'}</h2>
          <p className="text-xs text-cyan-400 font-bold uppercase">{s.titleSub}</p>

          <div className="relative w-32 h-32 rounded-2xl bg-slate-950 border-2 border-cyan-500/60 flex items-center justify-center my-1 shadow-[0_0_30px_#06b6d440]">
            <div className="absolute -top-1 -bottom-1 inset-x-4 border-x-2 border-cyan-500/30" />
            <div className="absolute -left-1 -right-1 inset-y-4 border-y-2 border-cyan-500/30" />
            <div className="w-20 h-20 rounded-xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-cyan-800 border border-cyan-400 flex flex-col items-center justify-center animate-pulse">
              <span className="text-xs font-black text-cyan-300">NVIDIA</span>
              <span className="text-[10px] font-mono font-bold text-slate-300">AI H100</span>
            </div>
          </div>

          <span className="px-4 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs uppercase shadow">
            {s.pillBadge || 'CƠ SỐT BÁN DẪN'}
          </span>
        </div>
      )
    }

    // Default fallback
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
        <h2 className="text-xl font-black text-white uppercase">{s.titleMain || s.type}</h2>
        <p className="text-xs text-slate-300">{s.voiceText}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <audio ref={audioRef} preload="auto" />

      {/* NÚT CHUYỂN CHẾ ĐỘ XEM: KINETIC ENGINE VS VIDEO MP4 */}
      <div className="mb-3 flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs shadow-lg">
        <button
          type="button"
          onClick={() => setViewMode('kinetic')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            viewMode === 'kinetic'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ✨ Dựng Kinetic Typography AI
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode('video_mp4')
            setIsPlaying(false)
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            viewMode === 'video_mp4'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎬 Video Gốc Mẫu (.MP4)
        </button>
      </div>

      {viewMode === 'video_mp4' ? (
        <div className="relative w-[320px] sm:w-[350px] h-[580px] sm:h-[620px] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 flex flex-col justify-between">
          <video
            src="/sample_vsc_video.mp4"
            controls
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <>
          {/* KHUNG TIKTOK 9:16 */}
          <div className="relative w-[320px] sm:w-[350px] h-[580px] sm:h-[620px] bg-[#070b14] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 flex flex-col justify-between select-none">
            
            {/* 13 THANH TIẾN ĐỘ CHUYỂN SLIDE KIỂU TIKTOK STORY PHÍA TRÊN CÙNG */}
            <div className="absolute top-2 inset-x-3 z-30 flex items-center gap-1">
              {slides.map((_, idx) => {
                const isCompleted = idx < currentSlideIndex
                const isCurrent = idx === currentSlideIndex
                return (
                  <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-75"
                      style={{
                        width: isCompleted ? '100%' : isCurrent ? `${slideProgress}%` : '0%'
                      }}
                    />
                  </div>
                )
              })}
            </div>

        {/* TOP HEADER: BADGE CHỦ ĐỀ & SỐ SLIDE */}
        <div className="relative z-10 pt-5 px-4 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-300 text-[10px] font-black uppercase">
            {curSlide?.badge || 'CÂU CHUYỆN CỔ PHIẾU'}
          </span>

          <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            <span className="text-amber-400">{String(currentSlideIndex + 1).padStart(2, '0')}</span>
            <span className="text-slate-600">/</span>
            <span>{String(totalSlides).padStart(2, '0')}</span>
          </div>
        </div>

        {/* NỘI DUNG SLIDE INFOGRAPHICS CHÍNH */}
        <div className="relative z-10 flex-1 flex flex-col my-auto">
          {renderSlideContent()}
        </div>

        {/* CỘT TƯƠNG TÁC TIKTOK BÊN PHẢI */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 text-white">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 overflow-hidden bg-slate-800 flex items-center justify-center font-black text-[10px] text-white">
            FG
          </div>
          <button onClick={() => setLiked(!liked)} className="flex flex-col items-center">
            <Heart className={`w-6 h-6 ${liked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
            <span className="text-[10px] font-bold">18.6K</span>
          </button>
          <button className="flex flex-col items-center">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="text-[10px] font-bold">1.2K</span>
          </button>
          <button onClick={() => setSaved(!saved)} className="flex flex-col items-center">
            <Bookmark className={`w-6 h-6 ${saved ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
            <span className="text-[10px] font-bold">2.4K</span>
          </button>
        </div>

        {/* BOTTOM PHỤ ĐỀ KINETIC KARAOKE SYNC VÀ AUDIO EQUALIZER (OPEN-DESIGN MOTION) */}
        <div className="relative z-10 px-4 pb-4 pt-3 bg-gradient-to-t from-black via-black/95 to-transparent space-y-2">
          {/* Sóng âm Audio Equalizer 24 vạch nhảy múa theo tiến độ giọng đọc */}
          <div className="flex items-center justify-center gap-1 h-3">
            {Array.from({ length: 24 }).map((_, i) => {
              const activeHeight = isPlaying && !isMuted
                ? Math.max(3, Math.abs(Math.sin(slideProgress * 0.4 + i * 0.7)) * 11 + 3)
                : 2
              return (
                <div
                  key={i}
                  className="w-0.5 sm:w-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${activeHeight}px`,
                    backgroundColor: i % 2 === 0 ? '#10B981' : '#F59E0B',
                    opacity: isPlaying ? 0.9 : 0.3
                  }}
                />
              )
            })}
          </div>

          <div className="min-h-[44px] flex items-center justify-center text-center px-1">
            <p className="text-xs sm:text-[13px] font-extrabold leading-relaxed text-center drop-shadow-[0_2px_4px_#000]">
              {curSlide?.voiceText ? (
                curSlide.voiceText.split(' ').map((word, wIdx, arr) => {
                  const wordProgress = (wIdx / arr.length) * 100
                  const isSpoken = slideProgress >= wordProgress
                  const isCurrent = slideProgress >= wordProgress && slideProgress < ((wIdx + 1.2) / arr.length) * 100
                  return (
                    <span
                      key={wIdx}
                      className={`inline-block mr-1 transition-all duration-150 ${
                        isCurrent
                          ? 'text-amber-400 font-black scale-110 drop-shadow-[0_0_12px_#f59e0b]'
                          : isSpoken
                          ? 'text-white font-extrabold'
                          : 'text-slate-500/80 font-medium'
                      }`}
                    >
                      {word}
                    </span>
                  )
                })
              ) : (
                <span className="text-slate-400 italic">Đang tải phụ đề...</span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-slate-800/80">
            <span>© FinGreen Media • Bản tin thị trường</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              {isPlaying && !isMuted ? (selectedVoice === 'nam' ? 'BTV Nam Minh' : 'BTV Hoài My') : 'Sẵn sàng phát'}
            </span>
          </div>
        </div>

        {/* NÚT PLAY Ở GIỮA KHI VIDEO ĐANG DỪNG */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[1px] group"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/40 group-hover:scale-110 transition-transform font-black">
              <Play className="w-8 h-8 fill-slate-950 ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* THANH ĐIỀU KHIỂN DƯỚI VIDEO */}
      <div className="mt-4 flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 px-4 shadow-xl text-slate-300">
        <button
          onClick={handlePrevSlide}
          disabled={currentSlideIndex === 0}
          className="p-2 rounded-xl hover:bg-slate-800 disabled:opacity-30"
          title="Slide trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlay}
          className="p-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
          <span>{isPlaying ? 'Tạm Dừng' : 'Phát Video (Có Âm Thanh)'}</span>
        </button>

        <button
          onClick={handleNextSlide}
          disabled={currentSlideIndex === totalSlides - 1}
          className="p-2 rounded-xl hover:bg-slate-800 disabled:opacity-30"
          title="Slide sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleRestart}
          className="p-2 rounded-xl hover:bg-slate-800"
          title="Xem lại từ đầu"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setIsMuted(!isMuted)
            if (audioRef.current) audioRef.current.muted = !isMuted
          }}
          className={`p-2 rounded-xl ${isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300 hover:bg-slate-800'}`}
          title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Nút chuyển đổi giọng đọc BTV Nam / BTV Nữ */}
        <button
          onClick={() => {
            const nextVoice = selectedVoice === 'nam' ? 'nu' : 'nam'
            setSelectedVoice(nextVoice)
            // Nếu đang phát thì tải lại câu hiện tại với giọng mới
            if (isPlaying && audioRef.current && curSlide?.voiceText) {
              audioRef.current.src = getVietnameseAudioUrl(curSlide.voiceText, nextVoice)
              audioRef.current.currentTime = 0
              audioRef.current.play().catch(() => {})
            }
          }}
          className="ml-auto px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow"
          title="Bấm để đổi giọng đọc Biên tập viên Nam / Nữ"
        >
          <span>🎙️ {selectedVoice === 'nam' ? 'BTV Nam (Nam Minh)' : 'BTV Nữ (Hoài My)'}</span>
        </button>

        <span className="text-xs font-mono font-bold text-amber-400 ml-2">
          {currentSlideIndex + 1}/{totalSlides}
        </span>
      </div>
        </>
      )}
    </div>
  )
}
