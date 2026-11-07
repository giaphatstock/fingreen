// Dịch vụ FinGreen AI tích hợp phân tích chứng khoán chuyên sâu và OpenRouter API
import {
  callDNSEToolLive, formatStockAnalysisFromDNSE,
  extractStockSymbols, generateComprehensiveStockAnalysis,
  getDNSEContextForPrompt, STOCKS_KNOWLEDGE_BASE
} from './dnseService'

// Mô hình mặc định cho chế độ Nhanh (Flash) và Turbo
export const DEFAULT_FAST_MODEL = 'google/gemma-4-26b-a4b-it:free'
export const DEFAULT_TURBO_MODEL = 'nvidia/nemotron-3.5-lightning:free'

// Danh sách gợi ý mô hình cho Admin
export const SUGGESTED_FAST_MODELS = [
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B A4B (Free)', provider: 'Google' },
  { id: 'google/gemma-4-31b-it:free', name: 'Google Gemma 4 31B (Free)', provider: 'Google' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Free)', provider: 'Google' },
  { id: 'liquid/lfm-2.5-2.6b:free', name: 'LiquidAI LFM 2.5 (Free)', provider: 'Liquid' },
]

export const SUGGESTED_TURBO_MODELS = [
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning (Free)', provider: 'Nvidia' },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'NVIDIA Nemotron 3 Reasoning (Free)', provider: 'Nvidia' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA Nemotron 3 Ultra (Free)', provider: 'Nvidia' },
  { id: 'openai/gpt-4o', name: 'OpenAI GPT-4o (Cần Nạp Credits)', provider: 'OpenAI' },
]

export const AVAILABLE_MODELS = [
  ...SUGGESTED_FAST_MODELS,
  ...SUGGESTED_TURBO_MODELS
]

// Quản lý cấu hình Model Nhanh (Flash)
export function getFastModel() {
  return localStorage.getItem('fingreen_admin_fast_model') || DEFAULT_FAST_MODEL
}

export function saveFastModel(model) {
  if (model) {
    localStorage.setItem('fingreen_admin_fast_model', model.trim())
  }
}

// Quản lý cấu hình Model Turbo
export function getTurboModel() {
  return localStorage.getItem('fingreen_admin_turbo_model') || DEFAULT_TURBO_MODEL
}

export function saveTurboModel(model) {
  if (model) {
    localStorage.setItem('fingreen_admin_turbo_model', model.trim())
  }
}

// Giữ lại các hàm cũ tương thích ngược
export function getSelectedModel() {
  return getTurboModel()
}

export function saveSelectedModel(model) {
  saveTurboModel(model)
}

// Chế độ Chat do người dùng chọn (Flash vs Turbo)
export function getChatMode() {
  return localStorage.getItem('fingreen_user_chat_mode') || 'fast'
}

export function saveChatMode(mode) {
  if (mode) {
    localStorage.setItem('fingreen_user_chat_mode', mode)
  }
}

// API Key OpenRouter
const DEFAULT_API_KEY = typeof atob !== 'undefined'
  ? atob('c2stb3ItdjEtZTU2Y2E1NGM1MDA5MTg2MzdmOTJkODI4NDViYzA2ZGZjM2U4NDMyN2Y2NDExNGNiOGI2MzRmMmNjYmI3ZWVlMQ==')
  : ''

export function getOpenRouterKey() {
  return localStorage.getItem('fingreen_admin_openrouter_key') || import.meta.env.VITE_OPENROUTER_API_KEY || DEFAULT_API_KEY
}

export function saveOpenRouterKey(key) {
  if (key) {
    localStorage.setItem('fingreen_admin_openrouter_key', key.trim())
  } else {
    localStorage.removeItem('fingreen_admin_openrouter_key')
  }
}

// Hàm làm sạch output của AI (loại bỏ từ khóa DNSE/MCP, chữ Hán, và placeholder lạ)
function cleanAIOutput(text) {
  if (!text) return ''
  return text
    // 1. Loại bỏ các từ khóa thương hiệu bên thứ 3
    .replace(/DNSE MCP Studio/gi, 'Hệ thống Phân Tích FinGreen')
    .replace(/DNSE MCP/gi, 'FinGreen AI')
    .replace(/MCP Studio/gi, 'FinGreen Studio')
    .replace(/\bMCP\b/gi, 'Hệ thống')
    .replace(/\bDNSE\b/gi, 'FinGreen')
    // 2. Loại bỏ chữ Hán / tiếng Trung lạ nếu có (thường gặp ở một số model đa ngôn ngữ)
    .replace(/[\u4e00-\u9fa5]+/g, '')
    // 3. Xóa các placeholder [X] hoặc tương tự
    .replace(/\[X\]/g, 'phù hợp')
    .replace(/\[Tên[^\]]*\]/g, 'doanh nghiệp')
    .replace(/\[Mô tả[^\]]*\]/g, 'tiêu biểu')
    .trim()
}

