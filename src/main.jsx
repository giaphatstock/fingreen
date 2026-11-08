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
import AIAssistantPage from './pages/AIAssistantPage'
import GreenSmartOnePage from './pages/GreenSmartOnePage'
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
              src="/favicon.png" 
              alt="FinGreen" 
              className="w-16 h-16 rounded-2xl shadow-xl animate-pulse" 
            />
          </div>
          <p className="text-primary-400 font-semibold animate-pulse text-sm">FinGreen đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Trang Đăng Nhập / Đăng Ký riêng biệt full màn hình, đồng bộ màu 100% */}
      <Route path="/dang-nhap" element={
        <PublicAuthRoute>
          <AuthPage />
        </PublicAuthRoute>
      } />

      {/* Các trang chính có Navbar và Footer */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<NewsPage />} />
            <Route path="/greensmartone" element={<GreenSmartOnePage />} />
            <Route path="/green-smart-one" element={<GreenSmartOnePage />} />
            <Route path="/bai-viet/:id" element={<PostDetailPage />} />
            <Route path="/hop-tac" element={<PartnerPage />} />
            
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
            <Route path="/ai" element={
              <ProtectedRoute>
                <AIAssistantPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
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
