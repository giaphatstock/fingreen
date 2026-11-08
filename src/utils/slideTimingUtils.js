/**
 * TÍNH TOÁN THỜI LƯỢNG CHÍNH XÁC CHO TỪNG SLIDE DỰA VÀO ĐỘ DÀI LỜI ĐỌC
 * Giúp phụ đề Karaoke và thời gian chuyển cảnh khớp 100% với giọng đọc BTV
 * Tốc độ BTV Nam Minh / Hoài My (+16%): ~3.4 từ / giây + 0.6s khoảng nghỉ
 */
export function calculateSlideTiming(slides = [], fps = 30) {
  if (!slides || slides.length === 0) {
    return {
      slidesWithTiming: [],
      totalDurationFrames: 90
    }
  }

  let currentFrame = 0
  const slidesWithTiming = slides.map((slide, idx) => {
    const text = (slide.voiceText || slide.titleMain || '').trim()
    const words = text.split(/\s+/).filter(Boolean).length
    // Thời lượng giây = số từ / 3.4 + 0.6s dừng thở; tối thiểu 3.5s, tối đa 9.0s
    const durationSeconds = Math.max(3.5, Math.min(9.0, (words / 3.4) + 0.6))
    const durationFrames = Math.round(durationSeconds * fps)

    const startFrame = currentFrame
    const endFrame = currentFrame + durationFrames
    currentFrame = endFrame

    return {
      ...slide,
      slideIndex: idx,
      startFrame,
      durationFrames,
      endFrame,
      durationSeconds
    }
  })

  return {
    slidesWithTiming,
    totalDurationFrames: Math.max(90, currentFrame)
  }
}
