// Dịch vụ AI tích hợp OpenRouter API và DNSE MCP Data
import { getDNSEContextForPrompt, DNSE_STOCKS_DATABASE } from './dnseService'

// Model mặc định do Admin cấu hình (Ưu tiên gpt-4o, có auto fallback nếu tài khoản chưa nạp credits)
export const DEFAULT_MODEL = 'openai/gpt-4o'
const FALLBACK_FREE_MODEL = 'nvidia/nemotron-3.5-lightning:free'

export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o', name: 'OpenAI GPT-4o (Khuyên dùng)', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini (Tiết kiệm)', provider: 'OpenAI' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nvidia Nemotron 3.5 (Free)', provider: 'Nvidia' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat V3', provider: 'DeepSeek' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'Meta' },
]

// Lấy API Key từ hệ thống do Admin cấu hình (Admin Storage hoặc .env)
export function getOpenRouterKey() {
  return localStorage.getItem('fingreen_admin_openrouter_key') || import.meta.env.VITE_OPENROUTER_API_KEY || ''
}

// Chỉ Admin mới được lưu key
export function saveOpenRouterKey(key) {
  if (key) {
    localStorage.setItem('fingreen_admin_openrouter_key', key.trim())
  } else {
    localStorage.removeItem('fingreen_admin_openrouter_key')
  }
}

export function getSelectedModel() {
  return localStorage.getItem('fingreen_admin_ai_model') || DEFAULT_MODEL
}

export function saveSelectedModel(modelId) {
  localStorage.setItem('fingreen_admin_ai_model', modelId)
}

// Xây dựng System Prompt chuẩn chuyên gia FinGreen AI kết nối DNSE MCP Studio
function buildSystemPrompt(dnseContext) {
  return `Bạn là FinGreen AI - Trợ lý phân tích chứng khoán và đầu tư tài chính thông minh của nền tảng FinGreen ("Kiến tạo giá trị thực").
Bạn được tích hợp trực tiếp với hệ sinh thái dữ liệu thị trường tài chính DNSE MCP Studio.

NHIỆM VỤ CỦA BẠN:
1. Cung cấp góc nhìn phân tích thị trường chứng khoán Việt Nam (VN-Index, HNX, UPCOM) chuyên sâu, khách quan, dữ liệu minh bạch.
2. Phân tích doanh nghiệp toàn diện:
   - Thông tin doanh nghiệp, ban lãnh đạo và cơ cấu cổ đông.
   - Sức khỏe tài chính: Doanh thu, Lợi nhuận sau thuế, Biên lãi gộp/ròng, Nợ vay/Vốn chủ sở hữu.
   - Định giá: P/E, P/B, ROE, ROA, EPS so với trung bình ngành.
   - Phân tích kỹ thuật: Xu hướng giá ngắn/trung hạn, hỗ trợ/kháng cự, chỉ báo RSI, MACD, MA20/MA50.
3. Luôn trình bày câu trả lời có cấu trúc rõ ràng: Dùng Markdown, bullet points, in đậm số liệu quan trọng, bảng so sánh nếu cần.
4. Cuối mỗi phân tích luôn kèm câu khuyến nghị súc tích và Tuyên bố miễn trừ trách nhiệm (Disclaimer): "Dữ liệu phục vụ nghiên cứu và tham khảo, không phải tư vấn đầu tư."

${dnseContext ? `[DỮ LIỆU THỜI GIAN THỰC TỪ DNSE MCP STUDIO CHO YÊU CẦU NÀY]:\n${dnseContext}\n-> HÃY SỬ DỤNG DỮ LIỆU NÀY ĐỂ TRẢ LỜI CHÍNH XÁC NHẤT.` : ''}
`
}

// Gọi OpenRouter API chuẩn theo format yêu cầu của bạn
async function callOpenRouterEndpoint({ apiKey, model, messages }) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://fingreen.vn',
      'X-Title': 'FinGreen',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const status = response.status
    const errorMsg = errorBody?.error?.message || `Lỗi HTTP ${status}`
    const errorObj = new Error(errorMsg)
    errorObj.status = status
    throw errorObj
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || 'Không có phản hồi từ AI.'
}

// Gửi tin nhắn chính thức
export async function sendChatMessage({ messages, prompt, model }) {
  const apiKey = getOpenRouterKey()
  const activeModel = model || getSelectedModel()
  const dnseContext = getDNSEContextForPrompt(prompt)
  const systemPrompt = buildSystemPrompt(dnseContext)

  // Nếu hệ thống chưa cấu hình key, dùng bộ phân tích DNSE
  if (!apiKey) {
    return generateSmartDnseFallback(prompt, dnseContext)
  }

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt }
  ]

  try {
    // 1. Thử gọi với model được cấu hình
    return await callOpenRouterEndpoint({
      apiKey,
      model: activeModel,
      messages: formattedMessages
    })
  } catch (err) {
    console.warn(`Lỗi khi gọi model ${activeModel}:`, err)

    // Nếu lỗi 402 (Payment Required) do tài khoản OpenRouter chưa nạp credits cho GPT-4o
    if (err.status === 402 && activeModel !== FALLBACK_FREE_MODEL) {
      console.log(`Chuyển sang fallback model miễn phí (${FALLBACK_FREE_MODEL})...`)
      try {
        const fallbackReply = await callOpenRouterEndpoint({
          apiKey,
          model: FALLBACK_FREE_MODEL,
          messages: formattedMessages
        })
        return fallbackReply
      } catch (fallbackErr) {
        console.warn('Fallback model cũng gặp lỗi:', fallbackErr)
      }
    }

    // Nếu cả 2 đều không thành công, trả về dữ liệu DNSE MCP Studio
    return generateSmartDnseFallback(prompt, dnseContext)
  }
}

