import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0e0e0e',
        surface: '#111111',
        border:  '#1e1e1e',
        accent:  '#c8a94a',
        primary: '#f0ede6',
        muted:   '#555555',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        label: ['10px', { letterSpacing: '0.12em', fontWeight: '500' }],
      },
      borderWidth: {
        DEFAULT: '0.5px',
        '1':     '1px',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
