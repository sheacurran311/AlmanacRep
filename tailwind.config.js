/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/client/**/*.{js,jsx,ts,tsx}",
    "./src/client/index.html",
    "./src/client/components/**/*.{js,jsx,ts,tsx}",
    "./src/client/pages/**/*.{js,jsx,ts,tsx}",
    "./src/client/layouts/**/*.{js,jsx,ts,tsx}",
    "./src/client/views/**/*.{js,jsx,ts,tsx}",
    "./src/client/shared/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  darkMode: 'class',
  important: '#root',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4f83cc',
          main: '#1976d2',
          dark: '#115293',
        },
        secondary: {
          light: '#ba68c8',
          main: '#9c27b0',
          dark: '#7b1fa2',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        }
      },
      spacing: {
        'navbar-height': '64px',
      },
      zIndex: {
        'modal': 1300,
        'drawer': 1200,
        'appbar': 1100,
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
