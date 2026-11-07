import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export const THEMES = [
  {
    id: 'fintech',
    name: 'Tím Fintech',
    desc: 'Màu tím chủ đạo đặc trưng FinGreen',
    icon: '🔮',
    colorPreview: '#5154F0',
    bgPreview: '#0b0d19',
  },
  {
    id: 'dark',
    name: 'Dark Hoàn Toàn',
    desc: 'Đen sâu AMOLED tiết kiệm pin và dịu mắt',
    icon: '🌑',
    colorPreview: '#8587F4',
    bgPreview: '#000000',
  },
  {
    id: 'light',
    name: 'Light Pastel',
    desc: 'Tone sáng tím nhạt sang trọng (#F3ECFB)',
    icon: '☀️',
    colorPreview: '#5154F0',
    bgPreview: '#F3ECFB',
  },
]

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fingreen_theme') || 'fintech'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-fintech', 'theme-dark', 'theme-light')
    root.classList.add(`theme-${theme}`)
    localStorage.setItem('fingreen_theme', theme)
  }, [theme])

  const switchTheme = (newTheme) => {
    if (['fintech', 'dark', 'light'].includes(newTheme)) {
      setTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, switchTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}
