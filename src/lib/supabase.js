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

// Client không lưu session dùng để truy vấn dữ liệu công khai (tác giả bài viết, thông tin chung)
// mà không bị giới hạn bởi RLS "auth.uid() = id" khi một user bình thường đăng nhập
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
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

/**
 * Upload file lên Supabase Storage bucket 'fingreen-media'
 * @param {File} file - File ảnh từ máy
 * @param {string} folder - Thư mục lưu trữ (ví dụ: 'covers', 'avatars', 'posts')
 * @returns {Promise<string>} publicUrl của file đã upload
 */
export const uploadMedia = async (file, folder = 'uploads') => {
  if (!file) throw new Error('Không có file để tải lên')

  // Tạo tên file unique
  const ext = file.name.split('.').pop()
  const randomStr = Math.random().toString(36).substring(2, 9)
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 20)
  const filePath = `${folder}/${Date.now()}_${cleanName}_${randomStr}.${ext}`

  const { data, error } = await supabase.storage
    .from('fingreen-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    throw error
  }

  const { data: publicData } = supabase.storage
    .from('fingreen-media')
    .getPublicUrl(filePath)

  return publicData.publicUrl
}

/**
 * Cập nhật động thẻ meta OpenGraph cho Facebook, Zalo, Twitter khi vào bài viết
 */
export const updateMetaTags = ({ title, description, image, url }) => {
  if (title) {
    document.title = `${title} | FinGreen`
    setMeta('property', 'og:title', title)
    setMeta('name', 'twitter:title', title)
  }
  if (description) {
    const cleanDesc = description.replace(/<[^>]*>/g, '').slice(0, 180)
    setMeta('name', 'description', cleanDesc)
    setMeta('property', 'og:description', cleanDesc)
    setMeta('name', 'twitter:description', cleanDesc)
  }
  if (image) {
    setMeta('property', 'og:image', image)
    setMeta('name', 'twitter:image', image)
  }
  if (url) {
    setMeta('property', 'og:url', url)
  }
}

function setMeta(keyType, keyName, value) {
  let element = document.querySelector(`meta[${keyType}="${keyName}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(keyType, keyName)
    document.head.appendChild(element)
  }
  element.setAttribute('content', value)
}
