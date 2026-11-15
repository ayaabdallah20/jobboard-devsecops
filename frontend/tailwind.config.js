/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1E3D',
        mist: '#EEF4FF',
        royal: { DEFAULT: '#1D4ED8', dark: '#1E40AF', light: '#3B82F6' },
        deep: '#1E3A8A',
        sky: { DEFAULT: '#38BDF8' },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 12px 32px -12px rgba(29, 78, 216, 0.35)',
        line: '0 0 0 1px rgba(15, 30, 61, 0.08)',
      },
    },
  },
  plugins: [],
}
