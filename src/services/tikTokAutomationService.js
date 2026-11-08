// FinGreen TikTok Financial Storytelling & Kinetic Typography Service
// Hệ thống tự động hóa video tài chính TikTok chuẩn 13 Slide chuyên nghiệp
// Phong cách: Infographics, Biểu đồ nến thực tế, Radar, Phễu dòng tiền, Checklist, Chữ động Kinetic

import { getGeminiApiKey } from './aiService.js'

// Cấu hình âm thanh & giọng đọc Tiếng Việt Neural Studio chuẩn VTV / TikTok
export function getVietnameseAudioUrl(text, voice = 'nam') {
  if (!text) return ''
  const clean = text.replace(/[\n\r]+/g, ' ').slice(0, 300).trim()
  return `/api/tts?text=${encodeURIComponent(clean)}&voice=${voice}`
}

// 13 Cảnh phim (Storyboard Slides) chuẩn y hệt video mẫu TikTok của @tdhtruytimsieuco
export const VSC_13_SLIDES_STORYBOARD = [
  {
    slideNumber: 1,
    duration: 3.5,
    type: 'typography_hook',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Có một cổ phiếu từng khiến rất nhiều người tiếc nuối vì không mua. Nhưng giờ đây, lại chẳng mấy ai muốn nhắc đến.',
    titleTop: 'Có một cổ phiếu...',
    titleMain: 'TỪNG KHIẾN RẤT NHIỀU NGƯỜI',
    highlightText: 'TIẾC NUỐI',
    highlightColor: '#F59E0B',
    subText: '...nhưng giờ chẳng mấy ai muốn nhắc đến.',
    pillBadge: 'ĐÂY MỚI LÀ LÚC CHÚ Ý',
    pillColor: '#EF4444'
  },
  {
    slideNumber: 2,
    duration: 3.2,
    type: 'ship_vector',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Và chính là lúc mình bắt đầu chú ý đến nó: Con tàu VSC đã quay về đúng điểm xuất phát, và phiên vừa rồi nó vừa kéo còi.',
    titleMain: 'CON TÀU VSC',
    titleSub: 'ĐÃ QUAY VỀ ĐIỂM XUẤT PHÁT',
    pillBadge: 'VỪA KÉO CÒI',
    pillColor: '#EF4444',
    noteText: 'phiên vừa rồi'
  },
  {
    slideNumber: 3,
    duration: 3.2,
    type: 'chart_rally',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Cả năm 2025, VSC chạy một con sóng khiến ai cũng ngoái lại nhìn.',
    yearTag: 'Cả năm 2025',
    titleMain: 'MỘT CON SÓNG KHIẾN AI CŨNG NGOÁI LẠI',
    startPrice: '~10,9',
    endPrice: '~38,6',
    gainBadge: '+250%'
  },
  {
    slideNumber: 4,
    duration: 3.5,
    type: 'chart_crash',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Rồi nó rơi. Rơi từ từ, rơi lặng lẽ, cho tới khi trả lại toàn bộ thành quả của cả con sóng đó.',
    titleMain: 'RỒI NÓ RƠI.',
    titleSub: 'Rơi từ từ. Rơi lặng lẽ.',
    lossBadge: '-68%',
    lossText: 'Trả lại toàn bộ thành quả con sóng'
  },
  {
    slideNumber: 5,
    duration: 3.5,
    type: 'chart_base',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Hôm nay, VSC đang đứng đúng ở vùng nền 5 năm. Từ 2021 tới giờ, vùng giá này đã nhiều lần giữ chân nó lại.',
    introText: 'Hôm nay, VSC đứng đúng ở',
    titleMain: 'VÙNG NỀN 5 NĂM',
    titleColor: '#E879F9',
    zoneText: 'VÙNG NỀN 12 – 14',
    timeframeText: '2021 ➔ 2026 vẫn là vùng giá này',
    dotAnnotation: 'Nhiều lần giữ chân giá lại'
  },
  {
    slideNumber: 6,
    duration: 3.2,
    type: 'cycle_wave',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Không phải đỉnh, không phải đang rơi, mà là đáy của cả một chu kỳ dài.',
    strike1: 'KHÔNG PHẢI ĐỈNH',
    strike2: 'KHÔNG ĐANG RƠI',
    bottomLabel: 'ĐÁY',
    bottomSub: 'CỦA CẢ MỘT CHU KỲ DÀI'
  },
  {
    slideNumber: 7,
    duration: 3.8,
    type: 'candlestick_breakout',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Và đúng lúc ai cũng đã chán nó thì nó lại tăng trần bỏ rơi, không lưỡng lự. Mở cửa là bỏ lại khoảng trống, kéo thẳng lên trần khi phiên còn chưa kịp nóng.',
    topText: 'Đúng lúc ai cũng chán nó...',
    titleMain: 'TĂNG TRẦN BỎ RƠI',
    titleColor: '#D946EF',
    ceilingBadge: 'GIÁ TRẦN',
    gapBadge: 'GAP',
    descText: 'Mở cửa là bỏ lại khoảng trống, kéo thẳng lên trần khi phiên còn chưa kịp nóng.'
  },
  {
    slideNumber: 8,
    duration: 3.0,
    type: 'golden_coin',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Đây không phải dạng tăng của hàng ăn theo. Đây là tín hiệu của một mã đang được dòng tiền chọn mặt gửi vàng.',
    strike1: 'KHÔNG PHẢI HÀNG ĂN THEO',
    coinText: 'VSC',
    titleMain: 'DÒNG TIỀN ĐANG CHỌN MẶT GỬI VÀNG'
  },
  {
    slideNumber: 9,
    duration: 2.8,
    type: 'why_question',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Vì sao lại là VSC? Và vì sao lại là lúc này?',
    line1: 'VÌ SAO LÀ VSC?',
    line2: 'VÌ SAO LÀ LÚC NÀY?'
  },
  {
    slideNumber: 10,
    duration: 3.2,
    type: 'money_funnel',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Thị trường giai đoạn này tiền không nhiều. Khi tiền ít, dòng tiền không dàn trải mà thường chọn lọc vào những mã đặc biệt.',
    titleMain: 'TIỀN ÍT',
    subtitle: '➔ không dàn trải, chỉ chọn vài mã',
    funnelLabel: 'DÒNG TIỀN CHỌN LỌC'
  },
  {
    slideNumber: 11,
    duration: 3.8,
    type: 'checklist_card',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Có ba đặc điểm dòng tiền đang tìm: Thứ nhất, có tính đầu cơ, có câu chuyện. Thứ hai, thanh khoản vừa phải, dễ kéo. Thứ ba, giá đã về vùng an toàn.',
    titleMain: '3 ĐIỀU DÒNG TIỀN ĐANG TÌM',
    items: [
      { num: 'Tiêu chí 1', bold: 'Tính đầu cơ', detail: 'Có câu chuyện để kể' },
      { num: 'Tiêu chí 2', bold: 'Thanh khoản vừa', detail: 'Dễ kéo, dễ dẫn dắt' },
      { num: 'Tiêu chí 3', bold: 'Giá vùng an toàn', detail: 'Ít hàng kẹp phía trên' }
    ],
    pillBadge: 'VSC ĐẠT CẢ 3'
  },
  {
    slideNumber: 12,
    duration: 3.5,
    type: 'radar_scan',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Thậm chí ngay trong rổ hàng nhà anh Mượt, VSC đang là mã vận động khỏe nhất. Khi một mã dẫn đầu ngay trong gia đình của nó, đó là điều đáng để đặt lên radar.',
    introText: 'Ngay trong rổ hàng nhà anh Mượt',
    titleMain: 'MÃ KHỎE NHẤT TRONG NHÀ',
    radarTarget: 'VSC',
    pillBadge: 'ĐẶT LÊN RA-DA'
  },
  {
    slideNumber: 13,
    duration: 4.2,
    type: 'poll_cta',
    badge: 'CÂU CHUYỆN CỔ PHIẾU',
    voiceText: 'Câu hỏi bây giờ là... bạn đang đứng ngoài nhìn hay đã có kế hoạch cho nó? Bình luận cho mình biết nhé: Bạn đang cầm, đang canh mua, hay đứng ngoài?',
    introText: 'Câu hỏi bây giờ là...',
    titleMain: 'ĐỨNG NGOÀI NHÌN HAY CÓ KẾ HOẠCH?',
    pollButtons: [
      { text: 'ĐANG CẦM', color: '#10B981', textColor: '#FFFFFF' },
      { text: 'ĐANG CANH MUA', color: '#F59E0B', textColor: '#000000' },
      { text: 'ĐỨNG NGOÀI', color: '#1E293B', textColor: '#CBD5E1', border: '#475569' }
    ],
    ctaText: 'Comment cho mình biết nhé'
  }
]

