// Dịch vụ FinGreen AI tích hợp phân tích chứng khoán chuyên sâu và OpenRouter API
import {
  callDNSEToolLive, formatStockAnalysisFromDNSE,
  extractStockSymbols, generateComprehensiveStockAnalysis,
  generateSmartFallbackResponse,
  getDNSEContextForPrompt, STOCKS_KNOWLEDGE_BASE,
  fetchRealtimeQuote, FAMOUS_ENTITIES_KNOWLEDGE_BASE
} from './dnseService'

// Tuyên bố miễn trừ trách nhiệm bắt buộc theo chuẩn mực pháp lý
export const MANDATORY_DISCLAIMER = '⚠️ **Tuyên bố miễn trừ trách nhiệm:** Tín hiệu từ dữ liệu thuật toán/kỹ thuật mang tính chất THAM KHẢO, không phải là lời khuyên hay khuyến nghị đầu tư chính thức. Đầu tư chứng khoán luôn tiềm ẩn rủi ro. Nhà đầu tư tự chịu trách nhiệm về quyết định mua bán của mình.'

// Mô hình mặc định thông minh & ổn định
export const DEFAULT_FAST_MODEL = 'openai/gpt-4o-mini'
export const DEFAULT_TURBO_MODEL = 'openai/gpt-4o-mini'

// Danh sách gợi ý mô hình cho Admin
export const SUGGESTED_FAST_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini (Khuyên Dùng - Tốc Độ & Web Tốt)', provider: 'OpenAI' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Phân Tích Cực Chuẩn)', provider: 'DeepSeek' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B (Free)', provider: 'Google' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning (Free)', provider: 'Nvidia' },
]

