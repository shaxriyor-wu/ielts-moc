/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00447C',
          50: '#E6F0F7',
          100: '#CCE1EF',
          200: '#99C3DF',
          300: '#66A5CF',
          400: '#3387BF',
          500: '#00447C',
          600: '#003663',
          700: '#002849',
          800: '#001B2F',
          900: '#000D16',
        },
        accent: {
          DEFAULT: '#E31B23',
          50: '#FCE8E9',
          100: '#F9D1D3',
          200: '#F3A3A7',
          300: '#ED757B',
          400: '#E7474F',
          500: '#E31B23',
          600: '#B6151C',
          700: '#881015',
          800: '#5B0B0E',
          900: '#2D0507',
        },
        background: '#F5F7FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

