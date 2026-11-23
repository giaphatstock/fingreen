import { supabase } from '../lib/supabase';

export const DEFAULT_SYSTEM_TABS = [
  {
    id: 'greensmartone',
    name: 'GreenSmartOne PRO',
    path: '/greensmartone',
    description: 'Hệ thống AI & Tín hiệu dòng tiền thông minh',
    is_visible: true,
    is_maintenance: false,
    maintenance_title: 'GreenSmartOne PRO Đang Bảo Trì Nâng Cấp',
    maintenance_message: 'Hệ thống thuật toán dòng tiền GreenSmartOne đang được tối ưu hóa dữ liệu. Cảm ơn bạn đã kiên nhẫn!',
    maintenance_estimated_end: null
  },
  {
    id: 'bang_dien',
    name: 'Bảng Điện Live OMS',
    path: '/bang-dien',
    description: 'Bảng điện chứng khoán thông minh thời gian thực',
    is_visible: true,
    is_maintenance: false,
    maintenance_title: 'Bảng Điện Đang Bảo Trì Định Kỳ',
    maintenance_message: 'Hệ thống datafeed bảng điện đang được bảo trì định kỳ để nâng cấp tốc độ truyền tải. Cảm ơn quý khách đã thông cảm!',
    maintenance_estimated_end: null
  },
  {
    id: 'posts',
    name: 'Tin Tức & Phân Tích',
    path: '/',
    description: 'Cổng thông tin & nhận định thị trường',
    is_visible: true,
    is_maintenance: false,
    maintenance_title: 'Tin Tức Đang Bảo Trì',
    maintenance_message: 'Hệ thống máy chủ bài viết đang được bảo trì. Vui lòng quay lại sau!',
    maintenance_estimated_end: null
  },
  {
    id: 'partner',
    name: 'Hợp Tác FinGreen',
    path: '/hop-tac',
    description: 'Cổng đăng ký & quản lý Đối tác / Cộng tác viên',
    is_visible: true,
    is_maintenance: false,
    maintenance_title: 'Cổng Hợp Tác Đang Bảo Trì',
    maintenance_message: 'Hệ thống tiếp nhận hồ sơ đối tác đang tạm dừng nâng cấp. Cảm ơn quý đối tác!',
    maintenance_estimated_end: null
  },
  {
    id: 'ai',
    name: 'FinGreen AI',
    path: '/ai',
    description: 'Trợ lý AI phân tích và giải đáp chứng khoán',
    is_visible: true,
    is_maintenance: false,
    maintenance_title: 'FinGreen AI Đang Nâng Cấp Mô Hình',
    maintenance_message: 'Hệ thống trí tuệ nhân tạo đang nạp mô hình dữ liệu mới. Cảm ơn bạn đã kiên nhẫn!',
    maintenance_estimated_end: null
  }
];

const CACHE_KEY = 'fingreen_system_tabs_cache';

/**
 * Lấy danh sách cấu hình tab từ Supabase (có fallback sang local cache)
 */
export async function getSystemTabs() {
  try {
    const { data, error } = await supabase
      .from('system_tabs')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Lỗi lấy system_tabs từ Supabase:', err);
  }

  // Fallback cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_) {}
  }

  return DEFAULT_SYSTEM_TABS;
}

/**
 * Cập nhật cấu hình 1 tab (chỉ Admin)
 */
export async function updateSystemTab(tabId, updates) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('system_tabs')
      .update(payload)
      .eq('id', tabId)
      .select();

    if (error) {
      console.error('[systemTabService] Lỗi update:', error);
      return { success: false, error };
    }

    // Cập nhật lại cache cục bộ
    const current = await getSystemTabs();
    const next = current.map(t => (t.id === tabId ? { ...t, ...payload } : t));
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));

    return { success: true, data: data?.[0] };
  } catch (err) {
    console.error('[systemTabService] Ngoại lệ update:', err);
    return { success: false, error: err };
  }
}

/**
 * Kiểm tra xem 1 đường dẫn hoặc mã tab có đang bảo trì không
 */
export function checkTabMaintenance(tabs, pathOrId) {
  if (!tabs || !Array.isArray(tabs)) return null;
  const found = tabs.find(t => t.id === pathOrId || t.path === pathOrId || (t.path !== '/' && pathOrId.startsWith(t.path)));
  if (found && found.is_maintenance) {
    return found;
  }
  return null;
}