// 1. KỊCH BẢN THÉP HÒA PHÁT (HPG) - VUA THÉP & LÒ CAO DUNG QUẤT
export const HPG_13_SLIDES_STORYBOARD = [
  {
    slideNumber: 1,
    duration: 3.5,
    type: 'typography_hook',
    badge: 'TIÊU ĐIỂM CỔ PHIẾU TRỤ',
    voiceText: 'Vì sao khối ngoại xả ròng nghìn tỷ nhưng vua thép Hòa Phát vẫn lừng lững gom hàng? Đây mới là lúc cuộc chơi thực sự bắt đầu.',
    titleTop: 'Vua Thép Hòa Phát...',
    titleMain: 'TÂY XẢ RÒNG NGHÌN TỶ',
    highlightText: 'VẪN LỪNG LỮNG GOM',
    highlightColor: '#F59E0B',
    subText: '...khi lò cao Dung Quất 2 chuẩn bị đỏ lửa.',
    pillBadge: 'ĐÂY MỚI LÀ LÚC CHÚ Ý',
    pillColor: '#EF4444'
  },
  {
    slideNumber: 2,
    duration: 3.2,
    type: 'blast_furnace',
    badge: 'CÂU CHUYỆN DOANH NGHIỆP',
    voiceText: 'Đại dự án Dung Quất 2 với tổng mức đầu tư 85 nghìn tỷ chuẩn bị chạy thử lò cao đầu tiên, mở ra kỷ nguyên mới cho Hòa Phát.',
    titleMain: 'CỖ MÁY DUNG QUẤT 2',
    titleSub: 'LÒ CAO 85.000 TỶ CHUẨN BỊ ĐỎ LỬA',
    pillBadge: 'CÔNG SUẤT +5.6 TRIỆU TẤN',
    pillColor: '#EF4444',
    noteText: 'dự kiến Q1/2027'
  },
  {
    slideNumber: 3,
    duration: 3.2,
    type: 'chart_rally',
    badge: 'LỊCH SỬ GIÁ',
    voiceText: 'Hòa Phát từng có những chu kỳ tăng trưởng thần tốc, mang lại mức sinh lời gấp 3 lần cho những ai kiên nhẫn nắm giữ.',
    yearTag: 'Chu kỳ tăng trưởng trước',
    titleMain: 'MỘT CON SÓNG TĂNG TRƯỞNG KỶ LỤC',
    startPrice: '~13.5',
    endPrice: '~35.0',
    gainBadge: '+160%'
  },
  {
    slideNumber: 4,
    duration: 3.2,
    type: 'chart_crash',
    badge: 'CHU KỲ THANH LỌC',
    voiceText: 'Rồi nó trải qua giai đoạn tích lũy trầm lắng, rũ bỏ hoàn toàn lượng nhà đầu tư lướt sóng ngắn hạn.',
    titleMain: 'RŨ BỎ ĐU BÁM.',
    titleSub: 'Tích lũy chặt chẽ. Loại bỏ tâm lý fomo.',
    lossBadge: '-30%',
    lossText: 'Về vùng định giá siêu hấp dẫn'
  },
  {
    slideNumber: 5,
    duration: 3.5,
    type: 'chart_base',
    badge: 'VÙNG HỖ TRỢ CỨNG',
    voiceText: 'Hiện tại, HPG đang tạo đáy dài hạn quanh vùng giá 26 đến 28. Đây là vùng giá mà dòng tiền tổ chức liên tục mua gom.',
    introText: 'Vùng đệm phòng thủ vững chắc',
    titleMain: 'VÙNG NỀN TÍCH LŨY 26 - 28',
    titleColor: '#F59E0B',
    zoneText: 'VÙNG GOM TỔ CHỨC 26 - 28',
    timeframeText: 'Đáy chu kỳ biên lợi nhuận HRC',
    dotAnnotation: 'Bệ đỡ thép cứng cáp'
  },
  {
    slideNumber: 6,
    duration: 3.2,
    type: 'cycle_wave',
    badge: 'TRIẾT LÝ CHU KỲ',
    voiceText: 'Không phải đỉnh, không phải phân phối, mà là chân sóng của một chu kỳ xây dựng hạ tầng quy mô lớn.',
    strike1: 'KHÔNG PHẢI PHÂN PHỐI',
    strike2: 'KHÔNG PHẢI ĐỈNH',
    bottomLabel: 'CHÂN SÓNG',
    bottomSub: 'CHU KỲ HẠ TẦNG VĨ MÔ'
  },
  {
    slideNumber: 7,
    duration: 3.5,
    type: 'candlestick_breakout',
    badge: 'TÍN HIỆU DÒNG TIỀN',
    voiceText: 'Chỉ cần một phiên kích hoạt thanh khoản vượt 50 triệu cổ, nhịp tăng bứt phá của HPG sẽ kéo cả chỉ số VN-Index đi lên.',
    topText: 'Khi thanh khoản bùng nổ...',
    titleMain: 'BỨT PHÁ DẪN SÓNG VN30',
    titleColor: '#10B981',
    ceilingBadge: 'VOL ĐỘT BIẾN',
    gapBadge: 'LEAD',
    descText: 'Cổ phiếu quốc dân sẵn sàng quay trở lại vị thế dẫn dắt toàn thị trường.'
  },
  {
    slideNumber: 8,
    duration: 3.0,
    type: 'golden_coin',
    badge: 'LỢI THẾ CẠNH TRANH',
    voiceText: 'Chi phí sản xuất thép thấp nhất Đông Nam Á, Hòa Phát chính là thành trì vững chắc của ngành công nghiệp nặng.',
    strike1: 'KHÔNG THỂ THAY THẾ',
    coinText: 'HPG',
    titleMain: 'VUA THÉP ĐẦU NGÀNH VIỆT NAM'
  },
  {
    slideNumber: 9,
    duration: 2.8,
    type: 'why_question',
    badge: 'CÂU HỎI LỚN',
    voiceText: 'Vì sao là HPG? Và vì sao là giai đoạn bản lề này?',
    line1: 'VÌ SAO LÀ HÒA PHÁT?',
    line2: 'VÌ SAO LÀ LÚC NÀY?'
  },
  {
    slideNumber: 10,
    duration: 3.2,
    type: 'money_funnel',
    badge: 'PHỄU DÒNG TIỀN',
    voiceText: 'Thị trường phân hóa mạnh, tiền lớn chỉ ưu tiên những doanh nghiệp có nội lực tài chính khủng và câu chuyện tăng trưởng rõ ràng.',
    titleMain: 'TIỀN LỚN CHỌN LỌC',
    subtitle: '➔ Chỉ chọn doanh nghiệp dẫn đầu',
    funnelLabel: 'DÒNG TIỀN GIÁ TRỊ'
  },
  {
    slideNumber: 11,
    duration: 3.5,
    type: 'checklist_card',
    badge: 'TIÊU CHÍ VÀNG',
    voiceText: '3 lý do dòng tiền chọn HPG: Dung Quất 2 sắp chạy, thị phần thép dẫn đầu 38%, và định giá P/B ở vùng đáy lịch sử.',
    titleMain: '3 ĐỘNG LỰC TĂNG TRƯỞNG HPG',
    items: [
      { num: 'Động lực 1', bold: 'Dung Quất 2', detail: 'Tăng gấp đôi công suất HRC' },
      { num: 'Động lực 2', bold: 'Thị phần 38%', detail: 'Thâu tóm thị trường xây dựng' },
      { num: 'Động lực 3', bold: 'Định giá P/B rẻ', detail: 'Biên an toàn cực lớn' }
    ],
    pillBadge: 'HPG ĐẠT CẢ 3'
  },
  {
    slideNumber: 12,
    duration: 3.5,
    type: 'radar_scan',
    badge: 'RADAR CHIẾN LƯỢC',
    voiceText: 'Trong nhóm VN30, HPG đang là cổ phiếu thu hút sự chú ý lớn nhất của các quỹ đầu tư dài hạn.',
    introText: 'Tâm điểm rổ chỉ số VN30',
    titleMain: 'TRỤ CỘT DẪN DẮT THỊ TRƯỜNG',
    radarTarget: 'HPG',
    pillBadge: 'ĐẶT LÊN RA-DA'
  },
  {
    slideNumber: 13,
    duration: 4.0,
    type: 'poll_cta',
    badge: 'KHẢO SÁT CỘNG ĐỒNG',
    voiceText: 'Theo bạn, liệu HPG có bứt phá mốc 35 trong năm tới? Bạn đang nắm giữ, canh gom hay đứng ngoài? Hãy comment bên dưới nhé!',
    introText: 'Kế hoạch của bạn là gì?',
    titleMain: 'HPG VƯỢT 35 TRONG TẦM TAY?',
    pollButtons: [
      { text: 'ĐANG NẮM GIỮ', color: '#10B981', textColor: '#FFFFFF' },
      { text: 'CANH GOM VÙNG NỀN', color: '#F59E0B', textColor: '#000000' },
      { text: 'ĐỨNG NGOÀI QUAN SÁT', color: '#1E293B', textColor: '#CBD5E1', border: '#475569' }
    ],
    ctaText: 'Bình luận góc nhìn của bạn bên dưới nhé!'
  }
]

