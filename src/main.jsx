import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/layout/Layout'
import NewsPage from './pages/NewsPage'
import MaintenanceNotice from './components/common/MaintenanceNotice'
import { getSystemTabs } from './services/systemTabService'
import './index.css'

// Dynamic lazy imports cho toàn bộ các route phụ (giúp Initial Main Bundle < 200kB)
const LiveBoardPage = lazy(() => import('./pages/LiveBoardPage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const PartnerPage = lazy(() => import('./pages/PartnerPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AuthPage = lazy(() => import('./components/auth/AuthPage'))
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const GreenSmartOnePage = lazy(() => import('./pages/GreenSmartOnePage'))
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'))
const StockPanelPage = lazy(() => import('./pages/StockPanelPage'))

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[var(--text-muted)] animate-pulse">Đang tải trang...</p>
      </div>
    </div>
  )
}

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

function MaintenanceRoute({ tabId, children }) {
  const { isAdmin } = useAuth()
  const [tab, setTab] = React.useState(null)

  React.useEffect(() => {
    getSystemTabs().then(tabs => {
      const found = tabs?.find(t => t.id === tabId)
      if (found) setTab(found)
    })
  }, [tabId])

  if (tab && tab.is_maintenance) {
    return (
      <MaintenanceNotice tab={tab} isAdmin={isAdmin}>
        {children}
      </MaintenanceNotice>
    )
  }

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
          <Suspense fallback={<PageLoader />}>
            <AuthPage />
          </Suspense>
        </PublicAuthRoute>
      } />

      {/* Các trang chính có Navbar và Footer */}
      <Route path="/*" element={
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<MaintenanceRoute tabId="posts"><NewsPage /></MaintenanceRoute>} />
              <Route path="/bang-dien" element={<MaintenanceRoute tabId="bang_dien"><LiveBoardPage /></MaintenanceRoute>} />
              <Route path="/bang-gia" element={<MaintenanceRoute tabId="bang_dien"><LiveBoardPage /></MaintenanceRoute>} />
              <Route path="/greensmartone" element={<MaintenanceRoute tabId="greensmartone"><GreenSmartOnePage /></MaintenanceRoute>} />
              <Route path="/green-smart-one" element={<MaintenanceRoute tabId="greensmartone"><GreenSmartOnePage /></MaintenanceRoute>} />
              <Route path="/stock-panel" element={<StockPanelPage />} />
              <Route path="/quant" element={<StockPanelPage />} />
              <Route path="/bai-viet/:id" element={<PostDetailPage />} />
              <Route path="/hop-tac" element={<MaintenanceRoute tabId="partner"><PartnerPage /></MaintenanceRoute>} />
              
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
                  <MaintenanceRoute tabId="ai">
                    <AIAssistantPage />
                  </MaintenanceRoute>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
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