export const SUGGESTED_TURBO_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini (Khuyên Dùng - Tốc Độ & Web Tốt)', provider: 'OpenAI' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Suy Luận Đột Phá)', provider: 'DeepSeek' },
  { id: 'openai/gpt-4o', name: 'OpenAI GPT-4o (Đỉnh Cao Toàn Diện)', provider: 'OpenAI' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning (Free)', provider: 'Nvidia' },
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

// Hàm làm sạch output của AI & chuẩn hóa thuật ngữ pháp lý an toàn (Chặn lặp disclaimer 2 lần)
function cleanAIOutput(text) {
  if (!text) return ''
  let cleaned = text
    // 1. Loại bỏ các từ khóa thương hiệu bên thứ 3
    .replace(/DNSE MCP Studio/gi, 'Hệ thống Phân Tích FinGreen')
    .replace(/DNSE MCP/gi, 'FinGreen AI')
    .replace(/MCP Studio/gi, 'FinGreen Studio')
    .replace(/\bMCP\b/gi, 'Hệ thống')
    .replace(/\bDNSE\b/gi, 'FinGreen')
    // 2. Loại bỏ chữ Hán / tiếng Trung lạ nếu có
    .replace(/[\u4e00-\u9fa5]+/g, '')
    // 3. Xóa các placeholder [X] hoặc tương tự
    .replace(/\[X\]/g, 'phù hợp')
    .replace(/\[Tên[^\]]*\]/g, 'doanh nghiệp')
    .replace(/\[Mô tả[^\]]*\]/g, 'tiêu biểu')
    // 4. CHUYỂN ĐỔI THUẬT NGỮ NHẠY CẢM ĐỂ TUÂN THỦ PHÁP LÝ (Tránh từ ngữ tư vấn đầu tư trái phép)
    .replace(/khuyến nghị mua|khuyến nghị tích lũy/gi, 'Vùng quan sát kỹ thuật (Dòng tiền tích lũy)')
    .replace(/khuyến nghị bán|khuyến nghị chốt lời/gi, 'Vùng quan sát kỹ thuật (Dòng tiền phân phối)')
    .replace(/khuyến nghị đầu tư/gi, 'Góc nhìn thuật toán kỹ thuật')
    .replace(/khuyến nghị/gi, 'Định hướng theo dõi kỹ thuật')
    .replace(/lệnh mua/gi, 'Tín hiệu dòng tiền kích hoạt mua')
    .replace(/lệnh bán/gi, 'Tín hiệu dòng tiền hạ tỷ trọng')
    .replace(/giá mục tiêu|mục tiêu giá/gi, 'Vùng kháng cự toán học')
    .replace(/mục tiêu (\d[\d\.\,]*\s*VNĐ|\d[\d\.\,]*\s*đồng)/gi, 'Vùng kháng cự toán học $1')
    .replace(/tư vấn đầu tư/gi, 'dữ liệu thuật toán tham khảo')
    .trim()

  // 5. Cắt bỏ TRIỆT ĐỂ bất kỳ đoạn disclaimer cũ/mới nào đã sinh ra để không bao giờ bị lặp 2 lần
  cleaned = cleaned
    .replace(/(?:[\r\n]+---)?[\s\r\n]*(?:>|###)?\s*(?:⚠️|💡)?\s*[\*#_]*(?:Tuyên bố|Miễn trừ trách nhiệm|Disclaimer)[\s\S]*$/gi, '')
    .trim()
    .replace(/(?:[\r\n]+---)+$/g, '')
    .trim()

  // 6. GẮN DUY NHẤT 1 TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM BẮT BUỘC Ở CUỐI TIN NHẮN
  return `${cleaned}\n\n---\n> ${MANDATORY_DISCLAIMER}`
}

// Xây dựng System Prompt thích ứng thông minh theo Ý ĐỊNH người dùng
function buildSystemPrompt(stockContext, marketContext, intent) {
  let taskInstruction = ''

  if (intent.isBCTC) {
    taskInstruction = `
NGƯỜI DÙNG ĐANG YÊU CẦU: Phân tích Báo Cáo Tài Chính (BCTC).
BẮT BUỘC TRẢ LỜI ĐÚNG TRỌNG TÂM BCTC THEO CẤU TRÚC:
### 📑 Báo Cáo Tài Chính & Sức Khỏe Doanh Nghiệp [MÃ]
**1. Kết Quả Kinh Doanh Cốt Lõi (Doanh thu & Lợi nhuận)**
- Doanh thu / Thu nhập hoạt động (NII nếu là ngân hàng)
- Lợi nhuận trước thuế & Lợi nhuận sau thuế
- Biên lợi nhuận (NIM đối với ngân hàng, Biên lãi gộp đối với sản xuất/bán lẻ)
**2. Chất Lượng Tài Sản & Đòn Bẩy (NPL, LLR, CASA hoặc Nợ vay D/E)**
- Nợ vay / Đòn bẩy tài chính D/E (đối với ngân hàng: Nợ xấu NPL, Bao phủ nợ xấu LLR, Tỷ lệ CASA)
- Cơ cấu tài sản và mức độ an toàn nguồn vốn
**3. Chỉ Số Hiệu Quả Sinh Lời & Định Giá Từ BCTC**
- ROE, ROA, EPS, P/E, P/B
**4. Đánh Giá Khách Quan & Triển Vọng Tài Chính**
Tuyệt đối không nhầm sang bài phân tích kỹ thuật chung.`
  } else if (intent.isNewsOrGeneral) {
    taskInstruction = `
NGƯỜI DÙNG ĐANG HỎI CÂU HỎI THÔNG TIN / TIN TỨC / TẠI SAO / LỊCH SỬ / GIAO DỊCH CỔ PHẦN:
- TỰ ĐỘNG TRA CỨU TIN TỨC THỜI GIAN THỰC & BÁO CHÍ (CafeF, Vietstock, VnEconomy, Tin Nhanh Chứng Khoán, Tuổi Trẻ...).
- Trả lời rõ ràng, chính xác, cập nhật nhất về nguyên nhân, sự kiện hoặc danh tính được hỏi (Ví dụ: tại sao giá vonfram tăng, ai bán cổ phần, ai sáng lập...).
- BẮT BUỘC TRÍCH DẪN NGUỒN BÁO HOẶC TRANG TIN TỨC ĐÃ TRA CỨU ở cuối câu trả lời dạng Markdown link (ví dụ: [CafeF](https://cafef.vn), [Vietstock](https://vietstock.vn)...).
- TUYỆT ĐỐI KHÔNG xuất bài phân tích kỹ thuật hay biểu mẫu cổ phiếu rập khuôn!`
  } else if (intent.isFactual) {
    taskInstruction = `
NGƯỜI DÙNG ĐANG HỎI CÂU HỎI THÔNG TIN / NHÂN SỰ / LỊCH SỬ DOANH NGHIỆP:
- BẮT BUỘC TRẢ LỜI TRỰC DIỆN, RÕ RÀNG, CHÍNH XÁC VÀ SÚC TÍCH.
- Nêu rõ danh tính người sáng lập, lãnh đạo, lịch sử hình thành hoặc nội dung được hỏi kèm trích dẫn nguồn tin cậy nếu có.
- TUYỆT ĐỐI KHÔNG xuất bài phân tích kỹ thuật hay biểu mẫu cổ phiếu rập khuôn nếu người dùng không yêu cầu phân tích cổ phiếu!`
  } else if (intent.isPrice) {
    taskInstruction = `
NGƯỜI DÙNG ĐANG HỎI VỀ THỊ GIÁ CỔ PHIẾU:
- BẮT BUỘC TRẢ LỜI TRỰC DIỆN con số "Thị giá khớp lệnh" được cung cấp trong phần dữ liệu thực tế bên dưới.
- Nêu rõ: Thị giá hiện tại, biến động trong phiên, vùng dao động cao nhất / thấp nhất và khối lượng khớp lệnh.
- TUYỆT ĐỐI KHÔNG tự bịa đặt hoặc suy đoán mức giá khác.`
  } else {
    taskInstruction = `
NGƯỜI DÙNG ĐANG YÊU CẦU PHÂN TÍCH TỔNG HỢP CỔ PHIẾU:
Trình bày bài phân tích có cấu trúc khoa học:
### 📊 Phân Tích Kỹ Thuật & Cổ Phiếu [MÃ]
**1. Thị Giá Thực Tế & Tín Hiệu Giao Dịch**
**2. Thông Tin Doanh Nghiệp & Vị Thế Ngành**
**3. Sức Khỏe Tài Chính & Chỉ Số Định Giá (P/E, P/B, ROE, EPS)**
**4. Góc Nhìn Thuật Toán & Tín Hiệu Dòng Tiền FinGreen**`
  }

  return `Bạn là FinGreen AI - Trợ lý phân tích dữ liệu tài chính và chứng khoán thông minh của nền tảng FinGreen ("Kiến tạo giá trị thực").

${taskInstruction}

QUY ĐỊNH BẮT BUỘC VỀ PHÁP LÝ & TỪ NGỮ:
1. TUYỆT ĐỐI TRÁNH CÁC TỪ NGỮ TƯ VẤN ĐẦU TƯ:
   - KHÔNG DÙNG: "Khuyến nghị", "Khuyến nghị mua", "Khuyến nghị bán", "Lệnh mua", "Lệnh bán", "Mục tiêu", "Giá mục tiêu", "Tư vấn đầu tư".
   - BẮT BUỘC DÙNG THUẬT NGỮ KỸ THUẬT & DÒNG TIỀN:
     • "Vùng quan sát kỹ thuật" (thay cho vùng giá khuyến nghị)
     • "Vùng hỗ trợ/kháng cự toán học" (thay cho giá mục tiêu / cắt lỗ)
     • "Dữ liệu dòng tiền kích hoạt" (thay cho lệnh mua)
     • "Tín hiệu dòng tiền" hoặc "Góc nhìn thuật toán FinGreen"
2. NGÔN NGỮ & SỐ LIỆU:
   - 100% Tiếng Việt chuẩn mực, khách quan, chính xác. Tuyệt đối không chêm chữ Hán, chữ Trung Quốc hay từ ngữ ngoại lai lạ.
   - TUYỆT ĐỐI KHÔNG DÙNG placeholder rỗng [X], [Số liệu], [Tên].
   - TUYỆT ĐỐI BẢO MẬT: Không nhắc đến "DNSE" hay "MCP".

${stockContext ? `---
CƠ SỞ DỮ LIỆU XÁC THỰC DÀNH CHO CÂU HỎI NÀY:
${stockContext}
---` : ''}

${marketContext ? `---
BỐI CẢNH THỊ TRƯỜNG CHỨNG KHOÁN HIỆN TẠI:
${marketContext}
---` : ''}
`
}

// Thu thập ngữ cảnh thị giá thời gian thực, thông tin BCTC và phân loại ý định
async function gatherStockAndMarketContext(prompt) {
  const isBCTC = /bctc|báo cáo tài chính|kết quả kinh doanh|doanh thu|lợi nhuận|nợ xấu|biên lãi|casa|nim|roe|roa/i.test(prompt)
  const isPrice = /giá|thị giá|bao nhiêu|giá hiện tại/i.test(prompt)
  const isFactual = /ai là|người sáng lập|ông chủ|lãnh đạo|lịch sử|thành lập|chủ tịch|tổng giám đốc|ceo/i.test(prompt)
  const isNewsOrGeneral = /vì sao|tại sao|nguyên nhân|tin tức|sự kiện|bán cổ phần|mua cổ phần|thoái vốn|sáp nhập|mua lại|m&a|thương vụ|dự án|tin mới|báo chí|cafef|vietstock|vneconomy|thế giới|quốc tế|hàng hóa|vonfram|dầu thô|vàng|fed|lãi suất/i.test(prompt) || (isFactual && !/vps/i.test(prompt))

  const intent = { isBCTC, isPrice, isFactual, isNewsOrGeneral }

  let stockContext = ''
  let targetSymbol = null

  // 1. Kiểm tra các thực thể tài chính lớn nổi tiếng (VPS, Masan, FPT, Hòa Phát, Vingroup...)
  if (/vps|chứng khoán vps/i.test(prompt)) {
    const vps = FAMOUS_ENTITIES_KNOWLEDGE_BASE.VPS
    stockContext += `\nTHÔNG TIN XÁC THỰC VỀ THỰC THỂ ĐƯỢC HỎI (${vps.name}):
- Vị thế: ${vps.role}
- Trạng thái niêm yết: ${vps.status}
- Người sáng lập & Lãnh đạo chủ chốt: ${vps.founder}
- Lịch sử hình thành: ${vps.history}
- Điểm nổi bật: ${vps.highlight}\n`
  }

  // 2. Trích xuất mã cổ phiếu nếu có
  const symbols = extractStockSymbols(prompt)
  if (symbols.length > 0) {
    targetSymbol = symbols[0]
    for (const sym of symbols) {
      // Thị giá thời gian thực
      const quote = await fetchRealtimeQuote(sym)
      if (quote) {
        stockContext += `\nDỮ LIỆU THỊ GIÁ THỜI GIAN THỰC TỪ SÀN CHỨNG KHOÁN (Phiên ${quote.date}):
- Mã cổ phiếu: ${sym}
- Thị giá khớp lệnh mới nhất: ${quote.priceFormatted}
- Biến động trong phiên: ${quote.changeFormatted}
- Vùng dao động trong phiên: Thấp nhất ${quote.lowFormatted} - Cao nhất ${quote.highFormatted}
- Khối lượng giao dịch: ${quote.volume} cổ phiếu\n`
      }

      // Thông tin cơ bản & BCTC từ Knowledge Base
      if (STOCKS_KNOWLEDGE_BASE[sym]) {
        const s = STOCKS_KNOWLEDGE_BASE[sym]
        stockContext += `\nThông tin doanh nghiệp & BCTC mã ${sym} (${s.name} - Sàn ${s.exchange}):
- Nhóm ngành: ${s.sector}
- Vốn hóa thị trường: ${s.capital}
- Dữ liệu tài chính & BCTC: P/E: ${s.pe} | P/B: ${s.pb} | ROE: ${s.roe} | EPS: ${s.eps}
${s.bctc ? `- Số liệu BCTC chi tiết: ${s.bctc}\n` : ''}- Lãnh đạo chủ chốt: ${s.leader}
- Cơ cấu cổ đông: ${s.holder}
- Cốt lõi kinh doanh: ${s.summary}
- Tín hiệu dòng tiền & Vùng quan sát kỹ thuật: ${s.signal || s.recommendation}\n`
      } else {
        stockContext += `\nLưu ý mã cổ phiếu ${sym}: Đây là doanh nghiệp niêm yết trên thị trường chứng khoán Việt Nam (HOSE/HNX/UPCOM). Hãy phân tích kỹ thuật và tài chính về ${sym}, không nhầm sang mã khác, không dùng [X].\n`
      }
    }
  }

  const marketContext = getDNSEContextForPrompt(prompt)
  const systemPrompt = buildSystemPrompt(stockContext, marketContext, intent)

  return { stockContext, marketContext, systemPrompt, targetSymbol, intent }
}

// Hàm chọn model thông minh: Nếu là câu hỏi tin tức/sự kiện/lý do thì tự động thêm :online để tra cứu web
function resolveModelWithWebSearch(baseModel, intent) {
  if (!baseModel) return DEFAULT_TURBO_MODEL
  if (intent?.isNewsOrGeneral) {
    if (baseModel.endsWith(':online')) return baseModel
    // Thêm hậu tố :online để OpenRouter tự động search Google/Exa và trích nguồn
    return `${baseModel}:online`
  }
  return baseModel
}

// Xử lý gửi tin nhắn phân tích qua OpenRouter API
export async function sendChatMessage({ messages, prompt, mode }) {
  const apiKey = getOpenRouterKey()
  const { systemPrompt, targetSymbol, intent } = await gatherStockAndMarketContext(prompt)

  const currentMode = mode || getChatMode() || 'fast'
  const rawPrimary = currentMode === 'turbo' ? getTurboModel() : getFastModel()
  const primaryModel = resolveModelWithWebSearch(rawPrimary, intent)
  const fallbackModel = resolveModelWithWebSearch(DEFAULT_TURBO_MODEL, intent)

  const recentMessages = (messages || [])
    .filter(m => m.id !== 'welcome')
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content }))

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages,
    { role: 'user', content: prompt }
  ]

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
          temperature: currentMode === 'turbo' ? 0.6 : 0.3,
          max_tokens: 2500,
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

  let result = await queryOpenRouter(primaryModel)
  if (!result && primaryModel !== fallbackModel) {
    result = await queryOpenRouter(fallbackModel)
  }

  if (result) return result

  return await generateSmartFallbackResponse(targetSymbol, intent)
}

