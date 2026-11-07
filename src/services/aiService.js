// Dịch vụ FinGreen AI tích hợp phân tích chứng khoán chuyên sâu và OpenRouter API
import {
  callDNSEToolLive, formatStockAnalysisFromDNSE,
  extractStockSymbols, generateComprehensiveStockAnalysis,
  generateSmartFallbackResponse, generateMarketOverviewReport,
  getDNSEContextForPrompt, STOCKS_KNOWLEDGE_BASE,
  fetchRealtimeQuote, FAMOUS_ENTITIES_KNOWLEDGE_BASE
} from './dnseService'

// Tuyên bố miễn trừ trách nhiệm bắt buộc theo chuẩn mực pháp lý
export const MANDATORY_DISCLAIMER = '⚠️ **Tuyên bố miễn trừ trách nhiệm:** Thông tin, số liệu và tín hiệu chỉ mang tính chất tham khảo, không phải lời khuyên đầu tư. Chúng tôi không đảm bảo tính toàn vẹn, chính xác của dữ liệu và không chịu trách nhiệm dưới mọi hình thức đối với sai sót, chậm trễ, tổn thất giao dịch hoặc việc người dùng tự ý trích dẫn, phát tán thông tin cho bên thứ ba. Nhà đầu tư tự chịu trách nhiệm cho mọi quyết định của mình.'

// Mô hình mặc định thông minh & ổn định trên Google AI Studio
export const DEFAULT_FAST_MODEL = 'gemini-3.6-flash'
export const DEFAULT_TURBO_MODEL = 'gemini-3.6-flash'

// Danh sách gợi ý mô hình Google Gemini cho Admin
export const SUGGESTED_FAST_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Khuyên Dùng - Tốc Độ Nhanh & Ổn Định Nhất)', provider: 'Google' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Tốc Độ Cao)', provider: 'Google' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Thế Hệ Mới)', provider: 'Google' },
]

export const SUGGESTED_TURBO_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Khuyên Dùng - Toàn Diện & Phản Hồi Sâu)', provider: 'Google' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Chính Xác)', provider: 'Google' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Thế Hệ Mới)', provider: 'Google' },
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

// API Key Google Gemini (Google AI Studio)
const DEFAULT_GEMINI_KEY = typeof atob !== 'undefined'
  ? atob('QVEuQWI4Uk42STg5YUtCMzgzVTlzd3hDaWxvTGlSQndUTWpWRnZmdDBnNkJybWhSbk5NblE=')
  : ''

