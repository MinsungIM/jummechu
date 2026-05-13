// 디자인 토큰은 mock_uiux/jummechu.pen 의 variables 기반
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface
        ground: '#FAFAF6',          // 메인 베이지 배경
        surface: {
          primary: '#FFFFFF',
          secondary: '#F4F4F2',
          inverse: '#111827',
        },
        // Foreground
        ink: {
          DEFAULT: '#1F2937',       // foreground-primary
          secondary: '#6B7280',     // foreground-secondary
          muted: '#9CA3AF',         // foreground-muted
          inverse: '#FFFFFF',       // foreground-inverse
        },
        // Accent
        accent: {
          primary: '#FACC15',       // yellow (active states, time_chip)
          onPrimary: '#1F2937',     // accent 위의 텍스트
          blue: '#0EA5E9',
        },
        // Category (한·중·일·양)
        category: {
          han: '#EF4444',           // 한식
          jung: '#F59E0B',          // 중식
          il: '#10B981',            // 일식
          yang: '#6366F1',          // 양식
        },
        // Border / Hairline
        border: {
          subtle: '#E5E7EB',
          hairline: '#F3F4F6',
        },
        // Gradient (장식)
        gradient: {
          coral: '#FDA4AF',
          magenta: '#F9A8D4',
          orange: '#FDBA74',
          violet: '#C4B5FD',
          violetDeep: '#7C3AED',
        },
      },
      borderRadius: {
        lg: '10px',
        xl: '15px',
        '2xl': '20px',
        '3xl': '30px',
        pill: '100px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04)',
        tab: '0 2px 12px rgba(0,0,0,0.10)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
