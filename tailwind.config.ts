import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a', // Deep blue
          light: '#3b82f6',
          dark: '#1e40af',
        },
        accent: {
          teal: '#14b8a6', // Turquoise/teal
          orange: '#f97316', // Warm orange
        },
        success: '#10b981',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