// 2. KỊCH BẢN DIGIWORLD (DGW) - MIẾNG BÁNH 1 TỶ USD & SÓNG BÁN LẺ
export const DGW_13_SLIDES_STORYBOARD = [
  {
    slideNumber: 1,
    duration: 3.5,
    type: 'typography_hook',
    badge: 'TIN NÓNG DOANH NGHIỆP',
    voiceText: 'Lãnh đạo Digiworld vừa hé lộ miếng bánh hơn 1 tỷ USD và mục tiêu tăng trưởng 20% mỗi năm. Liệu DGW có bùng nổ vượt đỉnh?',
    titleTop: 'Tin Nóng Digiworld (DGW)...',
    titleMain: 'HÉ LỘ MIẾNG BÁNH',
    highlightText: 'HƠN 1 TỶ USD',
    highlightColor: '#10B981',
    subText: '...mục tiêu tăng trưởng 20% năm 2027 hoàn toàn khả thi.',
    pillBadge: 'ĐÂY MỚI LÀ LÚC CHÚ Ý',
    pillColor: '#10B981'
  },
  {
    slideNumber: 2,
    duration: 3.2,
    type: 'retail_network',
    badge: 'MÔ HÌNH KINH DOANH',
    voiceText: 'Là nhà phân phối độc quyền Xiaomi, Apple và thiết bị công nghệ hàng đầu, Digiworld đang mở rộng thần tốc sang mảng thiết bị gia dụng và bảo vệ sức khỏe.',
    titleMain: 'HỆ SINH THÁI DIGIWORLD',
    titleSub: 'PHỦ SÓNG TOÀN BỘ CHUỖI BÁN LẺ',
    pillBadge: 'XIAOMI & APPLE PARTNER',
    pillColor: '#F59E0B',
    noteText: 'hơn 6.000 điểm bán'
  },
  {
    slideNumber: 3,
    duration: 3.2,
    type: 'chart_rally',
    badge: 'LỊCH SỬ TĂNG TRƯỞNG',
    voiceText: 'Cổ phiếu DGW nổi tiếng với những nhịp tăng sốc khi sức mua tiêu dùng phục hồi.',
    yearTag: 'Sóng bứt phá gần nhất',
    titleMain: 'BỨT PHÁ TĂNG TRƯỞNG DOANH THU',
    startPrice: '~32.0',
    endPrice: '~68.0',
    gainBadge: '+110%'
  },
  {
    slideNumber: 4,
    duration: 3.2,
    type: 'chart_crash',
    badge: 'NHỊP TÍCH LŨY',
    voiceText: 'Sau giai đoạn tăng nóng, DGW đã rũ bỏ và tích lũy chặt chẽ suốt nhiều tháng.',
    titleMain: 'TÍCH LŨY KIỆT THANH KHOẢN.',
    titleSub: 'Cạn cung bán. Tay to âm thầm gom hàng.',
    lossBadge: '-25%',
    lossText: 'Vùng cân bằng cung cầu tuyệt đối'
  },
  {
    slideNumber: 5,
    duration: 3.5,
    type: 'chart_base',
    badge: 'VÙNG NỀN GIÁ',
    voiceText: 'Hôm nay DGW đang đứng ở vùng nền hỗ trợ trung hạn cực kỳ an toàn.',
    introText: 'Vùng tích lũy chiến lược',
    titleMain: 'VÙNG NỀN 58 – 62',
    titleColor: '#38BDF8',
    zoneText: 'VÙNG HỖ TRỢ 58 – 62',
    timeframeText: 'Khối ngoại liên tục mua ròng',
    dotAnnotation: 'Bật tăng mạnh mẽ'
  },
  {
    slideNumber: 6,
    duration: 3.2,
    type: 'cycle_wave',
    badge: 'CHU KỲ TIÊU DÙNG',
    voiceText: 'Đáy của chu kỳ sức mua đã qua. Quý 4 và năm 2027 là thời điểm vàng của mùa mua sắm thiết bị AI.',
    strike1: 'KHÔNG CÒN TRẦM LẮNG',
    strike2: 'SỨC MUA HỒI PHỤC',
    bottomLabel: 'ĐÓN SÓNG MỚI',
    bottomSub: 'CHUYỂN GIAO THIẾT BỊ AI'
  },
  {
    slideNumber: 7,
    duration: 3.5,
    type: 'candlestick_breakout',
    badge: 'BÙNG NỔ KỸ THUẬT',
    voiceText: 'Tin tức miếng bánh 1 tỷ USD xuất hiện đúng lúc cổ phiếu bứt phá vùng cản chéo kỹ thuật.',
    topText: 'Bứt phá khỏi kênh giảm...',
    titleMain: 'BREAKOUT MỞ SÓNG TĂNG',
    titleColor: '#10B981',
    ceilingBadge: 'VƯỢT CẢN',
    gapBadge: 'VOL LỚN',
    descText: 'Thanh khoản nổ bung, sẵn sàng tiến về mốc đỉnh cũ.'
  },
  {
    slideNumber: 8,
    duration: 3.0,
    type: 'golden_coin',
    badge: 'GIÁ TRỊ DOANH NGHIỆP',
    voiceText: 'Doanh nghiệp quản trị dòng tiền cực chuẩn, cổ tức đều đặn, được các quỹ ngoại đánh giá rất cao.',
    strike1: 'TĂNG TRƯỞNG THẬT',
    coinText: 'DGW',
    titleMain: 'ÔNG VUA PHÂN PHỐI ICT'
  },
  {
    slideNumber: 9,
    duration: 2.8,
    type: 'why_question',
    badge: 'CÂU HỎI LỚN',
    voiceText: 'Vì sao lại là Digiworld? Và vì sao lại là lúc này?',
    line1: 'VÌ SAO LÀ DIGIWORLD?',
    line2: 'VÌ SAO LÀ LÚC NÀY?'
  },
  {
    slideNumber: 10,
    duration: 3.2,
    type: 'money_funnel',
    badge: 'DÒNG TIỀN BÁN LẺ',
    voiceText: 'Khi kinh tế hồi phục, nhóm bán lẻ công nghệ luôn là nhóm đầu tiên phản ánh vào giá cổ phiếu.',
    titleMain: 'SÓNG TIÊU DÙNG SỐ',
    subtitle: '➔ Dòng tiền tập trung vào đầu ngành',
    funnelLabel: 'DÒNG TIỀN BÁN LẺ'
  },
  {
    slideNumber: 11,
    duration: 3.5,
    type: 'checklist_card',
    badge: '3 TIÊU CHÍ VÀNG',
    voiceText: 'DGW hội tụ đủ 3 yếu tố: Doanh thu 1 tỷ USD, mở rộng sang xe điện và thiết bị thông minh, định giá hấp dẫn.',
    titleMain: '3 YẾU TỐ BỨT PHÁ DGW',
    items: [
      { num: 'Yếu tố 1', bold: 'Doanh thu 1 tỷ USD', detail: 'Tăng trưởng 20% mỗi năm' },
      { num: 'Yếu tố 2', bold: 'Độc quyền Xiaomi', detail: 'Hưởng trọn làn sóng AI Phone' },
      { num: 'Yếu tố 3', bold: 'Cổ tức tiền mặt', detail: 'Cơ cấu tài chính lành mạnh' }
    ],
    pillBadge: 'DGW ĐẠT CẢ 3'
  },
  {
    slideNumber: 12,
    duration: 3.5,
    type: 'radar_scan',
    badge: 'RADAR THEO DÕI',
    voiceText: 'DGW đang cho thấy sức mạnh giá vượt trội hơn hẳn so với toàn bộ nhóm bán lẻ còn lại.',
    introText: 'Tâm điểm nhóm bán lẻ',
    titleMain: 'CỔ PHIẾU KHỎE NHẤT NGÀNH',
    radarTarget: 'DGW',
    pillBadge: 'ĐẶT LÊN RA-DA'
  },
  {
    slideNumber: 13,
    duration: 4.0,
    type: 'poll_cta',
    badge: 'BÌNH LUẬN TƯƠNG TÁC',
    voiceText: 'Mục tiêu 20% của Digiworld có khả thi? Bạn đang cầm DGW, đang canh mua, hay đứng ngoài? Comment cho mình biết nhé!',
    introText: 'Góc nhìn của bạn...',
    titleMain: 'BẠN ĐÁNH GIÁ THẾ NÀO VỀ DGW?',
    pollButtons: [
      { text: 'ĐANG CẦM HÀNG', color: '#10B981', textColor: '#FFFFFF' },
      { text: 'ĐANG CANH MUA', color: '#F59E0B', textColor: '#000000' },
      { text: 'ĐỨNG NGOÀI QUAN SÁT', color: '#1E293B', textColor: '#CBD5E1', border: '#475569' }
    ],
    ctaText: 'Hãy để lại bình luận và follow FinGreen nhé!'
  }
]

