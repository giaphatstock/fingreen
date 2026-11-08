import React from 'react'
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Audio
} from 'remotion'
import { getVietnameseAudioUrl } from '../../services/tikTokAutomationService'
import { calculateSlideTiming } from '../../utils/slideTimingUtils'

// -----------------------------------------------------------------------------
// NỀN LƯỚI FINTECH 3D ĐỘNG (OPENDESIGN SWISS FINTECH STYLE)
// -----------------------------------------------------------------------------
function FintechBackground({ accentColor = '#10B981' }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const glowPulse = interpolate(
    Math.sin((frame / fps) * 2),
    [-1, 1],
    [0.18, 0.38]
  )

  const gridOffset = (frame * 0.7) % 40

  return (
    <div className="absolute inset-0 bg-[#050811] overflow-hidden pointer-events-none">
      {/* Lưới tọa độ không gian 3D Swiss Grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.09) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.09) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          backgroundPosition: `0px ${gridOffset}px`,
          transform: 'perspective(600px) rotateX(28deg) scale(1.2)'
        }}
      />

      {/* Vòng hào quang Ambient Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full blur-3xl transition-opacity"
        style={{
          backgroundColor: accentColor,
          opacity: glowPulse
        }}
      />

      {/* Hạt bụi sáng trôi nổi (Floating Particles) */}
      {[...Array(10)].map((_, i) => {
        const yPos = (100 - ((frame * (0.35 + (i % 3) * 0.2) + i * 28) % 120))
        const xPos = 12 + (i * 21) % 76
        const opacity = interpolate(yPos, [0, 50, 100], [0, 0.65, 0])
        return (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              top: `${yPos}%`,
              left: `${xPos}%`,
              backgroundColor: i % 2 === 0 ? '#10B981' : '#F59E0B',
              opacity,
              boxShadow: `0 0 8px ${i % 2 === 0 ? '#10B981' : '#F59E0B'}`
            }}
          />
        )
      })}
    </div>
  )
}

