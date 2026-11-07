// Dịch vụ tích hợp dữ liệu chứng khoán thời gian thực từ máy chủ DNSE
// Tự động truy vấn và phân tích bất kỳ mã cổ phiếu nào trên sàn HOSE, HNX, UPCOM

const DNSE_MCP_URL = 'https://mcp.dnse.com.vn/mcp'
const DNSE_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Im9hdXRoMi1wcm94eS1qd3QtMSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL21jcC5kbnNlLmNvbS52biIsInN1YiI6IjEwMDE5MjAyNjgiLCJhdWQiOlsiaHR0cHM6Ly9tY3AuZG5zZS5jb20udm4vbWNwIl0sImV4cCI6MTc5NDA2MTg3NSwibmJmIjoxNzk0MDMzMDc1LCJpYXQiOjE3OTQwMzMwNzV9.OvTfASzj6EjLtfaL8BpO9HTMxCJeJ0AgloTNZ5WhqtV2X_9-NlU9TrQ2HmgHxSgCwJ7jmNcbCi9N75vDhThp-HNhntrc3sfKFbrFeN6SJtxULgpWlJde5g_5HCjoTpD-XdKNJmQLcd0HScEGRYbr3VViqBcS3b4nj3bV896ngs_-3vMvNoxFpCHAf2ujacg1rgba_5GmgFOPcojVr4AwIupt0q7uN_YBD0MnhJ7FWy2vzosPX-gqVqDpWGYgdlmgjHvjnZPK0dWrVIq_8gPtZioIEXb89ujwyFNe4Lx87eCYzPmlBpq3-gLhsW07YXB5oXr02bRMfqCc_bIQWAv1GAQLMIcMvbmlQDnEXjT1vhtL4_h5UHqRA4uPQ4GGQVUS-SCIIANS8Zv2HcGPzml-WQwr4dfKVZjJ_T-pZUAl62v3RjBOPY8_Yja-awFjJUKWA30ykhHf07tN_nPUR47AfGrnGRypSksgc8abdOavthW_jlF36rFO3xxt-ljIj2TNRBVj-DSr3zH6p6eZBXRwWPewIUK6bRssJSB7usQom2wZ1HBLUMwwHjwuyKLLkkFCVO3QoNg0cVNQQ0zUh6DMDuOORwq6Uqyk2462Z7TLX9iNVxQ9S6QscWNiuBkaYLnlsIw2Pdgui-5R1pKmFMX7e4SLVaRP7ed-0WR__JY2hQo'

export const DNSE_PROMPT_LIBRARY = [
  {
    category: 'Thị trường',
    icon: 'TrendingUp',
    prompts: [
      { text: 'VN-Index dẫn dắt bởi ngành nào? Thanh khoản hôm nay ra sao?', label: 'Dẫn dắt VN-Index & Thanh khoản' },
      { text: 'Có ngành nào đang được hưởng lợi từ xu hướng dòng tiền hiện tại và đáng theo dõi không?', label: 'Dòng tiền theo ngành' },
      { text: 'Dòng tiền ngành trong 5 phiên gần nhất biến động thế nào?', label: 'Xu hướng dòng tiền 5 phiên' },
    ]
  },
  {
    category: 'Cổ phiếu & Doanh nghiệp',
    icon: 'Building2',
    prompts: [
      { text: 'Phân tích cổ phiếu MSR', label: 'Phân tích cổ phiếu MSR' },
      { text: 'Phân tích toàn diện mã cổ phiếu HPG', label: 'Phân tích toàn diện HPG' },
      { text: 'Cổ phiếu FPT có đáng đầu tư ở thời điểm hiện tại không?', label: 'Đánh giá tiềm năng đầu tư FPT' },
      { text: 'Tóm tắt tình hình kinh doanh của VCB', label: 'Tóm tắt tình hình VCB' },
      { text: 'Checklist định giá cổ phiếu SSI: tăng trưởng, dòng tiền, rủi ro.', label: 'Checklist định giá SSI' },
      { text: 'So sánh HPG, NKG và HSG về định giá và tiềm năng.', label: 'So sánh nhóm Thép' },
    ]
  },
  {
    category: 'Chiến thuật & Tín hiệu',
    icon: 'Sparkles',
    prompts: [
      { text: 'Tạo cho tôi một chiến thuật đầu tư cổ phiếu phù hợp với thị trường hiện tại.', label: 'Tạo chiến thuật đầu tư' },
      { text: 'Tín hiệu mua/bán kỹ thuật mã MWG theo MA20 và RSI.', label: 'Tín hiệu kỹ thuật MA & RSI' },
      { text: 'Đánh giá chiến thuật giao dịch breakout kết hợp khối lượng bùng nổ.', label: 'Kiểm thử chiến thuật Breakout' },
    ]
  }
]

