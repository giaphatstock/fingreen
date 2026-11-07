import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthPage from './components/auth/AuthPage'
import Layout from './components/layout/Layout'
import NewsPage from './pages/NewsPage'
import CreatePostPage from './pages/CreatePostPage'
import AdminPage from './pages/AdminPage'
import PartnerPage from './pages/PartnerPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/dang-nhap" replace />
  return children
}

function PublicAuthRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <img 
              src="/logo.png" 
              alt="FinGreen" 
              className="w-20 h-auto rounded-2xl shadow-2xl animate-pulse" 
            />
          </div>
          <p className="text-primary-400 font-semibold animate-pulse text-sm">FinGreen đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        {/* Khách vãng lai và thành viên đều vào được */}
        <Route path="/" element={<NewsPage />} />
        <Route path="/bai-viet/:id" element={<PostDetailPage />} />
        <Route path="/hop-tac" element={<PartnerPage />} />
        
        {/* Đăng nhập / Đăng ký */}
        <Route path="/dang-nhap" element={
          <PublicAuthRoute>
            <AuthPage />
          </PublicAuthRoute>
        } />

        {/* Các trang yêu cầu đăng nhập */}
        <Route path="/dang-bai" element={
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/ho-so" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#5154F0', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' }
              }
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