// 3. KỊCH BẢN CẢNH BÁO THAO TÚNG & RỦI RO (Án phạt Lê Việt Cường)
export const MANIPULATION_13_SLIDES_STORYBOARD = [
  {
    slideNumber: 1,
    duration: 3.5,
    type: 'typography_hook',
    badge: 'CẢNH BÁO PHÁP LÝ',
    voiceText: 'Án phạt 1,5 tỷ đồng và cấm giao dịch 2 năm: Lời cảnh tỉnh đanh thép cho những ai còn ham đu bám cổ phiếu lái.',
    titleTop: 'Án Phạt Ủy Ban Chứng Khoán...',
    titleMain: 'THAO TÚNG GIÁ CỔ PHIẾU',
    highlightText: 'PHẠT 1,5 TỶ ĐỒNG',
    highlightColor: '#EF4444',
    subText: '...cấm giao dịch 2 năm với cá nhân vi phạm.',
    pillBadge: 'BÀI HỌC XƯƠNG MÁU',
    pillColor: '#EF4444'
  },
  {
    slideNumber: 2,
    duration: 3.2,
    type: 'risk_alert_tree',
    badge: 'BẪY THANH KHOẢN',
    voiceText: 'Thủ đoạn dùng nhiều tài khoản mua bán chéo tạo cung cầu ảo, vẽ đồ thị để lùa nhà đầu tư nhỏ lẻ vào bẫy.',
    titleMain: 'CHIÊU TRÒ VẼ BIỂU ĐỒ',
    titleSub: 'TẠO CUNG CẦU GIẢ ĐỂ LÙA NHỎ LẺ',
    pillBadge: 'BẪY CÂY THÔNG',
    pillColor: '#EF4444',
    noteText: 'cảnh báo rủi ro'
  },
  {
    slideNumber: 3,
    duration: 3.2,
    type: 'chart_rally',
    badge: 'GIAI ĐOẠN ĐẨY GIÁ',
    voiceText: 'Ban đầu, cổ phiếu được kéo trần liên tục không cho mua, kích thích lòng tham tột độ.',
    yearTag: 'Giai đoạn FOMO',
    titleMain: 'KÉO ẢO 10 CÂY TRẦN LIÊN TIẾP',
    startPrice: '~5.0',
    endPrice: '~25.0',
    gainBadge: '+400% ẢO'
  },
  {
    slideNumber: 4,
    duration: 3.2,
    type: 'chart_crash',
    badge: 'GIAI ĐOẠN NHỐT SÀN',
    voiceText: 'Và khi nhỏ lẻ đu đỉnh, lái lập tức xả hàng, nhốt sàn mất thanh khoản, không thể bán ra được.',
    titleMain: 'MẤT THANH KHOẢN.',
    titleSub: 'Nhốt sàn trắng bên mua. Tài khoản bốc hơi.',
    lossBadge: '-80%',
    lossText: 'Cháy tài khoản chỉ trong 2 tuần'
  },
  {
    slideNumber: 5,
    duration: 3.5,
    type: 'chart_base',
    badge: 'BÀI HỌC BẢO TOÀN VỐN',
    voiceText: 'Nguyên tắc bất di bất dịch trên thị trường: Không bao giờ đánh cược tương lai vào những cổ phiếu không có nền tảng kinh doanh.',
    introText: 'Bài học sống còn',
    titleMain: 'BẢO TOÀN VỐN LÀ SỐ 1',
    titleColor: '#EF4444',
    zoneText: 'TRÁNH XA CỔ PHIẾU LÁI',
    timeframeText: 'Kỷ luật cắt lỗ tuyệt đối',
    dotAnnotation: 'Bảo vệ thành quả'
  },
  {
    slideNumber: 6,
    duration: 3.2,
    type: 'cycle_wave',
    badge: 'TRIẾT LÝ ĐẦU TƯ',
    voiceText: 'Tiền kiếm được từ may mắn sẽ mất đi bởi năng lực. Hãy đầu tư vào doanh nghiệp tạo ra giá trị thực.',
    strike1: 'KHÔNG ĐÁNH BẠC',
    strike2: 'KHÔNG NGHE PHÍM HÀNG',
    bottomLabel: 'ĐẦU TƯ THỰC',
    bottomSub: 'DỰA TRÊN DỮ LIỆU TÀI CHÍNH'
  },
  {
    slideNumber: 7,
    duration: 3.5,
    type: 'candlestick_breakout',
    badge: 'NHẬN DIỆN BẪY',
    voiceText: 'Dấu hiệu nhận biết: Doanh nghiệp lỗ triền miên nhưng giá tăng trần vô lý, tin đồn khắp các hội nhóm.',
    topText: 'Cách nhận diện bẫy lừa...',
    titleMain: 'CẢNH GIÁC VỚI TIN ĐỒN',
    titleColor: '#EF4444',
    ceilingBadge: 'BẪY FOMO',
    gapBadge: 'CẢNH BÁO',
    descText: 'Khi ai cũng khen ngon là lúc bẫy chuẩn bị sập.'
  },
  {
    slideNumber: 8,
    duration: 3.0,
    type: 'golden_coin',
    badge: 'TƯ DUY ĐÚNG ĐẮN',
    voiceText: 'Chỉ có cổ phiếu cơ bản tốt, dòng tiền minh bạch mới giúp tài khoản tăng trưởng bền vững qua năm tháng.',
    strike1: 'MINH BẠCH LÀ VÀNG',
    coinText: 'FIN',
    titleMain: 'CHỌN DOANH NGHIỆP UY TÍN'
  },
  {
    slideNumber: 9,
    duration: 2.8,
    type: 'why_question',
    badge: 'CÂU HỎI TỰ VẤN',
    voiceText: 'Bạn đang đầu tư hay đang đánh bạc với số tiền mồ hôi nước mắt của mình?',
    line1: 'BẠN ĐANG ĐẦU TƯ?',
    line2: 'HAY ĐANG ĐÁNH BẠC?'
  },
  {
    slideNumber: 10,
    duration: 3.2,
    type: 'money_funnel',
    badge: 'LỌC RÁC TÀI CHÍNH',
    voiceText: 'Hệ thống FinGreen luôn lọc sạch các cổ phiếu có dấu hiệu gian lận báo cáo và thao túng giá.',
    titleMain: 'BỘ LỌC CỔ PHIẾU RÁC',
    subtitle: '➔ Bảo vệ nhà đầu tư khỏi bẫy giá',
    funnelLabel: 'LỌC RỦI RO GIAN LẬN'
  },
  {
    slideNumber: 11,
    duration: 3.5,
    type: 'checklist_card',
    badge: '3 NGUYÊN TẮC VÀNG',
    voiceText: '3 nguyên tắc: Không mua đuổi trần, kiểm tra báo cáo tài chính, và tuyệt đối tuân thủ kỷ luật dừng lỗ.',
    titleMain: '3 NGUYÊN TẮC BẢO VỆ TÀI KHOẢN',
    items: [
      { num: 'Nguyên tắc 1', bold: 'Không đu trần', detail: 'Tuyệt đối tránh fomo' },
      { num: 'Nguyên tắc 2', bold: 'Kiểm tra BCTC', detail: 'Doanh nghiệp phải có lãi' },
      { num: 'Nguyên tắc 3', bold: 'Cắt lỗ kỷ luật', detail: 'Chặn đứng rủi ro từ sớm' }
    ],
    pillBadge: 'GHI NHỚ 3 ĐIỀU NÀY'
  },
  {
    slideNumber: 12,
    duration: 3.5,
    type: 'radar_scan',
    badge: 'RADAR AN TOÀN',
    voiceText: 'Hãy đưa vào radar của bạn những cổ phiếu đầu ngành có kết quả kinh doanh tăng trưởng thật.',
    introText: 'Tầm soát rủi ro',
    titleMain: 'QUÉT CỔ PHIẾU AN TOÀN',
    radarTarget: 'TOP 50',
    pillBadge: 'TẦM SOÁT FIN'
  },
  {
    slideNumber: 13,
    duration: 4.0,
    type: 'poll_cta',
    badge: 'CHIA SẺ KINH NGHIỆM',
    voiceText: 'Bạn đã từng dính bẫy cổ phiếu lái bao giờ chưa? Hãy bình luận bên dưới để cùng nhau rút ra bài học nhé!',
    introText: 'Chia sẻ kinh nghiệm...',
    titleMain: 'BẠN ĐÃ TỪNG DÍNH BẪY LÁI?',
    pollButtons: [
      { text: 'TỪNG MẤT TIỀN ĐAU ĐỚN', color: '#EF4444', textColor: '#FFFFFF' },
      { text: 'SUÝT NỮA THÌ DÍNH', color: '#F59E0B', textColor: '#000000' },
      { text: 'LUÔN TRÁNH XA HÀNG LÁI', color: '#10B981', textColor: '#FFFFFF' }
    ],
    ctaText: 'Bình luận câu chuyện của bạn bên dưới nhé!'
  }
]

