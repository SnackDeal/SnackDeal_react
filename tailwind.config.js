/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SnackDeal brand — 따뜻한 캐러멜 오렌지 (SEED carrot 계열 기반)
        brand: {
          50: '#fff2ec',
          100: '#ffe1d1',
          200: '#ffc5a3',
          300: '#ffb999',
          400: '#ff8f4d',
          500: '#ff6600',
          600: '#e14d00',
          700: '#b93901',
          800: '#8a2a00',
          900: '#5a1c00',
        },
        // Neutral scale — 따뜻한 근사 블랙 계열
        ink: {
          50: '#f7f8f9',
          100: '#f3f4f5',
          200: '#eeeff1',
          300: '#dcdee3',
          400: '#b0b3ba',
          500: '#868b94',
          600: '#555d6d',
          700: '#3a4150',
          800: '#242832',
          900: '#1a1c20',
        },
        // 시맨틱
        critical: '#fa342c',
        positive: '#079171',
        info: '#217cf9',
        warning: '#9b7821',
        focus: '#5e98fe',
      },
      borderRadius: {
        lg: '0.625rem',
      },
      boxShadow: {
        s1: '0 1px 4px rgba(0,0,0,0.08)',
        s2: '0 2px 10px rgba(0,0,0,0.10)',
        s3: '0 4px 16px rgba(0,0,0,0.12)',
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          'Roboto',
          '"Noto Sans KR"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
