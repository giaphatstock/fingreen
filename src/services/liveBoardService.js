/**
 * Dịch vụ cung cấp dữ liệu Bảng Điện Chứng Khoán Realtime Không Độ Trễ
 * Kết nối dữ liệu tốc độ cao sub-100ms, hỗ trợ VN30, HOSE, HNX, UPCOM và các nhóm ngành.
 */

// Danh sách các chỉ số thị trường
export const MARKET_INDICES = [
  { id: '10', code: 'VNINDEX', name: 'VN-Index', floor: 'HOSE' },
  { id: '11', code: 'VN30', name: 'VN30-Index', floor: 'HOSE' },
  { id: '02', code: 'HNX', name: 'HNX-Index', floor: 'HNX' },
  { id: '03', code: 'UPCOM', name: 'UPCoM-Index', floor: 'UPCOM' },
];

// Danh mục cổ phiếu VN30 chuẩn
export const VN30_STOCKS = [
  'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG',
  'MBB', 'MSN', 'MWG', 'PLX', 'POW', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
  'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE'
];

// Danh mục cổ phiếu HOSE tiêu biểu (Top thanh khoản & vốn hóa)
export const HOSE_POPULAR = [
  'SSI', 'HPG', 'FPT', 'VHM', 'VIC', 'VNM', 'MWG', 'VCB', 'TCB', 'MBB',
  'VIX', 'VND', 'HCM', 'VCI', 'DXG', 'DIG', 'PDR', 'NVL', 'GEX', 'KBC',
  'HSG', 'NKG', 'DGC', 'PVD', 'PVT', 'DCM', 'DPM', 'FRT', 'VHC', 'KDH',
  'NLG', 'PC1', 'REE', 'CII', 'TCH', 'BCG', 'HDC', 'SZC', 'HAH', 'GMD',
  'EIB', 'LPB', 'MSB', 'OCB', 'STB', 'ACB', 'BID', 'CTG', 'HDB', 'SHB'
];

// Danh mục cổ phiếu HNX / HNX30 tiêu biểu
export const HNX_POPULAR = [
  'SHS', 'PVS', 'IDC', 'CEO', 'MBS', 'HUT', 'TNG', 'BVS', 'VCS', 'LAS',
  'VGS', 'PVC', 'DTD', 'IDJ', 'APS', 'NBC', 'PVB', 'TVD', 'NRC', 'CAP'
];

// Danh mục UPCOM tiêu biểu
export const UPCOM_POPULAR = [
  'BSR', 'VGI', 'QNS', 'ACV', 'MCH', 'VEA', 'C4G', 'DDV', 'SBS', 'OIL',
  'DRI', 'VTP', 'ABB', 'BVB', 'CST', 'MSR', 'NAB', 'PAS', 'PGB', 'VAB'
];