export function getGeminiApiKey() {
  return localStorage.getItem('fingreen_admin_gemini_key') ||
    localStorage.getItem('fingreen_admin_openrouter_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    DEFAULT_GEMINI_KEY
}

export function saveGeminiApiKey(key) {
  if (key) {
    localStorage.setItem('fingreen_admin_gemini_key', key.trim())
  } else {
    localStorage.removeItem('fingreen_admin_gemini_key')
  }
}

// Tương thích ngược với các tên cũ
export function getOpenRouterKey() {
  return getGeminiApiKey()
}

export function saveOpenRouterKey(key) {
  saveGeminiApiKey(key)
}

// Chuẩn hóa định dạng trích dẫn nguồn dữ liệu theo phong cách FinGreen AI & loại bỏ link rác giữa văn bản
function formatFinGreenSources(text) {
  if (!text) return ''

  // 1. Thu thập tất cả các liên kết markdown [domain/text](http...) xuất hiện trong bài
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
  const allFoundSources = []
  let match

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const linkText = match[1].trim()
    const url = match[2].trim()

    // Lấy domain hoặc tên nguồn gọn gàng
    let sourceName = linkText
    if (/https?:\/\//i.test(sourceName) || sourceName.includes('/')) {
      try {
        sourceName = new URL(url).hostname.replace(/^www\./, '')
      } catch (e) {
        sourceName = linkText.replace(/https?:\/\//i, '').split('/')[0]
      }
    }
    // Lược bỏ www. nếu có
    sourceName = sourceName.replace(/^www\./i, '')
    if (sourceName && sourceName.length > 1 && !allFoundSources.includes(sourceName)) {
      allFoundSources.push(sourceName)
    }
  }

  // 2. Tìm khối nguồn tham khảo cũ ở cuối nếu có (để lấy thêm tên nguồn nếu mô hình tự viết dạng text)
  const sourceBlockRegex = /(?:[\r\n]+---)?[\s\r\n]*(?:\*{0,2}(?:📊\s*)?(?:Nguồn(?:\s+tin|\s+tham\s+khảo|\s+báo|\s+dữ\s+liệu)?|Sources?):\*{0,2})\s*([\s\S]*?)(?=(?:[\r\n]+---)|(?:[\r\n]+>)|$)/i
  const existingSourceBlock = text.match(sourceBlockRegex)
  if (existingSourceBlock && existingSourceBlock[1]) {
    const rawSources = existingSourceBlock[1].trim()
    const extracted = rawSources
      .replace(/\[([^\]]+)\](?:\([^\)]+\))?/g, '$1')
      .split(/[,;\n•\/\-]+/)
      .map(s => s.replace(/[\*\_\[\]\(\)]/g, '').replace(/https?:\/\/[^\s]+/g, '').replace(/^www\./i, '').trim())
      .filter(s => s.length > 1 && !s.includes('http') && !s.toLowerCase().includes('fingreen'))

    extracted.forEach(name => {
      if (!allFoundSources.includes(name)) {
        allFoundSources.push(name)
      }
    })
  }

  // 3. XÓA BỎ HOÀN TOÀN khối trích dẫn nguồn cũ (nếu có) để tránh lặp
  let cleaned = text.replace(sourceBlockRegex, '')

  // 4. LOẠI BỎ TOÀN BỘ CÁC INLINE LINK [domain](url) TRONG THÂN BÀI VIẾT để chữ sạch đẹp, không bị rối mắt
  // Thay thế "... [f247.com](http...) ..." thành "..."
  cleaned = cleaned.replace(/\s*\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, '')

  // 5. XÓA CÁC BIỂU TƯỢNG 📊 ĐỨNG CÔ ĐỘC TRÊN DÒNG RIÊNG (do mô hình tạo ngắt quãng)
  cleaned = cleaned.replace(/[\r\n]+\s*📊\s*[\r\n]+/g, '\n\n')

  // 6. Nếu có nguồn tìm kiếm được, tạo dòng Nguồn dữ liệu FinGreen AI chuẩn duy nhất ở cuối bài
  if (allFoundSources.length > 0) {
    const cleanList = allFoundSources
      .filter(s => !/fingreen/i.test(s))
      .slice(0, 6) // Giữ tối đa 6 nguồn chính
      .join(', ')

    if (cleanList) {
      cleaned = cleaned.trim() + `\n\n📊 **Nguồn dữ liệu:** Được tổng hợp và phân tích bởi **FinGreen AI** (tham chiếu dữ liệu từ ${cleanList}).`
    }
  }

  return cleaned
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

  // 5. Chuẩn hóa khối Nguồn tham khảo sang cấu trúc FinGreen AI
  cleaned = formatFinGreenSources(cleaned)

  // 6. Cắt bỏ TRIỆT ĐỂ bất kỳ đoạn disclaimer cũ/mới nào đã sinh ra để không bao giờ bị lặp 2 lần
  cleaned = cleaned
    .replace(/(?:[\r\n]+---)?[\s\r\n]*(?:>|###)?\s*(?:⚠️|💡)?\s*[\*#_]*(?:Tuyên bố|Miễn trừ trách nhiệm|Disclaimer)[\s\S]*$/gi, '')
    .trim()
    .replace(/(?:[\r\n]+---)+$/g, '')
    .trim()

  // 7. GẮN DUY NHẤT 1 TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM BẮT BUỘC Ở CUỐI TIN NHẮN
  return `${cleaned}\n\n---\n> ${MANDATORY_DISCLAIMER}`
}

// Xây dựng System Prompt thích ứng thông minh theo Ý ĐỊNH người dùng
function buildSystemPrompt(stockContext, marketContext, intent) {
  let taskInstruction = ''

  if (intent.isBCTC) {
    taskInstruction = `
NGƯỜI DÙNG ĐANG YÊU CẦU: Phân tích Báo Cáo Tài Chính (BCTC) [MÃ].
- NGUYÊN TẮC TỐI THƯỢNG: PHẢI CÓ SỐ LIỆU TÀI CHÍNH CỤ THỂ (Bao nhiêu tỷ đồng, bao nhiêu %, tỷ lệ bao nhiêu). TUYỆT ĐỐI KHÔNG nhận định chung chung "tăng trưởng", "ở mức hợp lý", "ở mức thấp" mà không đưa ra con số cụ thể!
- Nếu trong cơ sở dữ liệu bên dưới đã có số liệu BCTC: BẮT BUỘC TRÍCH XUẤT ĐẦY ĐỦ CON SỐ ĐÓ VÀO BÀI.
- TỰ ĐỘNG TRA CỨU WEB / BÁO CHÍ (CafeF, Vietstock, FireAnt...) để lấy đầy đủ các con số doanh thu, lợi nhuận, nợ vay, tổng tài sản mới nhất.
- BẮT BUỘC TRÌNH BÀY ĐẦY ĐỦ CÁC CON SỐ CỤ THỂ THEO CẤU TRÚC:
### 📑 Báo Cáo Tài Chính & Sức Khỏe Doanh Nghiệp [MÃ]
**1. Kết Quả Kinh Doanh Cốt Lõi (Doanh thu & Lợi nhuận)**
- Doanh thu thuần: [Ghi rõ số tỷ đồng cụ thể và tăng trưởng %]
- Lợi nhuận trước thuế & Lợi nhuận sau thuế (LNST): [Ghi rõ số tỷ đồng cụ thể]
- Biên lợi nhuận: [Ghi rõ % biên lãi gộp/biên ròng hoặc NIM nếu là ngân hàng]
**2. Chất Lượng Tài Sản & Đòn Bẩy (Nợ vay D/E, Tổng tài sản hoặc NPL, CASA)**
- Nợ vay / Đòn bẩy tài chính D/E: [Ghi rõ số nợ vay tỷ đồng và hệ số D/E, với ngân hàng ghi rõ NPL %, LLR %, CASA %]
- Tổng tài sản & Vốn chủ sở hữu: [Ghi rõ số tỷ đồng]
**3. Chỉ Số Hiệu Quả Sinh Lời & Định Giá Từ BCTC**
- ROE: [Con số % cụ thể] | ROA: [Con số % cụ thể] | EPS: [Con số VNĐ cụ thể] | P/E: [Số lần] | P/B: [Số lần]
**4. Đánh Giá Khách Quan & Triển Vọng Tài Chính**
- Nhận định sức khỏe tài chính dựa trên các con số đã nêu ở trên và động lực tăng trưởng dài hạn.
Tuyệt đối không nhầm sang bài phân tích kỹ thuật chung.`
  } else if (intent.isValuation) {
    taskInstruction = `
NGƯỜI DÙNG ĐANG YÊU CẦU: ĐỊNH GIÁ CỔ PHIẾU [MÃ].
BẮT BUỘC TRẢ LỜI ĐÚNG TRỌNG TÂM ĐỊNH GIÁ & HIỆU QUẢ SINH LỜI:
### 💎 Báo Cáo Định Giá Cổ Phiếu [MÃ]
**1. Mặt Bằng Chỉ Số Định Giá Cốt Lõi (P/E, P/B, EPS, ROE)**
- P/E hiện tại so với P/E trung bình ngành và trung bình lịch sử 3-5 năm.
- P/B hiện tại so với giá trị sổ sách (Book Value).
- Chỉ số sinh lời ROE, ROA và EPS pha loãng.
**2. Phương Pháp Định Giá Tham Chiếu (P/E tương đối & Chiết khấu dòng tiền DCF)**
- Định giá theo P/E mục tiêu ngành.
- Định giá theo dòng tiền tự do FCFF/FCFE hoặc mô hình chiết khấu cổ tức nếu có.
**3. Đánh Giá Rẻ Hay Đắt & Biên An Toàn**
- Đánh giá khách quan mức định giá hiện tại: Đang ở vùng định giá hấp dẫn, hợp lý hay đã phản ánh hết kỳ vọng.
**4. Góc Nhìn Thuật Toán & Vùng Quan Sát Kỹ Thuật FinGreen**
Tuyệt đối không nhầm sang chỉ trả lời thị giá khớp lệnh!`
  } else if (intent.isNewsOrGeneral) {
    taskInstruction = `
NGƯỜI DÙNG ĐANG HỎI CÂU HỎI THÔNG TIN / TIN TỨC / TẠI SAO / LỊCH SỬ / GIAO DỊCH CỔ PHẦN:
- TỰ ĐỘNG TRA CỨU TIN TỨC THỜI GIAN THỰC & BÁO CHÍ (CafeF, Vietstock, VnEconomy, Tin Nhanh Chứng Khoán, Tuổi Trẻ...).
- Trả lời rõ ràng, chính xác, cập nhật nhất về nguyên nhân, sự kiện hoặc danh tính được hỏi (Ví dụ: tại sao giá vonfram tăng, ai bán cổ phần, ai sáng lập, chiến lược đầu tư...).
- QUY ĐỊNH BẮT BUỘC VỀ TRÌNH BÀY NGUỒN:
  + TUYỆT ĐỐI KHÔNG chèn link markdown, URL hoặc tên nguồn vào giữa các câu hoặc cuối mỗi đoạn văn trong thân bài (ví dụ: không viết [f247.com](...), không viết [vietstock](...)). Thân bài phải hoàn toàn là văn bản phân tích liền mạch, đẹp mắt.
  + CHỈ ĐẶT DUY NHẤT 1 DÒNG NGUỒN Ở CUỐI BÀI theo mẫu:
📊 **Nguồn dữ liệu:** Được tổng hợp và phân tích bởi **FinGreen AI** (tham chiếu dữ liệu từ [Tên nguồn 1], [Tên nguồn 2]...).
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
async function gatherStockAndMarketContext(prompt, apiKey) {
  const isGreeting = /^(chào|xin chào|hello|hi|hey|alo|chào bạn|chào ad|chào bot)\b/i.test(prompt.trim())
  const isIdentity = /bạn là ai|bạn tên gì|tên bạn là gì|who are you|giới thiệu về bạn|bạn làm được gì/i.test(prompt)
  const isValuation = /định giá|dinh gia|pe|pb|dcf|rẻ hay đắt|đắt hay rẻ|fair value/i.test(prompt)
  const isBCTC = !isValuation && /bctc|báo cáo tài chính|kết quả kinh doanh|doanh thu|lợi nhuận|nợ xấu|biên lãi|casa|nim|roe|roa/i.test(prompt)
  // Chỉ coi là hỏi thị giá đơn thuần nếu KHÔNG PHẢI là câu hỏi định giá (vì từ 'định giá' có chứa 'giá')
  const isPrice = !isValuation && /(?:thị giá|giá hiện tại|bao nhiêu|giá cp|giá cổ phiếu)/i.test(prompt)
  const isFactual = /ai là|người sáng lập|ông chủ|lãnh đạo|lịch sử|thành lập|chủ tịch|tổng giám đốc|ceo/i.test(prompt)
  const isNewsOrGeneral = /shark|bình|vụ án|bắt|khởi tố|tin tức|sự kiện|vì sao|tại sao|nguyên nhân|bán cổ phần|mua cổ phần|thoái vốn|sáp nhập|mua lại|m&a|thương vụ|dự án|tin mới|báo chí|cafef|vietstock|vneconomy|thế giới|quốc tế|hàng hóa|vonfram|dầu thô|vàng|fed|lãi suất/i.test(prompt) || (isFactual && !/vps/i.test(prompt))

  const intent = { isGreeting, isIdentity, isValuation, isBCTC, isPrice, isFactual, isNewsOrGeneral, prompt }

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

  // 2. Nếu câu hỏi rõ ràng là tin tức / nhân vật ngoài lề (như Shark Bình, bắt bớ, tin tức...), TUYỆT ĐỐI KHÔNG bóc tách mã cổ phiếu
  const isExcludedFromStockLookup = /shark|bình|vụ án|bắt|khởi tố|tin tức về|bài báo/i.test(prompt)

  // 3. Trích xuất mã cổ phiếu nếu có và không bị loại trừ
  const symbols = isExcludedFromStockLookup ? [] : extractStockSymbols(prompt)
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

// Định nghĩa công cụ Function Calling để AI tự quyết định khi nào cần tra cứu chứng khoán
const STOCK_DATA_TOOL = {
  type: 'function',
  function: {
    name: 'get_stock_market_data',
    description: 'Tra cứu dữ liệu kỹ thuật, thị giá khớp lệnh thời gian thực và BCTC của một MÃ CỔ PHIẾU niêm yết khi người dùng THỰC SỰ hỏi về cổ phiếu đó (ví dụ VCB, HPG, FPT, SSI, MSR). TUYỆT ĐỐI KHÔNG gọi hàm này nếu từ đó chỉ là từ tiếng Việt thông thường (như tin tức, shark bình, tin đồn, bài báo...) hoặc câu hỏi tin tức/sự kiện.',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Mã cổ phiếu chính xác (ví dụ HPG, VCB, MSR, FPT)'
        },
        queryType: {
          type: 'string',
          enum: ['price', 'bctc', 'full_analysis'],
          description: 'Loại dữ liệu cần lấy: price (thị giá), bctc (báo cáo tài chính), full_analysis (phân tích tổng hợp)'
        }
      },
      required: ['symbol']
    }
  }
}

// Hàm chuẩn hóa tin nhắn sang định dạng contents của Gemini API
function formatGeminiContents(messages, prompt) {
  const contents = []
  const recentMessages = (messages || [])
    .filter(m => m.id !== 'welcome')
    .slice(-8)

  for (const m of recentMessages) {
    if (!m.content || !m.content.trim()) continue
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user'
    contents.push({
      role,
      parts: [{ text: m.content }]
    })
  }

  // Đảm bảo tin nhắn cuối cùng là câu hỏi mới nhất của người dùng
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  })

  // Đảm bảo các turn liên tiếp không bị lặp cùng role (quy tắc của Gemini API)
  const consolidated = []
  for (let i = 0; i < contents.length; i++) {
    const cur = contents[i]
    if (consolidated.length > 0 && consolidated[consolidated.length - 1].role === cur.role) {
      consolidated[consolidated.length - 1].parts[0].text += '\n\n' + cur.parts[0].text
    } else {
      consolidated.push({ role: cur.role, parts: [{ text: cur.parts[0].text }] })
    }
  }

  // Gemini yêu cầu contents bắt đầu bằng user
  if (consolidated.length > 0 && consolidated[consolidated.length - 1].role !== 'user') {
    consolidated.push({ role: 'user', parts: [{ text: prompt }] })
  }

  return consolidated
}

// Xử lý gửi tin nhắn phân tích qua Google Generative Language API (Google AI Studio)
export async function sendChatMessage({ messages, prompt, mode }) {
  const apiKey = getGeminiApiKey()
  const { systemPrompt, targetSymbol, intent } = await gatherStockAndMarketContext(prompt)

  const currentMode = mode || getChatMode() || 'fast'
  const modelToUse = currentMode === 'turbo' ? getTurboModel() : getFastModel()
  const fallbackModel = DEFAULT_FAST_MODEL

  const contents = formatGeminiContents(messages, prompt)

  async function queryGemini(modelName) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: currentMode === 'turbo' ? 0.6 : 0.3,
            maxOutputTokens: 2500,
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawContent && rawContent.trim()) {
          const cleaned = cleanAIOutput(rawContent)
          if (cleaned.length > 30) return cleaned
        }
      }
      return null
    } catch (e) {
      clearTimeout(timeoutId)
      return null
    }
  }

  let result = await queryGemini(modelToUse)
  if (!result && modelToUse !== fallbackModel) {
    result = await queryGemini(fallbackModel)
  }

  if (result) return result

  return await generateSmartFallbackResponse(targetSymbol, intent)
}

// Xử lý gửi tin nhắn phân tích thời gian thực dạng Streaming qua Google AI Studio (SSE)
export async function streamChatMessage({ messages, prompt, mode, onChunk, onComplete, onError }) {
  const apiKey = getGeminiApiKey()
  const { systemPrompt, targetSymbol, intent } = await gatherStockAndMarketContext(prompt)

  const currentMode = mode || getChatMode() || 'fast'
  const modelToUse = currentMode === 'turbo' ? getTurboModel() : getFastModel()
  const fallbackModel = DEFAULT_FAST_MODEL

  const contents = formatGeminiContents(messages, prompt)

  async function attemptStream(modelName) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: currentMode === 'turbo' ? 0.6 : 0.3,
            maxOutputTokens: 2500,
          }
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
              const chunkText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
              if (chunkText) {
                accumulated += chunkText
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

  let ok = await attemptStream(modelToUse)
  if (!ok && modelToUse !== fallbackModel) {
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

// Báo cáo thị trường FinGreen fallback (re-export từ dnseService)
export { generateMarketOverviewReport }
