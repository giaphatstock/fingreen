import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from './Navbar'

export default function Layout({ children }) {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950">
      {profile?.is_banned && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-2 text-sm font-semibold">
          ⛔ Tài khoản của bạn đã bị khóa. Lý do: {profile.ban_reason || 'Vi phạm điều khoản sử dụng'}
        </div>
      )}
      <Navbar />
      <main className={`pt-16 ${profile?.is_banned ? 'pt-24' : 'pt-16'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