// -----------------------------------------------------------------------------
// SCENE 1: TYPOGRAPHY HOOK & ASYMMETRIC SWISS EDITORIAL
// -----------------------------------------------------------------------------
function HookScene({ slide }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame,
    fps,
    from: 0.88,
    to: 1,
    config: { damping: 14 }
  })

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const words = (slide.titleMain || 'SỰ KIỆN TÀI CHÍNH NÓNG').split(' ')

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6" style={{ opacity, transform: `scale(${scale})` }}>
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/60 shadow-lg mb-4">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
          {slide.badge || 'TIN NÓNG ĐẶC BIỆT'}
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase tracking-tight max-w-xs">
        {words.map((w, idx) => {
          const delay = idx * 2.5
          const wordOpacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const wordY = interpolate(frame, [delay, delay + 8], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const isHighlight = slide.highlightText && slide.highlightText.toLowerCase().includes(w.toLowerCase())
          return (
            <span
              key={idx}
              className={`inline-block mr-1.5 ${isHighlight ? 'text-amber-400 drop-shadow-[0_0_16px_#f59e0b]' : ''}`}
              style={{ opacity: wordOpacity, transform: `translateY(${wordY}px)` }}
            >
              {w}
            </span>
          )
        })}
      </h1>

      {slide.subText && (
        <p className="mt-4 text-xs sm:text-sm font-semibold text-slate-300 max-w-xs leading-relaxed">
          {slide.subText}
        </p>
      )}

      {slide.pillBadge && (
        <div className="mt-5">
          <span className="px-4 py-1.5 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-rose-600/40">
            {slide.pillBadge}
          </span>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// SCENE 2: BRUTALIST BIG METRIC STAT (OPENDESIGN DIGITS SWISS FINTECH)
// -----------------------------------------------------------------------------
function MetricScene({ slide }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame,
    fps,
    from: 0.72,
    to: 1,
    config: { damping: 12, mass: 0.8 }
  })

  const rawMetric = slide.metricValue || slide.highlightText || 'ĐỘT BIẾN'

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">
        {slide.titleMain || 'SỐ LIỆU TÀI CHÍNH ĐỘT BIẾN'}
      </span>

      <div className="relative py-4 my-2" style={{ transform: `scale(${scale})` }}>
        <div className="absolute inset-0 bg-emerald-500/25 rounded-3xl blur-2xl" />
        <div className="relative px-8 py-5 rounded-3xl bg-slate-950/95 border-2 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.35)] flex flex-col items-center">
          <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_25px_#10b981]">
            {rawMetric}
          </span>
          <span className="text-xs font-black text-slate-300 uppercase tracking-widest mt-2">
            {slide.metricLabel || slide.subText || 'CHỈ SỐ TRỌNG YẾU'}
          </span>
        </div>
      </div>

      <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold">
        {slide.pillBadge || 'TÁC ĐỘNG MẠNH TỚI ĐỊNH GIÁ'}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// SCENE 3: CANDLESTICK BREAKOUT CHART (ĐỒ THỊ NẾN BỨT PHÁ)
// -----------------------------------------------------------------------------
function CandlestickScene({ slide }) {
  const frame = useCurrentFrame()

  const candles = [
    { o: 40, c: 60, h: 70, l: 30, up: true },
    { o: 60, c: 50, h: 65, l: 45, up: false },
    { o: 50, c: 55, h: 60, l: 48, up: true },
    { o: 55, c: 75, h: 80, l: 52, up: true },
    { o: 75, c: 70, h: 78, l: 65, up: false },
    { o: 70, c: 92, h: 96, l: 68, up: true },
  ]

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 space-y-4">
      <div className="space-y-1">
        <span className="text-[11px] font-black text-purple-400 uppercase tracking-wider bg-purple-500/10 px-3 py-0.5 rounded-full border border-purple-500/30">
          {slide.badge || 'DIỄN BIẾN THỊ TRƯỜNG'}
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white uppercase">{slide.titleMain}</h2>
      </div>

      {/* Khung đồ thị nến tương tác */}
      <div className="relative w-72 h-44 rounded-2xl bg-slate-950/90 border border-slate-800 p-3 flex flex-col justify-between shadow-2xl overflow-hidden">
        <div className="absolute top-8 inset-x-0 border-b border-dashed border-rose-500/60 flex items-center justify-end px-2">
          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1 rounded">BREAKOUT RESISTANCE</span>
        </div>

        <div className="flex-1 flex items-end justify-between px-3 pb-2 pt-6 gap-2">
          {candles.map((c, idx) => {
            const candleProgress = interpolate(frame - idx * 4, [0, 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            })
            const height = (Math.abs(c.c - c.o) * 1.3) * candleProgress
            const isGreen = c.up

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative">
                <div
                  className="w-0.5 bg-slate-500 absolute"
                  style={{
                    top: `${100 - c.h}%`,
                    height: `${(c.h - c.l) * candleProgress}%`
                  }}
                />
                <div
                  className={`w-full rounded-sm relative z-10 ${isGreen ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}
                  style={{ height: `${Math.max(6, height)}px` }}
                />
              </div>
            )
          })}
        </div>

        <div className="h-6 border-t border-slate-850 flex items-end gap-1.5 px-3">
          {[30, 45, 40, 75, 60, 100].map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'}`}
              style={{ height: `${v}%` }}
            />
          ))}
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase shadow-lg">
        {slide.pillBadge || 'DÒNG TIỀN ĐỘT BIẾN'}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// SCENE 4: EDITORIAL QUOTE (DÀNH CHO LỜI TUYÊN BỐ / TRÍCH DẪN SHARK BÌNH, LÃNH ĐẠO)
// -----------------------------------------------------------------------------
function QuoteScene({ slide }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 14 }
  })

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 space-y-4" style={{ transform: `scale(${scale})` }}>
      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/30">
        {slide.badge || 'LỜI BỊ CÁO / PHÁT BIỂU'}
      </span>

      <div className="relative w-full max-w-xs p-5 rounded-3xl bg-slate-900/90 border border-amber-500/40 shadow-2xl text-left backdrop-blur-md">
        <span className="text-4xl text-amber-400 font-serif font-black leading-none block -mb-2">“</span>
        <p className="text-sm font-bold text-slate-100 leading-relaxed italic">
          {slide.highlightText || slide.voiceText || slide.titleMain}
        </p>
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-semibold">{slide.subText || 'Trích dẫn tại phiên tòa'}</span>
          <span className="text-amber-400 font-extrabold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            {slide.pillBadge || 'TRỰC TIẾP'}
          </span>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// SCENE 5: CHECKLIST CARD (SWISS MODULAR CARDS - KHẮC PHỤC TRIỆT ĐỂ LỖI HỘP TRỐNG)
// -----------------------------------------------------------------------------
function ChecklistScene({ slide }) {
  const frame = useCurrentFrame()

  // Bóc tách dữ liệu an toàn tuyệt đối, không bao giờ để ô trống chữ
  const rawItems = slide.items && Array.isArray(slide.items) && slide.items.length > 0
    ? slide.items
    : null

  let items = []
  if (rawItems) {
    items = rawItems.map((it, idx) => {
      if (typeof it === 'string') {
        const parts = it.split(/[:–-]/)
        return {
          num: `0${idx + 1}`,
          bold: (parts[0] || it).trim(),
          detail: (parts[1] || '').trim()
        }
      }
      return {
        num: it.num || `0${idx + 1}`,
        bold: (it.bold || it.title || it.headline || it.text || it.name || `Trọng tâm ${idx + 1}`).trim(),
        detail: (it.detail || it.desc || it.description || it.sub || '').trim()
      }
    })
  } else {
    // Tự động phân tách từ chính câu nói của slide nếu không có items mảng
    const rawVoice = slide.voiceText || slide.titleMain || ''
    const parts = rawVoice.split(/[,;\n\.\!\?]| và /i).map(p => p.trim()).filter(p => p.length > 4)
    if (parts.length >= 2) {
      items = parts.slice(0, 3).map((p, i) => ({
        num: `0${i + 1}`,
        bold: p.length > 36 ? p.slice(0, 36) + '...' : p,
        detail: parts[i + 1] ? (parts[i + 1].length > 40 ? parts[i + 1].slice(0, 40) + '...' : parts[i + 1]) : ''
      }))
    } else {
      items = [
        { num: '01', bold: 'Gia tăng sở hữu lớn', detail: 'Tổ chức chủ động mua gom cổ phần' },
        { num: '02', bold: 'Triển khai chiến lược ESOP', detail: 'Gắn kết nguồn nhân lực chủ chốt' },
        { num: '03', bold: 'Tinh gọn danh mục đầu tư', detail: 'Tập trung toàn lực vào các dự án trọng điểm' }
      ]
    }
  }

  // Đảm bảo có ít nhất 3 items hiển thị
  while (items.length < 3) {
    const i = items.length
    items.push({
      num: `0${i + 1}`,
      bold: i === 1 ? 'Triển khai tái cơ cấu' : 'Tập trung dự án trọng điểm',
      detail: 'Tối ưu hóa nguồn lực tài chính'
    })
  }

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 space-y-3.5 w-full">
      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/30">
        {slide.badge || 'TỔNG HỢP SỰ KIỆN'}
      </span>
      <h2 className="text-base sm:text-lg font-black text-white text-center uppercase tracking-tight mb-0.5 max-w-xs">
        {slide.titleMain || 'BỨC TRANH DOANH NGHIỆP'}
      </h2>

      <div className="w-full max-w-xs space-y-2.5">
        {items.slice(0, 3).map((it, idx) => {
          const delay = idx * 5
          const itemX = interpolate(frame, [delay, delay + 7], [-25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const itemOpacity = interpolate(frame, [delay, delay + 7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

          return (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-xl flex items-start gap-3 backdrop-blur-md"
              style={{ transform: `translateX(${itemX}px)`, opacity: itemOpacity }}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs font-black">
                {it.num || `0${idx + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{it.bold}</p>
                {it.detail ? (
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">{it.detail}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">Thông tin trọng điểm từ báo cáo</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// SCENE 6: RADAR SCAN (QUÉT RA-DA TẦM SOÁT DÒNG TIỀN)
// -----------------------------------------------------------------------------
function RadarScene({ slide }) {
  const frame = useCurrentFrame()
  const rot = (frame * 3.5) % 360

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 space-y-3">
      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/30">
        {slide.badge || 'TẦM SOÁT CƠ HỘI'}
      </span>
      <h2 className="text-lg sm:text-xl font-black text-white uppercase">{slide.titleMain}</h2>

      <div className="relative w-40 h-40 rounded-full border-2 border-emerald-500/40 bg-slate-950 flex items-center justify-center overflow-hidden shadow-[0_0_35px_rgba(16,185,129,0.25)] my-1">
        <div className="absolute inset-3 rounded-full border border-dashed border-emerald-500/30" />
        <div className="absolute inset-8 rounded-full border border-emerald-500/20" />
        
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/20 to-emerald-400/60 rounded-full origin-center"
          style={{ transform: `rotate(${rot}deg)` }}
        />

        <div className="relative z-10 px-3 py-1 rounded-xl bg-slate-900 border border-emerald-400 text-emerald-300 font-black text-xs shadow-xl animate-pulse">
          {slide.highlightText || 'TÂM ĐIỂM'}
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-300 max-w-xs">{slide.subText || 'Hệ thống FinGreen phát hiện tín hiệu dòng tiền lớn'}</p>
    </div>
  )
}

// -----------------------------------------------------------------------------
// SCENE 7 (FINAL): EXECUTIVE VERDICT (ĐÚC KẾT CHIẾN LƯỢC - TUYỆT ĐỐI KHÔNG HỎI KHÁN GIẢ)
// -----------------------------------------------------------------------------
function VerdictScene({ slide }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame,
    fps,
    from: 0.86,
    to: 1,
    config: { damping: 14 }
  })

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 space-y-4 w-full" style={{ transform: `scale(${scale})` }}>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        ĐÚC KẾT CHIẾN LƯỢC FINGREEN
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-tight drop-shadow-md">
        {slide.titleMain || 'KẾT LUẬN & ĐỊNH HƯỚNG ĐẦU TƯ'}
      </h2>

      <div className="w-full max-w-xs p-4 rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950 border border-slate-700 shadow-2xl text-left space-y-3 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs font-black">
            ✓
          </div>
          <p className="text-xs font-bold text-slate-100 leading-relaxed">
            {slide.highlightText || slide.subText || slide.voiceText?.slice(0, 110) || 'Dữ liệu bám sát diễn biến thị trường'}
          </p>
        </div>

        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Định hướng chiến lược:</span>
          <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 uppercase">
            {slide.pillBadge || 'THEO DÕI SÁT'}
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

// =============================================================================
// COMPOSITION CHÍNH GỘP TOÀN BỘ CÁC CẢNH PHIM THÀNH 1 VIDEO DUY NHẤT
// =============================================================================
export function RemotionFintechComposition({ campaign, selectedVoice = 'nam' }) {
  const slides = campaign?.slides || []
  const frame = useCurrentFrame()

  // Tính toán thời gian độc lập cho từng slide dựa theo số từ
  const { slidesWithTiming, totalDurationFrames } = calculateSlideTiming(slides, 30)

  // Tìm slide hiện tại dựa trên frame chính xác
  let activeIndex = slidesWithTiming.findIndex(
    s => frame >= s.startFrame && frame < s.endFrame
  )
  if (activeIndex === -1) {
    activeIndex = frame >= (slidesWithTiming[slidesWithTiming.length - 1]?.endFrame || 0)
      ? slidesWithTiming.length - 1
      : 0
  }

  const curSlide = slidesWithTiming[activeIndex] || slidesWithTiming[0]
  const currentStart = curSlide?.startFrame || 0
  const currentDuration = curSlide?.durationFrames || 90

  // Tiến độ từ 0 đến 100% của slide hiện tại (khớp chuẩn 100% với giọng đọc)
  const localFrame = Math.max(0, frame - currentStart)
  const slideProgress = Math.min(100, Math.max(0, (localFrame / currentDuration) * 100))

  const getAccentColor = (type) => {
    if (type === 'big_metric_stat') return '#10B981'
    if (type === 'candlestick_breakout') return '#8B5CF6'
    if (type === 'radar_scan') return '#06B6D4'
    if (type === 'quote_editorial') return '#F59E0B'
    if (type === 'executive_verdict') return '#F59E0B'
    return '#10B981'
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-between font-sans select-none">
      <FintechBackground accentColor={getAccentColor(curSlide?.type)} />

      {/* THANH TIẾN ĐỘ CHUYỂN CẢNH TRÊN CÙNG (TIKTOK STORY STYLE) */}
      <div className="absolute top-2 inset-x-3 z-30 flex items-center gap-1">
        {slidesWithTiming.map((s, idx) => {
          const isCompleted = frame >= s.endFrame
          const isCurrent = frame >= s.startFrame && frame < s.endFrame
          const progress = isCompleted ? 100 : isCurrent ? slideProgress : 0

          return (
            <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          )
        })}
      </div>

      {/* HEADER: SỐ THỨ TỰ CẢNH & HUY HIỆU */}
      <div className="relative z-20 pt-5 px-4 flex items-center justify-between">
        <span className="px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 text-[10px] font-black uppercase">
          {curSlide?.badge || 'FINGREEN MEDIA'}
        </span>

        <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-300 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
          <span className="text-amber-400">{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="text-slate-600">/</span>
          <span>{String(slidesWithTiming.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* NỘI DUNG TỪNG CẢNH PHIM QUA SEQUENCE REMOTION ĐỘC LẬP THỜI LƯỢNG */}
      <div className="relative z-10 flex-1 flex flex-col my-auto">
        {slidesWithTiming.map((slide, idx) => {
          const audioUrl = getVietnameseAudioUrl(slide.voiceText, selectedVoice)

          return (
            <Sequence
              key={idx}
              from={slide.startFrame}
              durationInFrames={slide.durationFrames}
            >
              {/* Âm thanh Neural chuẩn cho từng cảnh */}
              {audioUrl && <Audio src={audioUrl} />}

              {/* Render visual động theo thể loại cảnh phong phú */}
              {slide.type === 'big_metric_stat' && <MetricScene slide={slide} />}
              {slide.type === 'candlestick_breakout' && <CandlestickScene slide={slide} />}
              {slide.type === 'radar_scan' && <RadarScene slide={slide} />}
              {slide.type === 'quote_editorial' && <QuoteScene slide={slide} />}
              {slide.type === 'checklist_card' && <ChecklistScene slide={slide} />}
              {(slide.type === 'executive_verdict' || slide.type === 'poll_cta') && <VerdictScene slide={slide} />}
              {(!['big_metric_stat', 'candlestick_breakout', 'radar_scan', 'quote_editorial', 'checklist_card', 'executive_verdict', 'poll_cta'].includes(slide.type)) && (
                <HookScene slide={slide} />
              )}
            </Sequence>
          )
        })}
      </div>

      {/* CỘT TƯƠNG TÁC TIKTOK BÊN PHẢI */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3 text-white pointer-events-none opacity-90">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 overflow-hidden bg-slate-800 flex items-center justify-center font-black text-[10px] text-white">
          FG
        </div>
        <div className="flex flex-col items-center">
          <span className="text-base">❤️</span>
          <span className="text-[10px] font-bold">18.6K</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-base">💬</span>
          <span className="text-[10px] font-bold">1.2K</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-base">⭐</span>
          <span className="text-[10px] font-bold">2.4K</span>
        </div>
      </div>

      {/* BOTTOM PHỤ ĐỀ KINETIC KARAOKE SYNC VÀ AUDIO EQUALIZER */}
      <div className="relative z-20 px-4 pb-4 pt-3 bg-gradient-to-t from-black via-black/95 to-transparent space-y-2">
        {/* Equalizer sóng âm */}
        <div className="flex items-center justify-center gap-1 h-3">
          {Array.from({ length: 24 }).map((_, i) => {
            const h = Math.max(3, Math.abs(Math.sin((frame * 0.15) + i * 0.7)) * 12 + 3)
            return (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${h}px`,
                  backgroundColor: i % 2 === 0 ? '#10B981' : '#F59E0B'
                }}
              />
            )
          })}
        </div>

        {/* Chữ nhảy Karaoke Word Sync theo tiến độ chuẩn từng từ */}
        <div className="min-h-[44px] flex items-center justify-center text-center px-2">
          <p className="text-xs sm:text-[13px] font-extrabold leading-relaxed text-center drop-shadow-[0_2px_4px_#000]">
            {curSlide?.voiceText ? (
              curSlide.voiceText.split(' ').map((word, wIdx, arr) => {
                const wordProgress = (wIdx / arr.length) * 100
                const isSpoken = slideProgress >= wordProgress
                const isCurrent = slideProgress >= wordProgress && slideProgress < ((wIdx + 1.2) / arr.length) * 100
                return (
                  <span
                    key={wIdx}
                    className={`inline-block mr-1 transition-all duration-100 ${
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
              <span className="text-slate-400 italic">FinGreen Market News</span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-slate-800">
          <span>© FinGreen Media • Bản tin thị trường</span>
          <span className="text-emerald-400 font-bold">
            {selectedVoice === 'nam' ? '🎙️ BTV Nam Minh' : '🎙️ BTV Hoài My'}
          </span>
        </div>
      </div>
    </div>
  )
}