// Xử lý gửi tin nhắn phân tích thời gian thực dạng Streaming (SSE)
export async function streamChatMessage({ messages, prompt, mode, onChunk, onComplete, onError }) {
  const apiKey = getOpenRouterKey()
  const { systemPrompt, targetSymbol, intent } = await gatherStockAndMarketContext(prompt)

  const currentMode = mode || getChatMode() || 'fast'
  const rawPrimary = currentMode === 'turbo' ? getTurboModel() : getFastModel()
  const primaryModel = resolveModelWithWebSearch(rawPrimary, intent)
  const fallbackModel = resolveModelWithWebSearch(DEFAULT_TURBO_MODEL, intent)

  const recentMessages = (messages || [])
    .filter(m => m.id !== 'welcome')
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content }))

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages,
    { role: 'user', content: prompt }
  ]

  async function attemptStream(modelToUse) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

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
          temperature: currentMode === 'turbo' ? 0.6 : 0.3,
          max_tokens: 2500,
          stream: true
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok || !response.body) {
        return false
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim()
            if (dataStr === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(dataStr)
              const delta = parsed?.choices?.[0]?.delta?.content
              if (delta) {
                accumulated += delta
                if (onChunk) onChunk(accumulated)
              }
            } catch (e) {}
          }
        }
      }

      if (accumulated.trim().length > 20) {
        const cleaned = cleanAIOutput(accumulated)
        if (onComplete) onComplete(cleaned)
        return true
      }
      return false
    } catch (e) {
      clearTimeout(timeoutId)
      return false
    }
  }

  let ok = await attemptStream(primaryModel)
  if (!ok && primaryModel !== fallbackModel) {
    ok = await attemptStream(fallbackModel)
  }

  if (!ok) {
    const fallbackText = await generateSmartFallbackResponse(targetSymbol, intent)
    await simulateStreaming(fallbackText, onChunk, onComplete)
  }
}

