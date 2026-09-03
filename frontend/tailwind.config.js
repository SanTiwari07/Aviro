/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#0d94fb',
        accent: '#012652',
        success: '#04db7c',
        foreground: '#172b4d',
        muted: '#5e6c84',
        border: '#ebecf0',
        card: '#ffffff',
      }
    },
  },
  plugins: [],
}