// Phân nhóm ngành chuyên sâu
export const SECTORS = [
  {
    id: 'bank',
    name: 'Ngân hàng',
    icon: 'Landmark',
    stocks: ['VCB', 'BID', 'CTG', 'TCB', 'MBB', 'VPB', 'ACB', 'STB', 'HDB', 'SHB', 'VIB', 'TPB', 'LPB', 'MSB', 'OCB', 'EIB', 'SSB', 'NAB', 'ABB', 'BAB', 'BVB', 'VAB']
  },
  {
    id: 'securities',
    name: 'Chứng khoán',
    icon: 'TrendingUp',
    stocks: ['SSI', 'VND', 'VIX', 'HCM', 'SHS', 'VCI', 'MBS', 'FTS', 'BSI', 'CTS', 'AGR', 'ORS', 'VDS', 'TVS', 'DSC', 'APG', 'AAS', 'TCI']
  },
  {
    id: 'realestate',
    name: 'Bất động sản',
    icon: 'Building2',
    stocks: ['VHM', 'VIC', 'VRE', 'DXG', 'DIG', 'PDR', 'NVL', 'CEO', 'KDH', 'NLG', 'KBC', 'IDC', 'TCH', 'SZC', 'HDC', 'CII', 'NHA', 'HQC', 'CRE', 'BCG']
  },
  {
    id: 'steel',
    name: 'Thép & VLXD',
    icon: 'Hammer',
    stocks: ['HPG', 'HSG', 'NKG', 'VGS', 'TLH', 'SMC', 'HT1', 'BCC', 'POM']
  },
  {
    id: 'energy',
    name: 'Dầu khí & Điện',
    icon: 'Flame',
    stocks: ['GAS', 'PVD', 'PVS', 'BSR', 'PLX', 'POW', 'PC1', 'REE', 'GEG', 'PVT', 'PVC', 'PVB', 'HDG']
  },
  {
    id: 'retail',
    name: 'Bán lẻ & Tiêu dùng',
    icon: 'ShoppingBag',
    stocks: ['MWG', 'MSN', 'VNM', 'PNJ', 'FRT', 'DGW', 'SAB', 'PET', 'DBC', 'BAF', 'HAG', 'MCH']
  },
  {
    id: 'tech',
    name: 'Công nghệ & VT',
    icon: 'Cpu',
    stocks: ['FPT', 'CMG', 'ELC', 'FOX', 'VGI', 'CTR', 'SAM', 'ITD']
  },
  {
    id: 'chemicals',
    name: 'Hóa chất & Phân',
    icon: 'FlaskConical',
    stocks: ['DGC', 'DCM', 'DPM', 'BFC', 'CSV', 'LAS', 'DDV']
  },
  {
    id: 'logistics',
    name: 'Cảng biển & Vận tải',
    icon: 'Ship',
    stocks: ['GMD', 'HAH', 'VOS', 'PVT', 'VSC', 'VIP', 'VNA', 'SGP', 'PHP']
  },
  {
    id: 'agri',
    name: 'Thủy sản & Nông nghiệp',
    icon: 'Fish',
    stocks: ['VHC', 'ANV', 'IDI', 'FMC', 'PAN', 'ASM', 'HNG']
  }
];

// Tên đầy đủ công ty phổ biến để hiển thị thân thiện
export const COMPANY_NAMES = {
  'SSI': 'Chứng khoán SSI',
  'HPG': 'Tập đoàn Hòa Phát',
  'FPT': 'Tập đoàn FPT',
  'VCB': 'Vietcombank',
  'TCB': 'Techcombank',
  'MBB': 'Ngân hàng Quân Đội',
  'VNM': 'Vinamilk',
  'MWG': 'Thế Giới Di Động',
  'VIC': 'Tập đoàn Vingroup',
  'VHM': 'Vinhomes',
  'VRE': 'Vincom Retail',
  'MSN': 'Tập đoàn Masan',
  'GAS': 'Tổng Công ty Khí VN',
  'VND': 'Chứng khoán VNDIRECT',
  'VIX': 'Chứng khoán VIX',
  'HCM': 'Chứng khoán TP.HCM (HSC)',
  'VCI': 'Chứng khoán Vietcap',
  'SHS': 'Chứng khoán Sài Gòn - HN',
  'DXG': 'Tập đoàn Đất Xanh',
  'DIG': 'Tổng Công ty DIC Corp',
  'PDR': 'Bất động sản Phát Đạt',
  'NVL': 'Tập đoàn Novaland',
  'CEO': 'Tập đoàn C.E.O',
  'KBC': 'Đô thị Kinh Bắc',
  'IDC': 'Tổng Công ty IDICO',
  'HSG': 'Tập đoàn Hoa Sen',
  'NKG': 'Thép Nam Kim',
  'DGC': 'Hóa chất Đức Giang',
  'PVD': 'Khoan Dầu khí PVD',
  'PVS': 'Dịch vụ Kỹ thuật Dầu khí',
  'BSR': 'Lọc hóa dầu Bình Sơn',
  'PLX': 'Tập đoàn Xăng dầu Petrolimex',
  'POW': 'Điện lực Dầu khí VN',
  'FRT': 'Bán lẻ FPT (Long Châu)',
  'DGW': 'Thế Giới Số (Digiworld)',
  'PNJ': 'Vàng bạc Phú Nhuận',
  'GMD': 'Gemadept',
  'HAH': 'Vận tải Hải An',
  'VOS': 'Vận tải biển VN',
  'STB': 'Ngân hàng Sacombank',
  'ACB': 'Ngân hàng Á Châu',
  'BID': 'Ngân hàng BIDV',
  'CTG': 'VietinBank',
  'VPB': 'VPBank',
  'HDB': 'HDBank',
  'SHB': 'Ngân hàng SHB',
  'VIB': 'Ngân hàng VIB',
  'TPB': 'TPBank',
  'LPB': 'LPBank',
  'SAB': 'Sabeco',
  'GVR': 'Cao su Việt Nam',
  'PLX': 'Petrolimex',
  'BCM': 'Becamex IDC',
  'BVH': 'Bảo Việt',
  'SSB': 'SeABank',
  'VJC': 'Vietjet Air',
  'VGI': 'Viettel Global',
  'ACV': 'Cảng hàng không VN',
  'MCH': 'Masan Consumer',
  'QNS': 'Đường Quảng Ngãi',
  'VEA': 'Máy động lực VN'
};