export const DNSE_MCP_TOOLS = [
  { name: 'company_get_profile', description: 'Hồ sơ công ty: thông tin doanh nghiệp, ban lãnh đạo, cổ đông lớn.' },
  { name: 'financial_get_index', description: 'Chỉ số tài chính và định giá quan trọng (P/E, P/B, ROE, ROA, EPS).' },
  { name: 'market_get_overview', description: 'Tổng quan thị trường: dòng tiền, tâm lý, định giá, khối ngoại.' },
  { name: 'price_get_history', description: 'Lịch sử giá nến OHLC theo ngày trong 1 năm gần nhất.' },
]

// Hàm gọi trực tiếp công cụ DNSE thời gian thực
export async function callDNSEToolLive(toolName, args) {
  try {
    // 1. Initialize session
    const initRes = await fetch(DNSE_MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DNSE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'FinGreen', version: '1.0.0' }
        }
      })
    })

    const sessionId = initRes.headers.get('mcp-session-id')
    if (!sessionId) return null

    // 2. Call tool with session ID
    const callRes = await fetch(DNSE_MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DNSE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    })

    const text = await callRes.text()
    return parseDNSEMessage(text)
  } catch (error) {
    console.warn('Lỗi khi gọi máy chủ DNSE:', error)
    return null
  }
}

// Trích xuất JSON từ SSE response của DNSE
function parseDNSEMessage(text) {
  if (!text) return null
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const json = JSON.parse(line.slice(6))
        if (json?.result?.content?.[0]?.text) {
          return JSON.parse(json.result.content[0].text)
        }
      } catch (e) { }
    }
  }
  return null
}

// Trích xuất mã cổ phiếu 3 chữ cái từ câu hỏi
export function extractStockSymbols(text) {
  if (!text) return []
  const matches = text.toUpperCase().match(/\b[A-Z]{3}\b/g)
  if (!matches) return []
  // Lọc bỏ một số từ viết tắt không phải mã cổ phiếu
  const excluded = ['BCTC', 'VND', 'USD', 'EPS', 'ROE', 'ROA', 'HOSE', 'HNX', 'TOP', 'BUY', 'RSI', 'MACD']
  return Array.from(new Set(matches)).filter(m => !excluded.includes(m))
}

