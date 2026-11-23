import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

// Helper nhận diện thiết bị & hệ điều hành người dùng
export function detectUserDevice() {
  if (typeof window === 'undefined' || !navigator) {
    return { deviceType: 'Unknown', os: 'Unknown', browser: 'Unknown', summary: 'Không xác định' };
  }
  const ua = navigator.userAgent || '';
  let deviceType = 'Desktop';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  let os = 'Khác';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/ipad/i.test(ua)) os = 'iPad (iPadOS)';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Khác';
  if (/chrome|crios/i.test(ua) && !/edg|opr/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/coc_coc_browser/i.test(ua)) browser = 'Cốc Cốc';
  else if (/zalo/i.test(ua)) browser = 'Zalo App';

  const icon = deviceType === 'Mobile' ? '📱' : deviceType === 'Tablet' ? '📟' : '💻';
  const summary = `${icon} ${os} • ${browser}`;

  return { deviceType, os, browser, summary };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cập nhật thời gian truy cập gần nhất, thiết bị và IP người dùng
  const recordUserActivity = async (userId) => {
    if (!userId) return;
    try {
      const dev = detectUserDevice();
      const now = new Date().toISOString();
      let clientIp = null;
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientIp = ipData.ip;
        }
      } catch (_) {}

      const updatePayload = {
        last_seen_at: now,
        last_device: dev.summary,
        device_info: {
          ...dev,
          ip: clientIp || undefined,
          userAgent: (navigator.userAgent || '').slice(0, 250),
          screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
          updatedAt: now
        }
      };
      if (clientIp) {
        updatePayload.last_ip = clientIp;
      }

      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);
      if (error) console.warn('[AuthContext] Không thể cập nhật activity:', error.message);
    } catch (e) {
      // Non-blocking error
    }
  };

  const fetchProfile = async (userId, userObj = null) => {
    if (!userId) { setProfile(null); return }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!error && data) {
        setProfile(data)
        recordUserActivity(userId)
      } else {
        // Nếu trigger chưa tạo kịp, tạo ngay profile
        const dev = detectUserDevice();
        const newProfile = {
          id: userId,
          email: userObj?.email || user?.email || '',
          full_name: userObj?.user_metadata?.full_name || 'Người dùng',
          role: 'guest',
          is_approved: false,
          is_banned: false,
          last_seen_at: new Date().toISOString(),
          last_device: dev.summary
        }
        const { error: upsertErr } = await supabase.from('profiles').upsert(newProfile)
        if (upsertErr) console.warn('[AuthContext] Lỗi tạo profile mới:', upsertErr.message)
        setProfile(newProfile)
      }
    } catch (err) {
      console.warn('Lỗi fetchProfile:', err)
    }
  }

  useEffect(() => {
    // Timeout an toàn: Đảm bảo không bao giờ bị đơ màn hình đen nếu Supabase phản hồi chậm
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(safetyTimer)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => {
      clearTimeout(safetyTimer)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          // BƯỚC 8: Chỉ gọi fetchProfile khi SIGNED_IN hoặc USER_UPDATED, KHÔNG gọi khi TOKEN_REFRESHED
          if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
            await fetchProfile(currentUser.id, currentUser)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.warn('[AuthContext] Lỗi đăng xuất:', error.message)
    } catch (e) {
      console.warn('[AuthContext] Ngoại lệ đăng xuất:', e)
    } finally {
      setUser(null)
      setProfile(null)
    }
  }

  const refreshProfile = () => fetchProfile(user?.id)

  const isAdmin = profile?.role === 'admin_fingreen'
  const isPartner = profile?.role === 'doi_tac' || profile?.role === 'cong_tac_vien'
  const canPost = (isAdmin || isPartner) && profile?.is_approved && !profile?.is_banned
  const isBanned = profile?.is_banned

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signOut, refreshProfile,
      isAdmin, isPartner, canPost, isBanned
    }}>
      {children}
    </AuthContext.Provider>
  )
}
