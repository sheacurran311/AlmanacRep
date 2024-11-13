/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/client/**/*.{js,jsx,ts,tsx}",
    "./src/client/index.html",
    "./src/client/components/**/*.{js,jsx,ts,tsx}",
    "./src/client/routes/**/*.{js,jsx,ts,tsx}",
    "./src/client/hooks/**/*.{js,jsx,ts,tsx}",
    "./src/client/theme/**/*.{js,jsx,ts,tsx}",
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