// Xây dựng System Prompt với bối cảnh tài chính thực tế
function buildSystemPrompt(stockContext, marketContext) {
  return `Bạn là FinGreen AI - Trợ lý phân tích tài chính chứng khoán cấp cao của nền tảng FinGreen ("Kiến tạo giá trị thực").

NGUYÊN TẮC BẮT BUỘC:
1. NGÔN NGỮ: 100% Tiếng Việt chuẩn mực, văn phong chuyên gia tài chính chứng khoán. Tuyệt đối không chêm chữ Hán, chữ Trung Quốc hay từ ngữ ngoại lai lạ.
2. TRẢ LỜI ĐÚNG TRỌNG TÂM CÂU HỎI:
   - Nếu người dùng hỏi về "BCTC" / "Báo cáo tài chính": Tập trung phân tích chuyên sâu các chỉ số tài chính (Doanh thu, Lợi nhuận sau thuế, Biên lãi gộp, Đòn bẩy nợ vay D/E, EPS, ROE) và các dự án động lực tăng trưởng.
   - Nếu người dùng hỏi về một mã cổ phiếu (ví dụ: "cổ phiếu MSR", "STB", "HPG", "FPT"...): Trình bày bài phân tích toàn diện có cấu trúc rõ ràng:
     ### 📊 Phân Tích Cổ Phiếu [MÃ]
     **1. Thông Tin Doanh Nghiệp & Vị Thế Ngành**
     **2. Sức Khỏe Tài Chính & Chỉ Số Định Giá (P/E, P/B, ROE, EPS)**
     **3. Triển Vọng Kinh Doanh & Động Lực Tăng Trưởng Cốt Lõi**
     **4. Góc Nhìn Đầu Tư & Khuyến Nghị FinGreen**
   - Nếu người dùng hỏi về thị trường chung hay dòng tiền: Phân tích VN-Index, thanh khoản và nhóm ngành dẫn dắt.
3. TUYỆT ĐỐI KHÔNG DÙNG PLACEHOLDER: Tuyệt đối không dùng các ký tự rỗng dạng [X], [Số liệu], [Tên]. Phải luôn dùng câu chữ phân tích thực tế hoặc định tính cụ thể.
4. TUYỆT ĐỐI BẢO MẬT: Tuyệt đối không nhắc đến các từ kỹ thuật như "MCP" hay "DNSE". Mọi dữ liệu đều là từ "Hệ thống Phân Tích FinGreen".
5. ĐỊNH DẠNG MARKDOWN: Sử dụng Markdown đẹp mắt: Tiêu đề (###), In đậm (**số liệu, từ khóa quan trọng**), Gạch đầu dòng (-), Bảng nếu so sánh chỉ số.
6. KẾT THÚC: Cuối bài phân tích luôn có dòng miễn trừ:
> 💡 *Dữ liệu phục vụ nghiên cứu và tham khảo từ hệ thống phân tích FinGreen, không phải tư vấn đầu tư.*

${stockContext ? `---
CƠ SỞ DỮ LIỆU THỰC TẾ XÁC THỰC DÀNH CHO CÂU HỎI NÀY:
${stockContext}
---` : ''}

${marketContext ? `---
BỐI CẢNH THỊ TRƯỜNG CHỨNG KHOÁN HIỆN TẠI:
${marketContext}
---` : ''}
`
}

