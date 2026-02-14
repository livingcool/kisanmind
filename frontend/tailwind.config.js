/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Agricultural theme colors
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#faf8f3',
          100: '#f5f0e6',
          200: '#e8dcc4',
          300: '#d4bc8f',
          400: '#c09856',
          500: '#a67c3a',
          600: '#8b6331',
          700: '#6f4e2a',
          800: '#5e4227',
          900: '#4f3823',
        },
        water: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      animation: {
        'audio-bar-1': 'audio-bar-1 0.8s ease-in-out infinite',
        'audio-bar-2': 'audio-bar-2 0.6s ease-in-out infinite',
        'audio-bar-3': 'audio-bar-3 0.9s ease-in-out infinite',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        'audio-bar-1': {
          '0%, 100%': { height: '0.75rem' },
          '50%': { height: '1.25rem' },
        },
        'audio-bar-2': {
          '0%, 100%': { height: '1rem' },
          '50%': { height: '0.5rem' },
        },
        'audio-bar-3': {
          '0%, 100%': { height: '0.5rem' },
          '50%': { height: '1rem' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
