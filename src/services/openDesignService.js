/**
 * OPENDESIGN / HYPERFRAMES COMPOSITION GENERATOR FOR FINGREEN
 * Tạo mã nguồn composition OpenDesign (HTML5 + GSAP + CSS) chuẩn 9:16 TikTok (1080x1920)
 * Bám sát ngôn ngữ thiết kế OpenDesign Swiss Fintech Grid & Kinetic Typography
 */

export function generateOpenDesignCompositionHtml({ slides = [], voice = 'nam', audioManifest = [] }) {
  // Tính tổng thời lượng dựa theo manifest âm thanh hoặc ước lượng từ ngữ
  let totalDuration = 0
  const timedSlides = slides.map((s, idx) => {
    const audioInfo = audioManifest.find(m => m.slideIndex === idx)
    const duration = audioInfo ? audioInfo.durationSeconds : Math.max(3.5, Math.min(9.0, (s.voiceText?.split(/\s+/).length || 10) * 0.24 + 0.5))
    const start = totalDuration
    totalDuration += duration
    return {
      ...s,
      slideIndex: idx,
      start: parseFloat(start.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
      end: parseFloat((start + duration).toFixed(2))
    }
  })

  totalDuration = parseFloat(totalDuration.toFixed(2))

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>FinGreen OpenDesign Video</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700;900&display=swap" rel="stylesheet" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #050811;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #ffffff;
        -webkit-font-smoothing: antialiased;
      }

      /* OPENDESIGN SWISS FINTECH 3D COORDINATE GRID */
      .grid-bg {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
        background-size: 72px 72px;
        transform: perspective(1000px) rotateX(25deg) scale(1.3);
        opacity: 0.35;
        pointer-events: none;
      }

      .ambient-glow {
        position: absolute;
        top: 35%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 800px;
        height: 800px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
        filter: blur(80px);
        pointer-events: none;
      }

      /* TIKTOK STORY TIMELINE BARS */
      .timeline-bar-wrap {
        position: absolute;
        top: 24px;
        left: 36px;
        right: 36px;
        display: flex;
        gap: 8px;
        z-index: 50;
      }
      .t-segment {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        overflow: hidden;
      }
      .t-fill {
        width: 0%;
        height: 100%;
        background: #f59e0b;
        border-radius: 999px;
      }

      /* HEADER */
      .header-wrap {
        position: absolute;
        top: 60px;
        left: 48px;
        right: 48px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 50;
      }
      .badge-tag {
        padding: 8px 24px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid rgba(245, 158, 11, 0.6);
        color: #fcd34d;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .slide-counter {
        font-family: 'JetBrains Mono', monospace;
        font-size: 28px;
        font-weight: 900;
        color: #94a3b8;
        background: rgba(15, 23, 42, 0.85);
        padding: 6px 20px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      .slide-counter span { color: #f59e0b; }

      /* SCENE CONTAINER */
      .slide-scene {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 180px 60px 420px 60px;
        opacity: 0;
        visibility: hidden;
      }

      /* SCENE 1: KINETIC HOOK */
      .hook-title {
        font-size: 76px;
        font-weight: 900;
        line-height: 1.15;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        max-width: 960px;
      }
      .hook-title .highlight {
        color: #f59e0b;
        text-shadow: 0 0 40px rgba(245, 158, 11, 0.6);
      }
      .subtext {
        font-size: 34px;
        font-weight: 600;
        color: #cbd5e1;
        margin-top: 36px;
        text-align: center;
        max-width: 860px;
        line-height: 1.45;
      }
      .pill-badge {
        margin-top: 48px;
        padding: 14px 40px;
        border-radius: 999px;
        background: #e11d48;
        color: #ffffff;
        font-size: 28px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        box-shadow: 0 0 35px rgba(225, 29, 72, 0.5);
      }

      /* SCENE 2: BRUTALIST BIG METRIC */
      .metric-box {
        position: relative;
        padding: 60px 80px;
        border-radius: 48px;
        background: rgba(5, 8, 20, 0.95);
        border: 4px solid #10b981;
        box-shadow: 0 0 60px rgba(16, 185, 129, 0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-top: 40px;
      }
      .metric-val {
        font-size: 130px;
        font-weight: 900;
        color: #34d399;
        line-height: 1;
        letter-spacing: -0.04em;
        text-shadow: 0 0 45px rgba(52, 211, 153, 0.7);
      }
      .metric-lbl {
        font-size: 32px;
        font-weight: 800;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-top: 20px;
      }

      /* SCENE 3: CHECKLIST ACTION CARDS */
      .cards-stack {
        width: 100%;
        max-width: 920px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-top: 36px;
      }
      .action-card {
        padding: 32px 36px;
        border-radius: 32px;
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: flex-start;
        gap: 28px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
      }
      .card-num {
        width: 68px;
        height: 68px;
        border-radius: 20px;
        background: rgba(16, 185, 129, 0.2);
        border: 2px solid rgba(16, 185, 129, 0.4);
        color: #34d399;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        font-weight: 900;
        flex-shrink: 0;
      }
      .card-content h3 {
        font-size: 36px;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 8px;
      }
      .card-content p {
        font-size: 28px;
        color: #cbd5e1;
        line-height: 1.4;
      }

      /* SCENE 4: EDITORIAL QUOTE */
      .quote-box {
        position: relative;
        padding: 56px 64px;
        border-radius: 48px;
        background: rgba(15, 23, 42, 0.92);
        border: 3px solid rgba(245, 158, 11, 0.5);
        box-shadow: 0 0 50px rgba(245, 158, 11, 0.25);
        max-width: 920px;
        margin-top: 36px;
      }
      .quote-mark {
        font-size: 110px;
        color: #f59e0b;
        line-height: 0.6;
        display: block;
        font-family: Georgia, serif;
      }
      .quote-text {
        font-size: 42px;
        font-weight: 800;
        font-style: italic;
        line-height: 1.4;
        color: #f8fafc;
        margin: 20px 0;
      }
      .quote-author {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 2px solid rgba(255, 255, 255, 0.1);
        padding-top: 24px;
        font-size: 28px;
        color: #94a3b8;
      }

      /* SCENE 5: STRATEGIC VERDICT (NO POLLS) */
      .verdict-box {
        padding: 48px 56px;
        border-radius: 40px;
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(5, 8, 20, 0.98));
        border: 3px solid #10b981;
        box-shadow: 0 0 60px rgba(16, 185, 129, 0.3);
        max-width: 920px;
        margin-top: 36px;
      }
      .verdict-line {
        display: flex;
        gap: 20px;
        align-items: flex-start;
      }
      .check-icon {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 900;
        flex-shrink: 0;
      }
      .verdict-text {
        font-size: 36px;
        font-weight: 800;
        line-height: 1.4;
        color: #f1f5f9;
      }

      /* BOTTOM KARAOKE SUBTITLE DOCK */
      .bottom-dock {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 380px;
        background: linear-gradient(0deg, #000000 70%, transparent 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 24px 60px 48px 60px;
        z-index: 60;
      }
      .karaoke-box {
        width: 100%;
        max-width: 960px;
        text-align: center;
        min-height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .karaoke-phrase {
        font-size: 42px;
        font-weight: 900;
        line-height: 1.45;
        text-align: center;
        display: none;
      }
      .karaoke-phrase.active {
        display: block;
      }
      .k-word {
        display: inline-block;
        margin: 0 8px;
        color: #64748b;
        transition: color 0.08s ease, transform 0.08s ease;
      }
      .k-word.spoken {
        color: #ffffff;
      }
      .k-word.current {
        color: #f59e0b;
        transform: scale(1.18);
        text-shadow: 0 0 20px #f59e0b;
      }

      /* FOOTER META */
      .dock-meta {
        width: 100%;
        max-width: 960px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 24px;
        color: #64748b;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 18px;
        margin-top: 12px;
      }
      .voice-tag { color: #34d399; font-weight: 800; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${totalDuration}"
      data-width="1080"
      data-height="1920"
      data-fps="30"
    >
      <div class="grid-bg"></div>
      <div class="ambient-glow"></div>

      <!-- AUDIO TRACKS -->
      ${timedSlides.map(s => `
        <audio
          id="audio-${s.slideIndex}"
          data-start="${s.start}"
          data-duration="${s.duration}"
          data-volume="1"
          src="/api/tts?text=${encodeURIComponent(s.voiceText)}&voice=${voice}"
        ></audio>
      `).join('\n')}

      <!-- TOP STORY TIMELINE BARS -->
      <div class="timeline-bar-wrap">
        ${timedSlides.map(s => `
          <div class="t-segment">
            <div id="tbar-${s.slideIndex}" class="t-fill"></div>
          </div>
        `).join('\n')}
      </div>

      <!-- HEADER -->
      <div class="header-wrap">
        <div id="header-badge" class="badge-tag">FINGREEN FINTECH</div>
        <div class="slide-counter">
          <span id="cur-slide-num">01</span> / ${String(timedSlides.length).padStart(2, '0')}
        </div>
      </div>

      <!-- VISUAL SCENES (13 SLIDES) -->
      ${timedSlides.map(s => {
        const isHook = s.slideIndex === 0 || s.type === 'typography_hook'
        const isMetric = s.type === 'big_metric_stat' || s.metricValue
        const isQuote = s.type === 'quote_editorial'
        const isCards = s.type === 'checklist_card'
        const isVerdict = s.slideIndex === timedSlides.length - 1 || s.type === 'executive_verdict'

        return `
        <div id="scene-${s.slideIndex}" class="slide-scene">
          <div class="badge-tag" style="margin-bottom: 28px;">${s.badge || 'PHÂN TÍCH TÀI CHÍNH'}</div>

          ${isMetric ? `
            <h2 style="font-size: 52px; font-weight: 900; text-align: center; text-transform: uppercase;">${s.titleMain}</h2>
            <div class="metric-box">
              <div class="metric-val">${s.metricValue || s.highlightText || 'ĐỘT BIẾN'}</div>
              <div class="metric-lbl">${s.metricLabel || s.subText || 'CHỈ SỐ TRỌNG YẾU'}</div>
            </div>
          ` : isQuote ? `
            <div class="quote-box">
              <span class="quote-mark">“</span>
              <p class="quote-text">${s.highlightText || s.voiceText}</p>
              <div class="quote-author">
                <span>${s.subText || 'Phát biểu chính thức'}</span>
                <span style="color: #f59e0b; font-weight: 800;">TRÍCH DẪN</span>
              </div>
            </div>
          ` : isCards ? `
            <h2 style="font-size: 52px; font-weight: 900; text-align: center; text-transform: uppercase;">${s.titleMain}</h2>
            <div class="cards-stack">
              ${(s.items && s.items.length > 0 ? s.items : [
                { num: '01', bold: 'Dòng tiền đột biến', detail: 'Tổ chức chủ động mua gom' },
                { num: '02', bold: 'Tái cơ cấu danh mục', detail: 'Tập trung các dự án trọng điểm' },
                { num: '03', bold: 'Triển vọng bứt phá', detail: 'Tạo lập đà tăng trưởng mới' }
              ]).slice(0, 3).map((it, cIdx) => `
                <div class="action-card">
                  <div class="card-num">${it.num || `0${cIdx + 1}`}</div>
                  <div class="card-content">
                    <h3>${it.bold || it.title || it.text || `Điểm ${cIdx + 1}`}</h3>
                    <p>${it.detail || it.desc || ''}</p>
                  </div>
                </div>
              `).join('\n')}
            </div>
          ` : isVerdict ? `
            <h2 style="font-size: 64px; font-weight: 900; text-align: center; text-transform: uppercase; color: #f59e0b;">${s.titleMain}</h2>
            <div class="verdict-box">
              <div class="verdict-line">
                <div class="check-icon">✓</div>
                <div class="verdict-text">${s.highlightText || s.subText || s.voiceText}</div>
              </div>
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; align-items: center; font-size: 28px;">
                <span style="color: #94a3b8;">Định hướng chiến lược:</span>
                <span style="background: rgba(16,185,129,0.2); color: #34d399; padding: 6px 20px; border-radius: 12px; font-weight: 900; border: 1px solid #10b981;">THEO DÕI SÁT</span>
              </div>
            </div>
          ` : `
            <h1 class="hook-title">${s.titleMain}</h1>
            ${s.subText ? `<p class="subtext">${s.subText}</p>` : ''}
            ${s.pillBadge ? `<div class="pill-badge">${s.pillBadge}</div>` : ''}
          `}
        </div>
        `
      }).join('\n')}

      <!-- BOTTOM KARAOKE SUBTITLES DOCK -->
      <div class="bottom-dock">
        <div class="karaoke-box">
          ${timedSlides.map(s => {
            const words = (s.voiceText || s.titleMain || '').split(/\s+/).filter(Boolean)
            return `
            <div id="karaoke-phrase-${s.slideIndex}" class="karaoke-phrase">
              ${words.map((w, wIdx) => `
                <span id="k-${s.slideIndex}-${wIdx}" class="k-word">${w}</span>
              `).join('')}
            </div>
            `
          }).join('\n')}
        </div>
        <div class="dock-meta">
          <span>© FinGreen Media • Phân Tích Thực Tế</span>
          <span class="voice-tag">${voice === 'nam' ? '🎙️ BTV Nam Minh' : '🎙️ BTV Hoài My'} (OpenDesign Engine)</span>
        </div>
      </div>
    </div>

    <!-- GSAP HYPERFRAMES MASTER TIMELINE -->
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      const slidesData = ${JSON.stringify(timedSlides)};

      slidesData.forEach((s) => {
        const sceneEl = document.querySelector('#scene-' + s.slideIndex);
        const phraseEl = document.querySelector('#karaoke-phrase-' + s.slideIndex);
        const tbarEl = document.querySelector('#tbar-' + s.slideIndex);
        const counterEl = document.querySelector('#cur-slide-num');

        // Xuất hiện cảnh đúng start time
        tl.set(sceneEl, { visibility: 'visible', opacity: 1 }, s.start);
        tl.from(sceneEl, { y: 30, scale: 0.94, duration: 0.45, ease: 'power2.out' }, s.start);

        // Hiển thị phụ đề tương ứng
        tl.set(phraseEl, { display: 'block' }, s.start);

        // Cập nhật số slide
        tl.call(() => {
          if (counterEl) counterEl.textContent = String(s.slideIndex + 1).padStart(2, '0');
        }, null, s.start);

        // Thanh tiến độ slide chạy từ 0 đến 100% trong suốt thời gian đọc
        tl.fromTo(tbarEl, { width: '0%' }, { width: '100%', duration: s.duration, ease: 'none' }, s.start);

        // Word-by-word karaoke highlight đồng bộ 100% từng từ
        const words = (s.voiceText || s.titleMain || '').split(/\\s+/).filter(Boolean);
        const totalWords = words.length;
        if (totalWords > 0) {
          const perWordDuration = (s.duration - 0.4) / totalWords;
          words.forEach((_, wIdx) => {
            const wordStart = s.start + 0.15 + (wIdx * perWordDuration);
            const wordEl = document.querySelector('#k-' + s.slideIndex + '-' + wIdx);

            tl.call(() => {
              if (wordEl) {
                wordEl.classList.add('current');
                wordEl.classList.add('spoken');
              }
            }, null, wordStart);

            tl.call(() => {
              if (wordEl) wordEl.classList.remove('current');
            }, null, wordStart + perWordDuration);
          });
        }

        // Ẩn cảnh khi hết thời lượng của slide
        tl.to(sceneEl, { opacity: 0, duration: 0.25, ease: 'power2.in' }, s.end - 0.25);
        tl.set(sceneEl, { visibility: 'hidden' }, s.end);
        tl.set(phraseEl, { display: 'none' }, s.end);
      });

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>`;
}