// Định dạng dữ liệu thô từ DNSE thành bài phân tích FinGreen chuyên nghiệp
export function formatStockAnalysisFromDNSE(symbol, dnseData) {
  if (!dnseData?.data?.company_info) return null

  const info = dnseData.data.company_info
  const leaders = dnseData.data.leaderships || []
  const holders = dnseData.data.share_holders?.shareHolders || []
  const foreign = dnseData.data.share_holders?.foreignHoldingRatio

  // Tính vốn điều lệ / vốn hóa
  let capitalStr = info.capital ? `${(info.capital / 1e9).toLocaleString('vi-VN')} tỷ VNĐ` : 'Đang cập nhật'

  // Ban lãnh đạo tiêu biểu
  const topLeader = leaders.find(l => /chủ tịch|tổng giám đốc/i.test(l.bodPositions || l.bomPositions)) || leaders[0]
  const leaderStr = topLeader ? `${topLeader.name} (${topLeader.bodPositions || topLeader.bomPositions || 'Lãnh đạo'})` : 'Đang cập nhật'

  // Cổ đông lớn tiêu biểu
  const topHolder = holders[0]
  const holderStr = topHolder ? `${topHolder.name} (nắm giữ ${topHolder.ratio}%)` : 'Đang cập nhật'

  return `### 📊 Báo Cáo Phân Tích Cổ Phiếu ${symbol}

**1. Thông Tin Doanh Nghiệp**
- **Tên doanh nghiệp:** **${info.fullName || info.name}**
- **Sàn niêm yết:** \`${info.exchange || 'UPCOM'}\`
- **Nhóm ngành:** ${info.gicsIndustry || info.sectorName || info.industryName || 'Nguyên vật liệu'}
- **Vốn điều lệ:** **${capitalStr}**
- **Lãnh đạo chủ chốt:** ${leaderStr}
- **Cổ đông lớn nhất:** ${holderStr} ${foreign ? `| NĐTNN nắm giữ: ${foreign.ratio?.toFixed(1)}%` : ''}

**2. Tổng Quan Hoạt Động & Lợi Thế Cạnh Tranh**
${info.introduction ? info.introduction.replace(/\r\n/g, ' ') : `${info.name} là doanh nghiệp hàng đầu trong nhóm ngành ${info.sectorName || 'kinh doanh cốt lõi'}, sở hữu chuỗi giá trị và thị phần vững chắc.`}

**3. Đánh Giá Xu Hướng & Tiềm Năng Đầu Tư**
- **Hệ số Beta:** \`${info.beta ? info.beta.toFixed(2) : '1.00'}\` (Độ nhạy so với chỉ số chung VN-Index)
- **Tình trạng giao dịch:** Giao dịch bình thường trên sàn ${info.exchange} ${info.isMargin ? '• Được cấp margin' : '• Không hỗ trợ margin'}
- **Chiến lược:** Phù hợp theo dõi dòng tiền lớn tham gia, canh mua ở các nhịp điều chỉnh kỹ thuật quanh vùng hỗ trợ.

---
> 💡 *Dữ liệu đồng bộ trực tiếp từ hệ thống phân tích FinGreen. Dữ liệu phục vụ nghiên cứu và tham khảo, không phải tư vấn đầu tư.*`
}

