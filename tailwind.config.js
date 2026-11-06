/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5154F0',
          dark: '#8587F4',
          medium: '#7D7FF4',
          light: '#A8AAF8',
          50: '#EEEEFF',
          100: '#DDDEFF',
          200: '#BBBDFE',
          300: '#A8AAF8',
          400: '#7D7FF4',
          500: '#5154F0',
          600: '#3D40E8',
          700: '#2D30D6',
          800: '#2224B4',
          900: '#191B8A',
        },
        fingreen: {
          yellow: '#F5A623',
          green: '#2D6A4F',
          dark: '#1A1A2E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
