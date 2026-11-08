import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import Navbar from './Navbar'
import FinGreenRobot from '../ai/FinGreenRobot'
import { TrendingUp, ShieldCheck, Award, Heart } from 'lucide-react'

export default function Layout({ children }) {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const logoSrc = isLight ? '/logo-horizontal-light.png' : '/logo-horizontal-dark.png'

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
      {profile?.is_banned && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-2 text-sm font-semibold shadow-lg">
          ⛔ Tài khoản của bạn đã bị tạm khóa. Lý do: {profile.ban_reason || 'Vi phạm điều khoản cộng đồng'}
        </div>
      )}
      <Navbar />
      
      <main className={`flex-1 pt-16 ${profile?.is_banned ? 'pt-24' : 'pt-16'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Footer FinGreen */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] mt-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Logo & Slogan */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="inline-block py-1">
                <img
                  src={logoSrc}
                  alt="FinGreen - Kiến tạo giá trị thực"
                  className="h-11 sm:h-12 w-auto object-contain hover:scale-105 transition-transform drop-shadow-sm"
                />
              </Link>
              <p className="text-sm text-[var(--text-muted)] max-w-md leading-relaxed">
                Nền tảng phân tích tài chính chứng khoán chuyên sâu, cung cấp dữ liệu thị trường, nhận định khách quan và kết nối các chuyên gia, đối tác IB uy tín hàng đầu.
              </p>
              <div className="flex items-center gap-3 pt-2">
                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@fingreenvn?_r=1&_t=ZS-9BCMKxpo7yT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] hover:bg-black hover:text-white flex items-center justify-center transition-all border border-[var(--border-color)]"
                  title="TikTok FinGreen"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.5V8.85a8.28 8.28 0 0 0 5.21 1.84V7.24a4.84 4.84 0 0 1-1.3-.55z"/>
                  </svg>
                </a>
                {/* YouTube */}
                <a
                  href="https://m.youtube.com/@greeninvestmentvn?si=-4DoUDMlBDVCRIOi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-[var(--border-color)]"
                  title="YouTube Green Investment"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Col 2: Liên kết nhanh */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                Chuyên Mục
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-primary-400 transition-colors">Tin Tức & Phân Tích</Link></li>
                <li><Link to="/hop-tac" className="hover:text-primary-400 transition-colors">Đối Tác IB & CTV</Link></li>
                <li><Link to="/dang-bai" className="hover:text-primary-400 transition-colors">Đăng Bài Viết</Link></li>
                <li><Link to="/ho-so" className="hover:text-primary-400 transition-colors">Tài Khoản Cá Nhân</Link></li>
              </ul>
            </div>

            {/* Col 3: Cam kết */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                Giá Trị Cốt Lõi
              </h4>
              <ul className="space-y-2 text-xs text-[var(--text-muted)]">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Dữ liệu minh bạch, chuẩn xác</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <span>Đội ngũ phân tích giàu kinh nghiệm</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span>Đồng hành tăng trưởng bền vững</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span>© {new Date().getFullYear()} FinGreen. Kiến Tạo Giá Trị Thực. Mọi quyền được bảo lưu.</span>
              <a
                href="//www.dmca.com/Protection/Status.aspx?ID=c6d8e8c8-1e5c-42a7-82a4-4fdc39266148"
                title="DMCA.com Protection Status"
                className="dmca-badge inline-flex items-center hover:opacity-85 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://images.dmca.com/Badges/DMCA_logo-grn-btn180w.png?ID=c6d8e8c8-1e5c-42a7-82a4-4fdc39266148"
                  alt="DMCA.com Protection Status"
                  className="h-5 sm:h-5.5 w-auto object-contain"
                />
              </a>
            </div>
            <p className="flex items-center gap-1 text-center md:text-right">
              Phát triển với sự tận tâm dành cho nhà đầu tư Việt Nam
            </p>
          </div>
        </div>
      </footer>

      {/* Con robot tròn di chuyển & Chatbot FinGreen AI */}
      <FinGreenRobot />
    </div>
  )
}