async function simulateStreaming(fullText, onChunk, onComplete) {
  const words = fullText.split(' ')
  let current = ''
  for (let i = 0; i < words.length; i++) {
    current += (i === 0 ? '' : ' ') + words[i]
    if (onChunk && i % 2 === 0) onChunk(current)
    await new Promise(r => setTimeout(r, 18))
  }
  const cleaned = cleanAIOutput(fullText)
  if (onChunk) onChunk(cleaned)
  if (onComplete) onComplete(cleaned)
}

// Báo cáo thị trường FinGreen fallback
export function generateMarketOverviewReport() {
  return `### 📈 Tổng Quan Thị Trường & Dữ Liệu Dòng Tiền FinGreen

**1. Diễn Biến Chỉ Số VN-Index**
- **Vùng chỉ số:** VN-Index đang dao động tích lũy trong biên độ **1.250 – 1.280 điểm**.
- **Thanh khoản:** Khối lượng giao dịch đạt khoảng **18.000 – 22.000 tỷ VNĐ**, dòng tiền có tính phân hóa cao giữa các nhóm ngành.

**2. Phân Bổ Dòng Tiền Theo Nhóm Ngành**
- 🟢 **Ngân hàng & Tài chính:** Dữ liệu dòng tiền kích hoạt tích cực với các mã trụ VCB, BID, CTG, TCB, STB, MBB.
- 🟢 **Công nghệ & Viễn thông:** Giữ nhịp tăng trưởng bền vững dẫn đầu bởi FPT.
- 🟡 **Thép & Vật liệu:** HPG, NKG, HSG đang trong vùng quan sát kỹ thuật chờ đón chu kỳ tiêu thụ mới và đại dự án Dung Quất 2.
- 🟡 **Khai khoáng & Kim loại:** MSR ghi nhận tín hiệu dòng tiền hồi phục theo chu kỳ giá Vonfram và kim loại chiến lược toàn cầu.

**3. Vùng Quan Sát & Tín Hiệu Thuật Toán Gợi Ý**
- Ưu tiên quan sát danh mục các cổ phiếu đầu ngành có kết quả kinh doanh tăng trưởng bền vững và P/E dưới mức trung bình 5 năm.
- Cân nhắc quản trị rủi ro tại các phiên hưng phấn gần vùng kháng cự toán học 1.280 điểm.

---
> ${MANDATORY_DISCLAIMER}`
}