// Các chiến dịch video đa dạng theo ngành & tin tức thực tế
export const FULL_FEATURED_CAMPAIGNS = [
  {
    id: 'campaign-vsc-viral-13',
    stock_code: 'VSC',
    title: 'Cổ phiếu VSC - Con Tàu Quay Về Điểm Xuất Phát & Kéo Còi Bứt Phá',
    news_source: 'CafeF Vận Tải Biển',
    created_at: new Date().toISOString(),
    status: 'ready',
    duration_seconds: 44,
    slides: VSC_13_SLIDES_STORYBOARD
  },
  {
    id: 'campaign-hpg-viral-13',
    stock_code: 'HPG',
    title: 'Hòa Phát (HPG) - Vua Thép Gom Hàng & Lò Cao Dung Quất 2 Đỏ Lửa',
    news_source: 'CafeF Ngành Thép',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'ready',
    duration_seconds: 43,
    slides: HPG_13_SLIDES_STORYBOARD
  },
  {
    id: 'campaign-dgw-viral-13',
    stock_code: 'DGW',
    title: 'Digiworld (DGW) - Hé Lộ Miếng Bánh 1 Tỷ USD & Sóng Tiêu Dùng Số',
    news_source: 'Tin Nóng CafeF 8/11',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'ready',
    duration_seconds: 42,
    slides: DGW_13_SLIDES_STORYBOARD
  },
  {
    id: 'campaign-warning-13',
    stock_code: 'CẢNH BÁO',
    title: 'Thao Túng Cổ Phiếu Bị Phạt 1.5 Tỷ - Lời Cảnh Tỉnh Về Bẫy Cây Thông',
    news_source: 'CafeF Pháp Lý 8/11',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'published',
    duration_seconds: 42,
    slides: MANIPULATION_13_SLIDES_STORYBOARD
  }
]

// Trích xuất mã cổ phiếu 3 chữ cái từ tiêu đề
export function extractStockCodeFromTitle(title) {
  if (!title) return 'VNINDEX'
  const known = ['DGW', 'VIC', 'VHM', 'VRE', 'VSC', 'HPG', 'SSI', 'VND', 'FPT', 'MWG', 'TCB', 'MBB', 'VPB', 'SHB', 'STB', 'MSR', 'QCG', 'VJC', 'HVN', 'GAS', 'PLX', 'POW', 'PVD', 'PVS', 'DIG', 'DXG', 'CEO', 'NVL', 'PDR', 'KDH', 'NLG']
  const upper = title.toUpperCase()
  for (const code of known) {
    const regex = new RegExp(`\\b${code}\\b`)
    if (regex.test(upper)) return code
  }
  const match = title.match(/\b([A-Z]{3})\b/)
  if (match && !['USD', 'VND', 'GDP', 'CPI', 'BCTC', 'FED', 'CEO', 'CTO', 'CFO', 'HOSE', 'HNX', 'UPC'].includes(match[1])) {
    return match[1]
  }
  return 'VNINDEX'
}

// Hàm tính thời gian hiển thị thân thiện (VD: 15 phút trước, 1 giờ trước)
export function formatTimeAgo(dateString) {
  try {
    const d = new Date(dateString)
    const now = new Date()
    const diffMin = Math.floor((now - d) / 60000)
    if (isNaN(diffMin)) return 'Vừa xuất bản'
    if (diffMin < 1) return 'Vừa xong'
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} ngày trước`
  } catch (e) {
    return 'Hôm nay'
  }
}

// HÀM CÀO TOÀN BỘ NỘI DUNG CHI TIẾT BÀI BÁO (FULL TEXT) TỪ LINK BÁO
export async function fetchFullArticleText(url, fallbackText = '') {
  if (!url) return fallbackText;
  try {
    const res = await fetch(`/api/fetch-article?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.fullContent && data.fullContent.length > 80) {
        return data.fullContent;
      }
    }
  } catch (err) {
    console.warn('Lỗi cào full bài báo:', err);
  }
  return fallbackText;
}