const DATA_API_BASE = 'https://bgapidatafeed.vps.com.vn';

/**
 * Lấy dữ liệu các chỉ số chính (VN-Index, VN30, HNX, UPCOM)
 */
export async function fetchMarketIndices() {
  try {
    const res = await fetch(`${DATA_API_BASE}/getlistindexdetail/10,11,02,03`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => {
      if (!item) return null;
      const meta = MARKET_INDICES[index] || { code: item.hashValue, name: 'Chỉ số', floor: '' };
      
      // Parse trường ot: "8.00|0.47%|601652.663|80|142|57"
      // [0]: Điểm thay đổi, [1]: % thay đổi, [2]: Giá trị (triệu), [3]: Số mã giảm, [4]: Số mã tăng, [5]: Số mã đứng giá
      const parts = (item.ot || '').split('|');
      const pointChange = parseFloat(parts[0]) || 0;
      const percentChange = parseFloat((parts[1] || '0').replace('%', '')) || 0;
      const valueBillion = parts[2] ? (parseFloat(parts[2]) / 1000).toFixed(1) : '0';
      const countDecrease = parseInt(parts[3]) || 0;
      const countIncrease = parseInt(parts[4]) || 0;
      const countUnchanged = parseInt(parts[5]) || 0;

      const currentPoint = item.cIndex || item.oIndex || 0;
      const openPoint = item.oIndex || currentPoint;

      return {
        id: item.hashValue || meta.id,
        code: meta.code,
        name: meta.name,
        floor: meta.floor,
        currentPoint: currentPoint,
        openPoint: openPoint,
        pointChange,
        percentChange,
        totalVolume: item.vol || 0,
        totalValueBillion: valueBillion,
        countIncrease,
        countDecrease,
        countUnchanged,
        time: item.time || '',
        status: item.status || 'O' // O = Open, C = Closed
      };
    }).filter(Boolean);
  } catch (error) {
    console.warn('Lỗi nạp chỉ số thị trường:', error.message);
    return [];
  }
}

/**
 * Tách 3 thành phần của 1 bước giá VPS: "19.7|24300|d" -> { price, volume, type }
 */
export function parsePriceStep(stepStr) {
  if (!stepStr || typeof stepStr !== 'string') return { price: 0, volume: 0, type: '' };
  const [p, v, t] = stepStr.split('|');
  return {
    price: parseFloat(p) || 0,
    volume: parseInt(v, 10) || 0,
    type: t || ''
  };
}

/**
 * Chuẩn hóa 1 bản ghi cổ phiếu từ API thành dạng dữ liệu trực quan
 */
