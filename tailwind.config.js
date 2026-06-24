/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // COVO brand palette (from the CRM + logo)
        covo: {
          blue:   '#5BE0EF',
          pink:   '#E8196A',
          gold:   '#F0A500',
          teal:   '#00C9A7',
        },
        bg: {
          base:    '#0D1117',
          sidebar: '#141720',
          card:    '#1A1E2E',
          hover:   '#1E2336',
        },
        line:  '#2D3345',
        ink: {
          DEFAULT: '#E2E8F0',
          muted:   '#94A3B8',
          faint:   '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