// CÀO TIN TỨC CHỨNG KHOÁN THỜI GIAN THỰC (REAL-TIME RSS) TỪ CAFEF, VIETSTOCK & VNECONOMY
export async function fetchLiveRealtimeNews() {
  const sources = [
    { name: 'CafeF Chứng Khoán', url: '/api/cafef/thi-truong-chung-khoan.rss', direct: 'https://cafef.vn/thi-truong-chung-khoan.rss' },
    { name: 'CafeF Doanh Nghiệp', url: '/api/cafef/doanh-nghiep.rss', direct: 'https://cafef.vn/doanh-nghiep.rss' },
    { name: 'VietStock', url: '/api/vietstock/rss/chung-khoan.rss', direct: 'https://vietstock.vn/rss/chung-khoan.rss' },
    { name: 'VnEconomy', url: '/api/vneconomy/chung-khoan.rss', direct: 'https://vneconomy.vn/chung-khoan.rss' }
  ]

  let allArticles = []

  for (const src of sources) {
    try {
      let xmlText = ''
      try {
        const res = await fetch(src.url, { cache: 'no-store' })
        if (res.ok) {
          xmlText = await res.text()
        }
      } catch (err) {
        // Fallback CORS proxy
        const fallbackRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(src.direct)}`)
        if (fallbackRes.ok) {
          xmlText = await fallbackRes.text()
        }
      }

      if (xmlText && xmlText.includes('<item>')) {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
        const items = xmlDoc.querySelectorAll('item')

        items.forEach((item, idx) => {
          if (idx >= 6) return
          const rawTitle = item.querySelector('title')?.textContent || ''
          const rawDesc = item.querySelector('description')?.textContent || ''
          const rawPubDate = item.querySelector('pubDate')?.textContent || ''
          const link = item.querySelector('link')?.textContent || ''

          // Làm sạch mô tả (loại bỏ thẻ HTML và ảnh)
          const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').trim()
          const cleanTitle = rawTitle.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
          const stock = extractStockCodeFromTitle(cleanTitle)

          if (cleanTitle) {
            allArticles.push({
              id: `live-${src.name}-${idx}-${Date.now()}`,
              title: cleanTitle,
              summary: cleanDesc.slice(0, 180) + (cleanDesc.length > 180 ? '...' : ''),
              source: src.name,
              pubDate: rawPubDate,
              time: formatTimeAgo(rawPubDate),
              stockCode: stock,
              link
            })
          }
        })
      }
    } catch (e) {
      console.warn(`Lỗi cào nguồn ${src.name}:`, e)
    }
  }

  // Sắp xếp bài mới nhất lên đầu
  if (allArticles.length > 0) {
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    return allArticles.slice(0, 12)
  }

  return []
}

// Đọc và Lưu Campaigns
export function getTikTokCampaigns() {
  try {
    const saved = localStorage.getItem('fingreen_tiktok_campaigns_v6')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed
    }
  } catch (e) {
    console.error('Lỗi đọc campaigns:', e)
  }
  saveTikTokCampaigns(FULL_FEATURED_CAMPAIGNS)
  return FULL_FEATURED_CAMPAIGNS
}

export function saveTikTokCampaigns(campaigns) {
  try {
    localStorage.setItem('fingreen_tiktok_campaigns_v6', JSON.stringify(campaigns))
    return true
  } catch (e) {
    return false
  }
}

// Khôi phục danh sách chuẩn 5 video đa ngành
export function resetToDefaultCampaigns() {
  saveTikTokCampaigns(FULL_FEATURED_CAMPAIGNS)
  return FULL_FEATURED_CAMPAIGNS
}

// Cấu hình mặc định cho TikTok & Giọng đọc OmniVoice Tiếng Việt (VoiceStudio debpalash)
export const DEFAULT_TIKTOK_SETTINGS = {
  tiktok_client_key: '',
  tiktok_access_token: '',
  tiktok_creator_name: '@fingreen.official',
  upload_post_api_key: '',
  auto_pilot: false,
  schedule_interval: '2h',
  // Cấu hình OmniVoice chuẩn tiếng Việt
  tts_engine: 'omnivoice',
  tts_language: 'vi', // Chuẩn ISO 639-1 tiếng Việt trong mã nguồn OmniVoice
  tts_model: 'splendor1811/omnivoice-vietnamese',
  tts_denoising_steps: 16
}

// Cài đặt TikTok
export function getTikTokSettings() {
  try {
    const saved = localStorage.getItem('fingreen_tiktok_settings')
    if (saved) return { ...DEFAULT_TIKTOK_SETTINGS, ...JSON.parse(saved) }
  } catch (e) {}
  return DEFAULT_TIKTOK_SETTINGS
}

export function saveTikTokSettings(settings) {
  try {
    localStorage.setItem('fingreen_tiktok_settings', JSON.stringify(settings))
  } catch (e) {}
}

export async function postVideoToTikTok({ campaign, settings }) {
  await new Promise(r => setTimeout(r, 1500))
  const mockPostId = 'tk_' + Math.floor(Math.random() * 10000000000000000)
  return {
    success: true,
    postId: mockPostId,
    url: `https://www.tiktok.com/${settings?.tiktok_creator_name || '@fingreen.official'}/video/${mockPostId}`
  }
}

// Hàm xử lý an toàn và tự động sửa chữa JSON khi Gemini bị cắt chuỗi
function safeParse13Slides(rawText, stockCode) {
  if (!rawText) return null

  // Loại bỏ markdown code fences
  let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()

  // Lần thử 1: Thử parse trực tiếp
  try {
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    if (parsed.slides && Array.isArray(parsed.slides)) return parsed.slides
  } catch (err1) {
    console.warn('Lần thử 1 parse JSON thất bại, đang tự động sửa lỗi chuỗi...', err1.message)
  }

  // Lần thử 2: Tự động tìm vị trí đóng object "}" cuối cùng và đóng mảng "]"
  try {
    const lastBrace = clean.lastIndexOf('}')
    if (lastBrace > 0) {
      let candidate = clean.slice(0, lastBrace + 1).trim()
      if (!candidate.startsWith('[')) candidate = '[' + candidate
      if (!candidate.endsWith(']')) candidate = candidate + ']'
      const repaired = JSON.parse(candidate)
      if (Array.isArray(repaired) && repaired.length > 0) {
        console.log('🎉 Tự động sửa chuỗi JSON thành công! Thu được:', repaired.length, 'slides')
        return repaired
      }
    }
  } catch (err2) {
    console.warn('Lần thử 2 auto-repair JSON thất bại:', err2.message)
  }

  return null
}

// Hàm thích ứng 13 Slide mẫu cho cổ phiếu mục tiêu
export function adapt13SlidesForStock(stockCode, newsTitle = '') {
  const code = stockCode.toUpperCase()
  return VSC_13_SLIDES_STORYBOARD.map(slide => {
    const copy = { ...slide }
    // Thay thế text có VSC bằng mã cổ phiếu mới
    if (copy.titleMain) copy.titleMain = copy.titleMain.replace(/VSC/g, code)
    if (copy.titleSub) copy.titleSub = copy.titleSub.replace(/VSC/g, code)
    if (copy.voiceText) copy.voiceText = copy.voiceText.replace(/VSC/g, code)
    if (copy.radarTarget) copy.radarTarget = code
    if (copy.coinText) copy.coinText = code
    if (copy.line1) copy.line1 = copy.line1.replace(/VSC/g, code)
    if (copy.pillBadge) copy.pillBadge = copy.pillBadge.replace(/VSC/g, code)
    return copy
  })
}

// Gọi Gemini AI sinh 13 Slides Storyboard chuyên nghiệp cho bất kỳ mã cổ phiếu nào

// Gọi Gemini AI sinh 13 Slides Storyboard ĐỘC BẢN bám sát 100% nội dung bài báo tin tức

// =============================================================================
// HÀM CHUẨN HÓA DỮ LIỆU SLIDE TỪ BẤT KỲ CẤU TRÚC JSON CỦA GEMINI
// =============================================================================
export function normalizeSlideData(rawSlide, index, defaultCode = 'FIN') {
  const num = rawSlide.slide || rawSlide.slideNumber || (index + 1);
  const headline = rawSlide.headline || rawSlide.titleMain || rawSlide.title || 'THÔNG TIN THỊ TRƯỜNG';
  
  let voice = rawSlide.voiceText || rawSlide.script || '';
  if (!voice && Array.isArray(rawSlide.bullet_points)) {
    voice = rawSlide.bullet_points.join('. ');
  } else if (!voice && typeof rawSlide.bullet_points === 'string') {
    voice = rawSlide.bullet_points;
  }
  if (!voice) voice = headline;

  let pollBtns = rawSlide.pollButtons;
  if (!pollBtns && Array.isArray(rawSlide.bullet_points) && (rawSlide.type === 'poll_cta' || num === 13)) {
    pollBtns = rawSlide.bullet_points
      .filter(p => typeof p === 'string' && p.trim().length > 0)
      .slice(0, 3)
      .map((p, idx) => ({
        text: p.replace(/^[A-D0-9][.:)]s*/, '').trim(),
        color: idx === 0 ? '#10B981' : idx === 1 ? '#F59E0B' : '#1E293B',
        textColor: idx === 1 ? '#000000' : '#FFFFFF',
        border: idx === 2 ? '#475569' : undefined
      }));
  }
  if (!pollBtns && (rawSlide.type === 'poll_cta' || num === 13)) {
    pollBtns = [
      { text: 'RẤT ĐỒNG Ý / HỢP LÝ', color: '#10B981', textColor: '#FFFFFF' },
      { text: 'CẦN THỜI GIAN KIỂM CHỨNG', color: '#F59E0B', textColor: '#000000' },
      { text: 'CHƯA THỰC SỰ THUYẾT PHỤC', color: '#1E293B', textColor: '#CBD5E1', border: '#475569' }
    ];
  }

  let slideType = rawSlide.type || 'typography_hook';
  // Slide 13 luôn là Đúc kết chiến lược FinGreen (TUYỆT ĐỐI KHÔNG HỎI KHÁN GIẢ)
  if (num === 13 || slideType.includes('verdict') || slideType.includes('takeaway') || slideType.includes('poll') || slideType.includes('cta')) {
    slideType = 'executive_verdict';
  } else if (slideType.includes('quote') || (voice && (voice.includes('cho biết') || voice.includes('phát biểu') || voice.includes('tại toà') || voice.includes('tại tòa') || voice.includes('bị cáo') || voice.includes('tuyên bố')))) {
    slideType = 'quote_editorial';
  } else if (slideType.includes('metric') || rawSlide.metricValue || /\b\d+(\.\d+)?(%| triệu| tỷ| nghìn)\b/i.test(headline)) {
    slideType = 'big_metric_stat';
  } else if (slideType.includes('radar') || slideType.includes('scan')) {
    slideType = 'radar_scan';
  } else if (slideType.includes('chart') || slideType.includes('nến') || slideType.includes('breakout')) {
    slideType = 'candlestick_breakout';
  } else if (Array.isArray(rawSlide.items) || (Array.isArray(rawSlide.bullet_points) && rawSlide.bullet_points.length >= 2 && num !== 13)) {
    slideType = 'checklist_card';
  }

  // XỬ LÝ AN TOÀN TUYỆT ĐỐI CHO CHECKLIST ITEMS: KHÔNG BAO GIỜ ĐỂ HỘP TRỐNG!
  let checklistItems = null;
  if (Array.isArray(rawSlide.items) && rawSlide.items.length > 0) {
    checklistItems = rawSlide.items.slice(0, 3).map((it, i) => {
      if (typeof it === 'string') {
        const parts = it.split(/[:–-]/);
        return {
          num: `0${i + 1}`,
          bold: (parts[0] || it).replace(/^[0-9A-D][.:)]\s*/, '').trim(),
          detail: (parts[1] || '').trim()
        };
      }
      return {
        num: it?.num || `0${i + 1}`,
        bold: (it?.bold || it?.title || it?.headline || it?.text || it?.name || `Trọng tâm ${i + 1}`).trim(),
        detail: (it?.detail || it?.desc || it?.description || it?.sub || '').trim()
      };
    });
  } else if (Array.isArray(rawSlide.bullet_points) && rawSlide.bullet_points.length > 0) {
    checklistItems = rawSlide.bullet_points.slice(0, 3).map((bp, i) => {
      const parts = String(bp).split(/[:–-]/);
      return {
        num: `0${i + 1}`,
        bold: (parts[0] || `Điểm ${i + 1}`).replace(/^[0-9A-D][.:)]\s*/, '').trim(),
        detail: (parts[1] || '').trim()
      };
    });
  }

  // NẾU LÀ CHECKLIST NHƯNG THIẾU ITEMS: TỰ ĐỘNG BÓC TÁCH TỪ CHÍNH LỜI ĐỌC CỦA SLIDE!
  if (slideType === 'checklist_card' && (!checklistItems || checklistItems.length === 0)) {
    const rawVoice = voice || headline;
    const parts = rawVoice.split(/[,;\n\.\!\?]| và /i).map(p => p.trim()).filter(p => p.length > 4);
    if (parts.length >= 2) {
      checklistItems = parts.slice(0, 3).map((p, i) => ({
        num: `0${i + 1}`,
        bold: p.length > 36 ? p.slice(0, 36) + '...' : p,
        detail: parts[i + 1] ? (parts[i + 1].length > 40 ? parts[i + 1].slice(0, 40) + '...' : parts[i + 1]) : 'Thông tin cập nhật từ thị trường'
      }));
    } else {
      checklistItems = [
        { num: '01', bold: 'Dòng tiền chủ động gia tăng', detail: 'Tổ chức chủ động mua gom tích lũy' },
        { num: '02', bold: 'Triển khai tái cơ cấu', detail: 'Tối ưu hóa các dự án trọng điểm' },
        { num: '03', bold: 'Kỳ vọng chu kỳ tăng trưởng', detail: 'Tạo lập vị thế tài chính vững chắc' }
      ];
    }
  }

  return {
    slideNumber: num,
    duration: rawSlide.duration || 3.5,
    type: slideType,
    badge: rawSlide.badge || (num === 1 ? 'TIN NÓNG ĐẶC BIỆT' : num === 13 ? 'ĐÚC KẾT FINGREEN' : 'PHÂN TÍCH CHUYÊN SÂU'),
    voiceText: voice,
    titleMain: headline,
    highlightText: rawSlide.highlightText || (headline.split(' ').slice(-3).join(' ')),
    highlightColor: rawSlide.highlightColor || (num === 1 ? '#F59E0B' : '#10B981'),
    subText: rawSlide.subText || rawSlide.visual_cue || '',
    metricValue: rawSlide.metricValue || '',
    metricLabel: rawSlide.metricLabel || '',
    pillBadge: rawSlide.pillBadge || (num === 1 ? 'XEM NGAY' : num === 13 ? 'CHIẾN LƯỢC ĐẦU TƯ' : defaultCode),
    items: checklistItems,
    ctaText: 'Góc nhìn phân tích độc quyền từ FinGreen Media'
  };
}

