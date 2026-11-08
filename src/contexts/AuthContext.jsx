import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
      } else {
        // Nếu trigger chưa tạo kịp, tạo ngay profile
        const newProfile = {
          id: userId,
          email: userObj?.email || user?.email || '',
          full_name: userObj?.user_metadata?.full_name || 'Người dùng',
          role: 'guest',
          is_approved: false,
          is_banned: false,
        }
        await supabase.from('profiles').upsert(newProfile)
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
          await fetchProfile(currentUser.id, currentUser)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
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