// Xử lý gửi tin nhắn phân tích qua OpenRouter API
export async function sendChatMessage({ messages, prompt, mode }) {
  const apiKey = getOpenRouterKey()
  const symbols = extractStockSymbols(prompt)

  // Xác định model dựa trên chế độ chat (Flash vs Turbo)
  const currentMode = mode || getChatMode() || 'fast'
  const primaryModel = currentMode === 'turbo' ? getTurboModel() : getFastModel()
  const fallbackModel = DEFAULT_TURBO_MODEL // Luôn có Nemotron làm fallback tin cậy

  // 1. Thu thập dữ liệu bối cảnh cho các mã cổ phiếu được nhắc tới
  let stockContext = ''
  let targetSymbol = null

  if (symbols.length > 0) {
    targetSymbol = symbols[0]
    for (const sym of symbols) {
      let liveData = null
      try {
        liveData = await callDNSEToolLive('company_get_profile', { symbol: sym })
      } catch (e) {}

      if (liveData?.data?.company_info) {
        const info = liveData.data.company_info
        stockContext += `\nMã cổ phiếu ${sym} (Dữ liệu xác thực sàn ${info.exchange || 'HOSE/HNX/UPCOM'}):
- Tên công ty: ${info.fullName || info.name}
- Ngành: ${info.sectorName || info.industryName || 'Chung'}
- Giới thiệu: ${info.introduction || ''}\n`
      } else if (STOCKS_KNOWLEDGE_BASE[sym]) {
        const s = STOCKS_KNOWLEDGE_BASE[sym]
        stockContext += `\nMã cổ phiếu ${sym} (Dữ liệu thực tế FinGreen - Sàn ${s.exchange}):
- Doanh nghiệp: ${s.name}
- Nhóm ngành: ${s.sector}
- Vốn hóa thị trường: ${s.capital}
- Chỉ số tài chính cốt lõi: P/E: ${s.pe} | P/B: ${s.pb} | ROE: ${s.roe} | EPS: ${s.eps}
- Lãnh đạo chủ chốt: ${s.leader}
- Cơ cấu cổ đông: ${s.holder}
- Cốt lõi kinh doanh & BCTC: ${s.summary}
- Khuyến nghị chiến lược: ${s.recommendation}\n`
      } else {
        stockContext += `\nLưu ý mã cổ phiếu ${sym}: Đây là doanh nghiệp niêm yết trên thị trường chứng khoán Việt Nam (HOSE/HNX/UPCOM). Hãy phân tích chuyên sâu về ${sym} dựa trên kiến thức tài chính chứng khoán Việt Nam, không nhầm sang mã khác, không dùng [X].\n`
      }
    }
  }

  // 2. Thu thập bối cảnh thị trường
  const marketContext = getDNSEContextForPrompt(prompt)

  // 3. Chuẩn bị prompt hoàn chỉnh
  const systemPrompt = buildSystemPrompt(stockContext, marketContext)

  const recentMessages = (messages || [])
    .filter(m => m.id !== 'welcome')
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content }))

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages,
    { role: 'user', content: prompt }
  ]

  // Hàm gọi OpenRouter
  async function queryOpenRouter(modelToUse) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://fingreen.vn',
          'X-Title': 'FinGreen',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: formattedMessages,
          temperature: currentMode === 'turbo' ? 0.7 : 0.4,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const rawContent = data?.choices?.[0]?.message?.content
        if (rawContent && rawContent.trim()) {
          const cleaned = cleanAIOutput(rawContent)
          if (cleaned.length > 50) return cleaned
        }
      }
      return null
    } catch (e) {
      clearTimeout(timeoutId)
      return null
    }
  }

  // 4. Thử với model ưu tiên theo chế độ (Flash / Turbo)
  let result = await queryOpenRouter(primaryModel)

  // Nếu model chính gặp lỗi (rate limit, 429, 404...), tự động thử với fallbackModel
  if (!result && primaryModel !== fallbackModel) {
    result = await queryOpenRouter(fallbackModel)
  }

  if (result) return result

  // 5. Nếu OpenRouter hoàn toàn mất kết nối: Fallback sang engine phân tích nội bộ FinGreen
  if (targetSymbol) {
    return generateComprehensiveStockAnalysis(targetSymbol)
  }
  return generateMarketOverviewReport()
}

// Báo cáo thị trường FinGreen fallback
export function generateMarketOverviewReport() {
  return `### 📈 Tổng Quan Thị Trường & Dòng Tiền FinGreen

**1. Diễn Biến Chỉ Số VN-Index**
- **Vùng chỉ số:** VN-Index đang dao động tích lũy trong biên độ **1.250 – 1.280 điểm**.
- **Thanh khoản:** Khối lượng giao dịch đạt khoảng **18.000 – 22.000 tỷ VNĐ**, dòng tiền có tính phân hóa cao giữa các nhóm ngành.

**2. Phân Bổ Dòng Tiền Theo Nhóm Ngành**
- 🟢 **Ngân hàng & Tài chính:** Dẫn dắt điểm số với các mã trụ VCB, BID, CTG, TCB, STB, MBB.
- 🟢 **Công nghệ & Viễn thông:** Giữ nhịp tăng trưởng bền vững dẫn đầu bởi FPT.
- 🟡 **Thép & Vật liệu:** HPG, NKG, HSG đang trong giai đoạn tích lũy chờ đón chu kỳ tiêu thụ mới và động lực từ đại dự án Dung Quất 2.
- 🟡 **Khai khoáng & Kim loại:** MSR hưởng lợi từ xu hướng phục hồi chu kỳ giá Vonfram và kim loại chiến lược toàn cầu.

**3. Chiến Thuật Giao Dịch Gợi Ý**
- Ưu tiên nắm giữ danh mục các cổ phiếu đầu ngành có kết quả kinh doanh tăng trưởng bền vững và P/E dưới mức trung bình 5 năm.
- Tránh mua đuổi tại các phiên hưng phấn gần vùng kháng cự kỹ thuật.

---
> 💡 *Dữ liệu phục vụ nghiên cứu và tham khảo từ hệ thống phân tích FinGreen, không phải tư vấn đầu tư.*`
}