// =============================================================================
// AI TỰ ĐỘNG DỰNG VIDEO 13 SLIDE TỪ BẤT KỲ NỘI DUNG / BÀI BÁO NGƯỜI DÙNG GỬI LÊN
// =============================================================================
export async function generateVideoFromUserContent({ contentText = '', stockCode = '' }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Chưa có Gemini API Key! Vui lòng kiểm tra cài đặt.');
  }

  const cleanText = (contentText || '').trim();
  if (cleanText.length < 10) {
    throw new Error('Vui lòng chọn một tin tức hoặc nhập nội dung bài báo để AI dựng video!');
  }

  // TỰ ĐỘNG TRÍCH XUẤT CHỦ ĐỀ & MÃ CỔ PHIẾU TỪ CHÍNH BÀI BÁO (BÀI NÓI GÌ LÀM NẤY)
  const autoExtracted = extractStockCodeFromTitle(cleanText);
  const code = autoExtracted !== 'VNINDEX' ? autoExtracted : (stockCode || 'THỊ TRƯỜNG').toUpperCase();

  const prompt = `
Bạn là Đạo diễn kiêm Nhà báo Biên tập viên Video TikTok Tài chính Triệu View của kênh FinGreen.
Nhiệm vụ: Hãy đọc và phân tích TOÀN BỘ BÀI BÁO / TIN TỨC ĐƯỢC CHỌN DƯỚI ĐÂY, sau đó tự tay sáng tạo một Kịch bản Video TikTok Kinetic Typography gồm 13 SLIDE 100% VỀ ĐÚNG BÀI BÁO NÀY:

"""
${cleanText}
"""

QUY TẮC SỐ 1 (BẮT BUỘC): BÀI BÁO NÓI VỀ ĐỐI TƯỢNG NÀO THÌ VIDEO PHẢI 100% NÓI VỀ ĐỐI TƯỢNG ĐÓ!
1. Tuyệt đối KHÔNG ĐƯỢC tự ý gán vào mã cổ phiếu khác!
   - Nếu bài báo nói về Shark Bình thì làm về Shark Bình. Nếu nói về VHM thì làm về VHM. Nếu nói về TAL thì làm về TAL!
2. TUYỆT ĐỐI CẤM SỬ DỤNG MÔ-TÍP CŨ:
   - CẤM nói "Có một cổ phiếu từng khiến rất nhiều người tiếc nuối..."
   - CẤM nói "Con tàu ... vừa kéo còi..." hoặc "Cỗ máy ... đứng đúng vùng nền 5 năm..."
3. MỌI SLIDE PHẢI BẮT NGUỒN TỪ CHÍNH NỘI DUNG BÀI BÁO TRÊN:
   - Trích dẫn đúng tên sự kiện, công ty, con số %, số tiền tỷ, dự án, hoặc chính sách được nêu trong bài báo.
   - Slide 1 (Hook): Bắt buộc giật tít trực diện vào tiêu đề và điểm chấn động nhất của bài báo (type: "typography_hook").
   - Các slide giữa: ĐA DẠNG BỐ CỤC THEO OPENDESIGN SWISS FINTECH:
     + Slide số liệu khổng lồ (type: "big_metric_stat"): trích xuất số liệu quan trọng nhất (ví dụ: metricValue: "6 TRIỆU CP", "61.19%", "18.579 TỶ", "85.000 TỶ")
     + Slide phát biểu / trích dẫn (type: "quote_editorial"): lời khai tại tòa, trích dẫn shark, phát biểu của lãnh đạo
     + Slide 3 điểm nhấn chính (type: "checklist_card"): BẮT BUỘC có items: [{"num":"01","bold":"Điểm 1","detail":"Chi tiết 1"},{"num":"02","bold":"Điểm 2","detail":"Chi tiết 2"},{"num":"03","bold":"Điểm 3","detail":"Chi tiết 3"}]
     + Slide diễn biến đồ thị kỹ thuật (type: "candlestick_breakout")
     + Slide quét tầm soát cơ hội (type: "radar_scan")
   - Slide 13: ĐÚC KẾT & GÓC NHÌN ĐẦU TƯ FINGREEN (type: "executive_verdict") - Tuyên bố kết luận dứt khoát, định hướng hành động cho nhà đầu tư! Tuyệt đối CẤM hỏi khán giả hoặc tạo poll bình chọn!
4. Trả về DUY NHẤT một mảng JSON [ ... ] gồm đúng 13 objects (không dùng markdown code fence).
Mỗi object gồm: slideNumber (1-13), duration (3.5), type, badge, titleMain, voiceText, highlightText, highlightColor, metricValue, metricLabel, items.
`;

  const models = ['gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'];
  let parsedSlides = null;

  for (const m of models) {
    try {
      console.log(`[FinGreen AI] Đang gửi nội dung lên mô hình ${m}...`);
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanJson = rawText.split('```json').join('').split('```').join('').trim();
          const parsed = JSON.parse(cleanJson);
          const rawArray = Array.isArray(parsed) ? parsed : parsed.slides;
          if (Array.isArray(rawArray) && rawArray.length >= 8) {
            parsedSlides = rawArray.map((s, idx) => normalizeSlideData(s, idx, code));
            console.log(`🎉 AI đã dựng thành công 13 slide độc bản từ nội dung gửi lên qua ${m}!`);
            break;
          }
        }
      }
    } catch (err) {
      console.warn(`Lỗi gọi mô hình ${m}:`, err.message);
    }
  }

  // Nếu mạng bị lỗi không kết nối được AI, tự động sinh 13 slide trực tiếp từ câu chữ của bài báo (không dùng boilerplate)
  if (!parsedSlides || parsedSlides.length < 8) {
    const sentences = cleanText.split(/[\n\.\!\?]+/).map(s => s.trim()).filter(s => s.length > 8);
    const titleSnippet = (sentences[0] || `SỰ KIỆN MỚI NHẤT VỀ ${code}`).slice(0, 60);

    parsedSlides = [
      normalizeSlideData({
        slide: 1,
        type: 'typography_hook',
        badge: 'TIN NÓNG ĐẶC BIỆT',
        headline: titleSnippet.toUpperCase(),
        voiceText: `Tin nóng đặc biệt về ${code}: ${sentences[0] || cleanText.slice(0, 100)}`,
        highlightText: code,
        highlightColor: '#F59E0B'
      }, 0, code),
      ...sentences.slice(1, 12).map((st, i) => {
        let type = 'checklist_card';
        if (i % 4 === 0) type = 'big_metric_stat';
        else if (i % 4 === 1) type = 'quote_editorial';
        else if (i % 4 === 2) type = 'candlestick_breakout';
        return normalizeSlideData({
          slide: i + 2,
          type,
          badge: `DIỄN BIẾN ${i + 1}`,
          headline: st.slice(0, 45).toUpperCase(),
          voiceText: st,
          highlightText: st.slice(0, 30),
          bullet_points: [st]
        }, i + 1, code);
      }),
      normalizeSlideData({
        slide: 13,
        type: 'executive_verdict',
        badge: 'ĐÚC KẾT FINGREEN',
        headline: `ĐÚC KẾT CHIẾN LƯỢC VỀ ${code}`,
        voiceText: `Tóm lại, sự kiện này là phép thử quan trọng đối với ${code}. Nhà đầu tư nên bám sát diễn biến dòng tiền tổ chức trước khi ra quyết định.`,
        highlightText: 'BÁM SÁT DÒNG TIỀN TỔ CHỨC',
        highlightColor: '#10B981',
        pillBadge: 'QUAN SÁT CHẶT'
      }, 12, code)
    ];
  }

  // Đảm bảo đủ 13 slides
  while (parsedSlides.length < 13) {
    const idx = parsedSlides.length;
    parsedSlides.push(normalizeSlideData({
      slide: idx + 1,
      type: idx % 2 === 0 ? 'checklist_card' : 'big_metric_stat',
      badge: 'PHÂN TÍCH BỔ SUNG',
      headline: `TÁC ĐỘNG TỚI DÒNG TIỀN ${code}`,
      voiceText: `Thông tin này tiếp tục thu hút sự quan tâm lớn của các nhà đầu tư trên thị trường.`
    }, idx, code));
  }

  const firstSentence = cleanText.split(/[\n\.\!\?]/)[0].trim();
  const videoTitle = firstSentence.length > 10 && firstSentence.length < 80 
    ? firstSentence 
    : `Tin Nóng ${code} - ${firstSentence.slice(0, 60)}...`;

  return {
    id: 'camp-' + code.toLowerCase() + '-' + Date.now(),
    stock_code: code,
    sector: 'Phân Tích Tin Tức Thực Tế',
    sector_badge: 'NỘI DUNG TỰ TẠO',
    title: videoTitle,
    news_source: 'Nội Dung Gửi Lên / CafeF',
    created_at: new Date().toISOString(),
    status: 'ready',
    duration_seconds: 42,
    slides: parsedSlides.slice(0, 13)
  };
}

// Giữ tương thích ngược với code cũ
export async function generate13SlideCampaignWithGemini(stockCode, newsContext = '') {
  return generateVideoFromUserContent({ stockCode, contentText: newsContext || `Phân tích dòng tiền và triển vọng kỹ thuật cổ phiếu ${stockCode}` });
}
