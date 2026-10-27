/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#14213D',
          navyLight: '#1e3059',
          teal: '#0D9488',
          tealDark: '#0f766e',
          tealLight: '#14b8a6',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
        },
        status: {
          present: '#16A34A',
          presentBg: '#DCFCE7',
          absent: '#DC2626',
          absentBg: '#FEE2E2',
          late: '#D97706',
          lateBg: '#FEF3C7',
          leave: '#2563EB',
          leaveBg: '#DBEAFE',
          halfDay: '#9333EA',
          halfDayBg: '#F3E8FF',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        card: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        elevated: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
};