export function formatStockData(raw) {
  if (!raw || !raw.sym) return null;

  const ceiling = raw.c || 0;
  const floor = raw.f || 0;
  const ref = raw.r || 0;
  const matchedPrice = raw.lastPrice || 0;
  const matchedVolume = raw.lastVolume || 0;
  const totalVolume = raw.lot ? raw.lot * 10 : 0; // Đổi lot sang số lượng CP chuẩn

  const change = parseFloat(raw.ot) || 0;
  const changePercent = parseFloat(raw.changePc) || 0;

  // Xác định trạng thái màu sắc: tím (trần), xanh lá (tăng), vàng (tham chiếu), đỏ (giảm), xanh lơ (sàn)
  let statusColor = 'ref'; // 'ceiling' | 'floor' | 'up' | 'down' | 'ref'
  if (matchedPrice >= ceiling && ceiling > 0) {
    statusColor = 'ceiling';
  } else if (matchedPrice <= floor && floor > 0) {
    statusColor = 'floor';
  } else if (matchedPrice > ref) {
    statusColor = 'up';
  } else if (matchedPrice < ref && matchedPrice > 0) {
    statusColor = 'down';
  } else {
    statusColor = 'ref';
  }

  // 3 bước giá mua (Bid: g1, g2, g3)
  const bid1 = parsePriceStep(raw.g1);
  const bid2 = parsePriceStep(raw.g2);
  const bid3 = parsePriceStep(raw.g3);

  // 3 bước giá bán (Ask: g4, g5, g6)
  const ask1 = parsePriceStep(raw.g4);
  const ask2 = parsePriceStep(raw.g5);
  const ask3 = parsePriceStep(raw.g6);

  return {
    symbol: raw.sym,
    name: COMPANY_NAMES[raw.sym] || raw.sym,
    ceiling,
    floor,
    ref,
    matchedPrice,
    matchedVolume,
    change,
    changePercent,
    statusColor,
    totalVolume,
    highPrice: parseFloat(raw.highPrice) || 0,
    lowPrice: parseFloat(raw.lowPrice) || 0,
    avgPrice: parseFloat(raw.avePrice) || 0,
    openPrice: parseFloat(raw.openPrice) || 0,
    bid1,
    bid2,
    bid3,
    ask1,
    ask2,
    ask3,
    foreignBuy: parseInt(raw.fBVol, 10) || 0,
    foreignSell: parseInt(raw.fSVolume, 10) || 0,
    foreignRoom: parseFloat(raw.fRoom) || 0,
    raw
  };
}

/**
 * Lấy dữ liệu danh sách cổ phiếu realtime theo danh sách mã
 */
export async function fetchStockBatch(symbolArray) {
  if (!symbolArray || symbolArray.length === 0) return [];
  
  // Lọc trùng và chuẩn hóa
  const cleanSymbols = [...new Set(symbolArray.map(s => s.toUpperCase().trim()))].filter(Boolean);
  const url = `${DATA_API_BASE}/getliststockdata/${cleanSymbols.join(',')}`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map(formatStockData).filter(Boolean);
  } catch (error) {
    console.warn('Lỗi nạp batch cổ phiếu:', error.message);
    return [];
  }
}

/**
 * Helper định dạng số với dấu phân cách hàng ngàn
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  if (num === 0) return '0';
  return Number(num).toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Helper định dạng giá (Chia 1,000 nếu hiển thị dạng nghìn đồng như bảng giá tiêu chuẩn)
 */
export function formatPrice(price) {
  if (!price || price === 0) return '-';
  return Number(price).toFixed(2);
}

/**
 * Lấy class CSS màu sắc fintech chuẩn sàn CK Việt Nam
 */
export function getPriceColorClass(price, ref, ceiling, floor) {
  if (!price || price === 0) return 'text-[var(--text-muted)]';
  if (ceiling && price >= ceiling) return 'text-purple-400 font-bold'; // Giá Trần (Tím)
  if (floor && price <= floor) return 'text-cyan-400 font-bold'; // Giá Sàn (Xanh lơ)
  if (price > ref) return 'text-emerald-400 font-semibold'; // Tăng giá (Xanh lá)
  if (price < ref) return 'text-rose-400 font-semibold'; // Giảm giá (Đỏ)
  return 'text-amber-300 font-semibold'; // Tham chiếu (Vàng)
}