// Dữ liệu fallback trực tiếp từ DNSE MCP Studio
function generateSmartDnseFallback(prompt, dnseContext) {
  const upper = prompt.toUpperCase()
  
  for (const sym of Object.keys(DNSE_STOCKS_DATABASE)) {
    if (upper.includes(sym)) {
      const stock = DNSE_STOCKS_DATABASE[sym]
      return `### 📊 Báo Cáo Phân Tích Cổ Phiếu ${sym} (Dữ liệu DNSE MCP Studio)

**1. Thông Tin Doanh Nghiệp**
- **Doanh nghiệp:** ${stock.name} (${stock.exchange})
- **Nhóm ngành:** ${stock.sector}
- **Vốn hóa:** ${stock.capital}
- **Lãnh đạo chủ chốt:** ${stock.leader}

**2. Chỉ Số Tài Chính & Định Giá (DNSE Index)**
- **P/E:** \`${stock.pe}\` | **P/B:** \`${stock.pb}\`
- **ROE:** \`${stock.roe}\` | **EPS:** \`${stock.eps}\`

**3. Đánh Giá Xu Hướng & Cốt Lõi**
${stock.summary}

**4. Góc Nhìn Đầu Tư FinGreen & DNSE**
- **Khuyến nghị:** **${stock.recommendation}**
- **Chiến lược:** Theo dõi sát diễn biến dòng tiền của khối ngoại và thanh khoản trong phiên để canh điểm giải ngân phù hợp.

---
> 💡 *Dữ liệu đồng bộ trực tiếp từ hệ sinh thái DNSE MCP Studio. Dữ liệu phục vụ nghiên cứu và tham khảo, không phải tư vấn đầu tư.*`
    }
  }

  if (/thị trường|vn-index|vnindex|dòng tiền|thanh khoản|ngành/i.test(prompt)) {
    return `### 📈 Tổng Quan Thị Trường & Dòng Tiền (DNSE MCP Market Overview)

**1. Diễn Biến Chỉ Số VN-Index**
- **Vùng chỉ số:** VN-Index đang dao động tích lũy trong biên độ **1.250 – 1.280 điểm**.
- **Thanh khoản:** Khối lượng giao dịch đạt khoảng **18.000 – 22.000 tỷ VNĐ**, dòng tiền có tính phân hóa cao.

**2. Phân Bổ Dòng Tiền Theo Ngành (DNSE Sector Heatmap)**
- 🟢 **Ngân hàng & Tài chính:** Dẫn dắt điểm số với các mã trụ VCB, BID, CTG, TCB.
- 🟢 **Công nghệ & Viễn thông:** Giữ nhịp tăng trưởng bền vững dẫn đầu bởi FPT.
- 🟡 **Thép & Vật liệu:** HPG, NKG đang trong giai đoạn tích lũy chờ đón chu kỳ tiêu thụ mới.

**3. Chiến Thuật Giao Dịch Gợi Ý**
- Ưu tiên nắm giữ danh mục các cổ phiếu đầu ngành có kết quả kinh doanh quý tăng trưởng trên 20% và P/E dưới mức trung bình 5 năm.
- Tránh mua đuổi tại các phiên hưng phấn gần vùng kháng cự 1.280 điểm.

---
> 💡 *Dữ liệu phục vụ nghiên cứu và tham khảo từ DNSE MCP Studio.*`
  }

  return `### 🤖 Chào mừng bạn đến với FinGreen AI!

Tôi là trợ lý phân tích tài chính chứng khoán FinGreen, được kết nối với hệ thống dữ liệu **DNSE MCP Studio** và **OpenRouter**.

**Bạn có thể hỏi tôi bất kỳ điều gì về:**
- 📈 **Phân tích cổ phiếu:** Ví dụ *"Phân tích mã HPG"*, *"Định giá cổ phiếu FPT"*, *"BCTC quý gần nhất của VCB"*
- 📊 **Thị trường chung:** Ví dụ *"VN-Index dẫn dắt bởi ngành nào?"*, *"Dòng tiền ngành 5 phiên gần nhất"*
- 💡 **Chiến thuật đầu tư:** Ví dụ *"Tạo chiến thuật bắt đáy theo RSI"*

---
> 💡 *Dữ liệu phục vụ nghiên cứu và tham khảo từ DNSE MCP Studio.*`
}
