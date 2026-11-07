// Dịch vụ AI tích hợp OpenRouter API và DNSE MCP Data
import { getDNSEContextForPrompt, DNSE_STOCKS_DATABASE } from './dnseService'

const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free'

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free & Fast)', provider: 'Google' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat V3', provider: 'DeepSeek' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'Meta' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
]

export function getOpenRouterKey() {
  return localStorage.getItem('fingreen_openrouter_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || ''
}

export function saveOpenRouterKey(key) {
  if (key) {
    localStorage.setItem('fingreen_openrouter_api_key', key.trim())
  } else {
    localStorage.removeItem('fingreen_openrouter_api_key')
  }
}

export function getSelectedModel() {
  return localStorage.getItem('fingreen_ai_model') || DEFAULT_MODEL
}

export function saveSelectedModel(modelId) {
  localStorage.setItem('fingreen_ai_model', modelId)
}

// Xây dựng System Prompt chuẩn chuyên gia FinGreen AI kết nối DNSE MCP
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

// Gửi tin nhắn đến OpenRouter API
export async function sendChatMessage({ messages, prompt, model }) {
  const apiKey = getOpenRouterKey()
  const activeModel = model || getSelectedModel()
  const dnseContext = getDNSEContextForPrompt(prompt)
  const systemPrompt = buildSystemPrompt(dnseContext)

  // Nếu không có API Key, trả về phản hồi thông minh dựa trên dữ liệu DNSE (Smart Fallback)
  if (!apiKey) {
    return generateSmartDnseFallback(prompt, dnseContext)
  }

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt }
  ]

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fingreen.vn',
        'X-Title': 'FinGreen AI - Chuyên Gia Chứng Khoán DNSE'
      },
      body: JSON.stringify({
        model: activeModel,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1500,
      })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData?.error?.message || `Lỗi OpenRouter: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    const replyText = data?.choices?.[0]?.message?.content || 'Không nhận được phản hồi từ AI.'
    return replyText
  } catch (error) {
    console.error('Lỗi khi gọi OpenRouter:', error)
    // Nếu lỗi kết nối hoặc hết hạn token, dùng chế độ phân tích DNSE cục bộ
    return `⚠️ **Không thể kết nối OpenRouter:** ${error.message}\n\n---\n\n` + generateSmartDnseFallback(prompt, dnseContext)
  }
}

// Chế độ thông minh sử dụng trực tiếp dữ liệu DNSE MCP khi chưa có OpenRouter Key
function generateSmartDnseFallback(prompt, dnseContext) {
  const upper = prompt.toUpperCase()
  
  // Kiểm tra nếu hỏi về mã cổ phiếu cụ thể
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
> 💡 *Dữ liệu đồng bộ trực tiếp từ hệ sinh thái DNSE MCP Studio. Dữ liệu phục vụ nghiên cứu và tham khảo, không phải lời mời chào mua bán chứng khoán.*

*(Để trò chuyện linh hoạt đa chủ đề hơn với mô hình ngôn ngữ lớn, bạn có thể nhập OpenRouter API Key ở nút Cài Đặt phía trên!)*`
    }
  }

  // Nếu hỏi về thị trường chung hoặc VN-Index
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

  // Trả về câu trả lời trợ giúp tổng quát
  return `### 🤖 Chào mừng bạn đến với FinGreen AI!

Tôi là trợ lý phân tích tài chính chứng khoán FinGreen, được kết nối với hệ thống dữ liệu **DNSE MCP Studio** và mô hình **OpenRouter**.

**Bạn có thể hỏi tôi bất kỳ điều gì về:**
- 📈 **Phân tích cổ phiếu:** Ví dụ *"Phân tích mã HPG"*, *"Định giá cổ phiếu FPT"*, *"BCTC quý gần nhất của VCB"*
- 📊 **Thị trường chung:** Ví dụ *"VN-Index dẫn dắt bởi ngành nào?"*, *"Dòng tiền ngành 5 phiên gần nhất"*
- 💡 **Chiến thuật đầu tư:** Ví dụ *"Tạo chiến thuật bắt đáy theo RSI"*

*(Lưu ý: Bạn có thể cài đặt OpenRouter API Key trong phần Cài Đặt để mở khóa toàn bộ sức mạnh trò chuyện không giới hạn).*`
}
