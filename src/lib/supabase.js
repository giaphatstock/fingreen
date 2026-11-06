import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Lấy giờ Hà Nội
export const getHanoiTime = () => {
  return new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getHanoiISOString = () => {
  const now = new Date()
  const hanoiOffset = 7 * 60 // UTC+7 in minutes
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utcMs + hanoiOffset * 60000).toISOString()
}
