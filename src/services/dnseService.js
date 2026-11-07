// Dịch vụ tích hợp dữ liệu chứng khoán DNSE MCP Studio
// Dựa trên tài liệu hướng dẫn chính thức DNSE MCP Studio

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
      { text: 'Phân tích toàn diện mã cổ phiếu HPG', label: 'Phân tích toàn diện {{Mã}}' },
      { text: 'Cổ phiếu FPT có đáng đầu tư ở thời điểm hiện tại không?', label: 'Đánh giá tiềm năng đầu tư' },
      { text: 'Tóm tắt BCTC quý gần nhất của VCB: tăng trưởng, biên lợi nhuận và điểm bất thường.', label: 'Tóm tắt BCTC quý gần nhất' },
      { text: 'Checklist mua cổ phiếu SSI: định giá (P/E, P/B), tăng trưởng, dòng tiền, rủi ro.', label: 'Checklist định giá & rủi ro' },
      { text: 'So sánh HPG, NKG và HSG về định giá, biên lợi nhuận và nợ vay.', label: 'So sánh cổ phiếu cùng ngành' },
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

// Danh sách các công cụ DNSE MCP hỗ trợ
export const DNSE_MCP_TOOLS = [
  { name: 'company_get_profile', description: 'Hồ sơ công ty: thông tin doanh nghiệp, ban lãnh đạo, cổ đông lớn.' },
  { name: 'company_get_profile_with_news', description: 'Hồ sơ công ty kèm tin tức thị trường gần nhất.' },
  { name: 'company_get_company_events', description: 'Lịch sử sự kiện, chia cổ tức, đại hội cổ đông.' },
  { name: 'financial_get_index', description: 'Chỉ số tài chính và định giá quan trọng (P/E, P/B, ROE, ROA, EPS).' },
  { name: 'financial_get_report_summary', description: 'Tổng quan và chi tiết báo cáo tài chính qua các quý.' },
  { name: 'market_get_overview', description: 'Tổng quan thị trường: dòng tiền, tâm lý, định giá, khối ngoại.' },
  { name: 'market_get_stock_influences', description: 'Top cổ phiếu dẫn dắt hoặc kéo lùi chỉ số VN-Index, VN30.' },
  { name: 'price_get_history', description: 'Lịch sử giá nến OHLC theo ngày trong 1 năm gần nhất.' },
  { name: 'sector_get_overview', description: 'Tổng quan các ngành, xu hướng dòng tiền và biến động chỉ số ngành.' },
  { name: 'strategy_list_conditions', description: 'Danh mục điều kiện mua/bán và kiểm thử chiến thuật (Backtest).' }
]

// Dữ liệu mẫu thị trường VN30 từ DNSE để tối ưu phản hồi nhanh
export const DNSE_STOCKS_DATABASE = {
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
    summary: 'Tập đoàn sản xuất thép số 1 Việt Nam, chiếm hơn 38% thị phần thép xây dựng. Dự án Dung Quất 2 là động lực tăng trưởng cốt lõi giai đoạn 2025-2027.',
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
    summary: 'Tập đoàn công nghệ hàng đầu Việt Nam, tiên phong chuyển đổi số, AI và xuất khẩu phần mềm toàn cầu (doanh số phần mềm nước ngoài vượt 1 tỷ USD).',
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
    summary: 'Ngân hàng số 1 hệ thống về chất lượng tài sản, tỷ lệ bao phủ nợ xấu cao nhất toàn ngành và chi phí vốn CASA vượt trội.',
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
    summary: 'Công ty chứng khoán đầu ngành, hưởng lợi trực tiếp từ thanh khoản thị trường tăng và câu chuyện nâng hạng thị trường chứng khoán Việt Nam FTSE/MSCI.',
    recommendation: 'THEO DÕI / MUA KHI THANH KHOẢN BÙNG NỔ'
  },
  VNM: {
    name: 'CTCP Sữa Việt Nam (Vinamilk)',
    exchange: 'HOSE',
    sector: 'Hàng tiêu dùng thực phẩm',
    capital: '138.000 tỷ VNĐ',
    pe: 15.1,
    pb: 3.9,
    roe: '28.1%',
    eps: '4.450 VNĐ',
    leader: 'Mai Kiều Liên (Tổng Giám đốc)',
    summary: 'Thương hiệu sữa quốc gia, dòng tiền dồi dào, tỷ lệ chi trả cổ tức tiền mặt đều đặn 35-40%/năm, phù hợp nhà đầu tư phòng thủ.',
    recommendation: 'NẮM GIỮ HƯỞNG CỔ TỨC TIỀN MẶT'
  },
  MWG: {
    name: 'CTCP Đầu tư Thế Giới Di Động',
    exchange: 'HOSE',
    sector: 'Bán lẻ',
    capital: '89.000 tỷ VNĐ',
    pe: 18.2,
    pb: 2.7,
    roe: '16.2%',
    eps: '3.400 VNĐ',
    leader: 'Nguyễn Đức Tài (Chủ tịch HĐQT)',
    summary: 'Chuỗi bán lẻ điện thoại điện máy lớn nhất cả nước, chuỗi Bách Hóa Xanh đã qua điểm hòa vốn và bắt đầu đóng góp lợi nhuận đáng kể.',
    recommendation: 'MUA KHI ĐIỀU CHỈNH KỸ THUẬT'
  }
}

// Hàm trích xuất mã cổ phiếu từ câu hỏi người dùng
export function extractStockSymbols(text) {
  if (!text) return []
  const matches = text.toUpperCase().match(/\b[A-Z]{3}\b/g)
  if (!matches) return []
  // Lọc trùng lặp
  return Array.from(new Set(matches))
}

// Tạo context bổ sung từ dữ liệu DNSE cho câu hỏi
export function getDNSEContextForPrompt(prompt) {
  const symbols = extractStockSymbols(prompt)
  let context = ''
  
  symbols.forEach(sym => {
    if (DNSE_STOCKS_DATABASE[sym]) {
      const stock = DNSE_STOCKS_DATABASE[sym]
      context += `\n[DỮ LIỆU DNSE MCP CHO MÃ ${sym}]:
- Tên công ty: ${stock.name} (${stock.exchange})
- Nhóm ngành: ${stock.sector}
- Vốn hóa thị trường: ${stock.capital}
- Định giá: P/E = ${stock.pe}, P/B = ${stock.pb}, ROE = ${stock.roe}, EPS = ${stock.eps}
- Lãnh đạo chủ chốt: ${stock.leader}
- Đặc điểm kinh doanh: ${stock.summary}
- Khuyến nghị tham khảo: ${stock.recommendation}\n`
    }
  })

  // Thêm thông tin tổng quan thị trường nếu hỏi về VN-Index / thị trường
  const isMarketQuery = /thị trường|vn-index|vnindex|thanh khoản|ngành/i.test(prompt)
  if (isMarketQuery) {
    context += `\n[DỮ LIỆU THỊ TRƯỜNG DNSE MCP]:
- Chỉ số VN-Index: Dao động quanh vùng 1.250 - 1.280 điểm.
- Nhóm dẫn dắt: Ngân hàng (VCB, BID, TCB), Công nghệ (FPT), Thép (HPG).
- Thanh khoản trung bình: 16.000 - 22.000 tỷ đồng/phiên.
- Xu hướng dòng tiền: Phân hóa mạnh, tập trung vào nhóm cổ phiếu cơ bản có kết quả kinh doanh quý tăng trưởng tốt và định giá P/E hấp dẫn.\n`
  }

  return context
}
