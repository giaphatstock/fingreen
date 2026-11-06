import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/auth/AuthPage'
import Layout from './components/layout/Layout'
import NewsPage from './pages/NewsPage'
import CreatePostPage from './pages/CreatePostPage'
import AdminPage from './pages/AdminPage'
import PartnerPage from './pages/PartnerPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import './index.css'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-slow">
              <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-md" />
          </div>
          <p className="text-primary-400 font-semibold animate-pulse">FinGreen đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<NewsPage />} />
        <Route path="/bai-viet/:id" element={<PostDetailPage />} />
        <Route path="/dang-bai" element={<CreatePostPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/hop-tac" element={<PartnerPage />} />
        <Route path="/ho-so" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
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
    </BrowserRouter>
  </React.StrictMode>
)
