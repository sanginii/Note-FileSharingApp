/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#000000',
          green: '#00ff00',
          'green-dim': '#00cc00',
          'green-bright': '#00ff88',
          'green-dark': '#008800',
        },
        danger: {
          50: '#00ff00',
          100: '#00ee00',
          200: '#00cc00',
          300: '#00aa00',
          400: '#008800',
          500: '#006600',
          600: '#004400',
          700: '#002200',
          800: '#001100',
          900: '#000800',
        },
        warning: {
          50: '#ffff00',
          100: '#eeee00',
          200: '#cccc00',
          300: '#aaaa00',
          400: '#888800',
          500: '#666600',
          600: '#444400',
          700: '#222200',
          800: '#111100',
          900: '#080800',
        },
      },
      fontFamily: {
        mono: ['Courier New', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}


