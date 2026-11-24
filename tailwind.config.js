/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // True neutral shades of black (0% blue, 0% purple) for designer-grade dark mode
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#9ca3af', // neutral silver text
          500: '#6b7280', // neutral medium gray
          600: '#4b5563', // neutral gray
          700: '#2c2c2c', // shade of black: clean border / divider
          800: '#202020', // shade of black: inner elevated card / surface
          850: '#181818', // shade of black: secondary card surface
          900: '#141414', // shade of black: primary card surface
          950: '#0a0a0a', // shade of black: deep pitch canvas background
        },
        forest: {
          50: '#f2f8f4',
          100: '#e1efe6',
          200: '#c5dfd0',
          300: '#9cc6af',
          400: '#6ea689',
          500: '#4c8a6b',
          600: '#396f54',
          700: '#2f5945',
          800: '#284738',
          900: '#1b3327',
          950: '#0e1d16',
        },
        aqi: {
          good: '#10B981',        // 0-50 Green
          satisfactory: '#84CC16', // 51-100 Light Green
          moderate: '#F59E0B',     // 101-200 Yellow/Orange
          poor: '#F97316',         // 201-300 Orange
          verypoor: '#EF4444',     // 301-400 Red
          severe: '#7F1D1D',       // 401-500 Maroon / Dark Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
