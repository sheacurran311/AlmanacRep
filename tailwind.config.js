/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/client/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
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
      },
      spacing: {
        'navbar-height': '64px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
