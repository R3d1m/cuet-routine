/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        serif: ['Georgia', 'Cambria', 'serif']
      },
      colors: {
        canvas: '#FFFFFF',
        ink: '#000000',
        muted: '#525252',
        subtle: '#737373',
        borderDark: '#000000',
        borderLight: '#E5E5E5',
        surfaceLight: '#F9F9F9',
        surfaceHover: '#F4F4F5'
      }
    },
  },
  plugins: [],
}