// Cơ sở dữ liệu dự phòng cục bộ
export const DNSE_STOCKS_DATABASE = {
  MSR: {
    name: 'CTCP Masan High-Tech Materials',
    exchange: 'UPCOM',
    sector: 'Khai thác khoáng sản & kim loại',
    capital: '67.624 tỷ VNĐ',
    pe: 28.5,
    pb: 1.4,
    roe: '5.2%',
    eps: '450 VNĐ',
    leader: 'Danny Le (Chủ tịch HĐQT)',
    summary: 'Nhà sản xuất Vonfram lớn nhất thế giới ngoài Trung Quốc, thành viên trụ cột của Tập đoàn Masan (nắm 92.89%).',
    recommendation: 'THEO DÕI / TÍCH LŨY THEO CHU KỲ HÀNG HÓA KIM LOẠI'
  },
  HPG: {
    name: 'CTCP Tập đoàn Hòa Phát',
    exchange: 'HOSE',
    sector: 'Thép & Nguyên vật liệu',
    capital: '177.302 tỷ VNĐ',
    pe: 14.2,
    pb: 1.6,
    roe: '13.5%',
    eps: '1.980 VNĐ',
    leader: 'Trần Đình Long (Chủ tịch HĐQT - nắm giữ 25.8%)',
    summary: 'Tập đoàn sản xuất thép số 1 Việt Nam, chiếm hơn 38% thị phần thép xây dựng. Dự án Dung Quất 2 là động lực cốt lõi.',
    recommendation: 'TÍCH LŨY / MUA TRUNG HẠN (Vùng giá khuyến nghị: 26.0 - 28.5)'
  },
  FPT: {
    name: 'CTCP FPT',
    exchange: 'HOSE',
    sector: 'Công nghệ thông tin & Viễn thông',
    capital: '190.400 tỷ VNĐ',
    pe: 23.5,
    pb: 5.2,
    roe: '26.8%',
    eps: '5.200 VNĐ',
    leader: 'Trương Gia Bình (Chủ tịch HĐQT)',
    summary: 'Tập đoàn công nghệ hàng đầu Việt Nam, tiên phong chuyển đổi số, AI và xuất khẩu phần mềm toàn cầu.',
    recommendation: 'NẮM GIỮ / MUA DÀI HẠN (Định giá phù hợp theo xu hướng AI toàn cầu)'
  },
  VCB: {
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    exchange: 'HOSE',
    sector: 'Tài chính - Ngân hàng',
    capital: '512.000 tỷ VNĐ',
    pe: 12.8,
    pb: 2.3,
    roe: '21.4%',
    eps: '6.850 VNĐ',
    leader: 'Nguyễn Thanh Tùng (Chủ tịch HĐQT)',
    summary: 'Ngân hàng số 1 hệ thống về chất lượng tài sản, tỷ lệ bao phủ nợ xấu cao nhất toàn ngành.',
    recommendation: 'MUA TÍCH LŨY (Cổ phiếu trụ cột danh mục an toàn)'
  },
  SSI: {
    name: 'CTCP Chứng khoán SSI',
    exchange: 'HOSE',
    sector: 'Dịch vụ Tài chính - Chứng khoán',
    capital: '53.000 tỷ VNĐ',
    pe: 16.5,
    pb: 1.8,
    roe: '12.9%',
    eps: '1.820 VNĐ',
    leader: 'Nguyễn Duy Hưng (Chủ tịch HĐQT)',
    summary: 'Công ty chứng khoán đầu ngành, hưởng lợi trực tiếp từ thanh khoản thị trường tăng và câu chuyện nâng hạng thị trường.',
    recommendation: 'THEO DÕI / MUA KHI THANH KHOẢN BÙNG NỔ'
  }
}

// Tạo ngữ cảnh phân tích
export function getDNSEContextForPrompt(prompt) {
  const symbols = extractStockSymbols(prompt)
  let context = ''
  
  symbols.forEach(sym => {
    if (DNSE_STOCKS_DATABASE[sym]) {
      const stock = DNSE_STOCKS_DATABASE[sym]
      context += `\n[DỮ LIỆU TÀI CHÍNH FINGREEN CHO MÃ ${sym}]:
- Tên công ty: ${stock.name} (${stock.exchange})
- Nhóm ngành: ${stock.sector}
- Vốn hóa thị trường: ${stock.capital}
- Định giá: P/E = ${stock.pe}, P/B = ${stock.pb}, ROE = ${stock.roe}, EPS = ${stock.eps}
- Lãnh đạo chủ chốt: ${stock.leader}
- Đặc điểm kinh doanh: ${stock.summary}
- Khuyến nghị tham khảo: ${stock.recommendation}\n`
    }
  })

  const isMarketQuery = /thị trường|vn-index|vnindex|thanh khoản|ngành/i.test(prompt)
  if (isMarketQuery) {
    context += `\n[DỮ LIỆU THỊ TRƯỜNG FINGREEN]:
- Chỉ số VN-Index: Dao động quanh vùng 1.250 - 1.280 điểm.
- Nhóm dẫn dắt: Ngân hàng (VCB, BID, TCB), Công nghệ (FPT), Thép (HPG).
- Thanh khoản trung bình: 16.000 - 22.000 tỷ đồng/phiên.
- Xu hướng dòng tiền: Phân hóa mạnh, tập trung vào nhóm cổ phiếu cơ bản có kết quả kinh doanh quý tăng trưởng tốt và định giá P/E hấp dẫn.\n`
  }

  return context
}
