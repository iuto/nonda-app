/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#ca97c9',
          300: '#a3c7a3',
          400: '#75aa76',
          500: '#4f8c51',
          600: '#3c6e3e',
          700: '#325834',
          800: '#2a472c',
          900: '#233b25',
        }
      }
    },
  },
  plugins: [],
}
