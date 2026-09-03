/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#07111F', // Base canvas
          900: '#0B1728', // Deep surface
          850: '#101C2E', // Panel cards
          800: '#132238', // Elevated cards & hovers
          750: '#182A45', // Highlight / headers
          700: '#1F3556', // Borders & dividers
          600: '#2A4773',
          500: '#3D6399',
        },
        brand: {
          blue: '#0D94FB',
          hover: '#0B82DE',
          light: 'rgba(13, 148, 251, 0.12)',
        },
        status: {
          matched: '#18C58F', // Emerald
          review: '#F4B740',  // Amber
          exception: '#EF5B68', // Rose
          neutral: '#7E8A9D',
        },
        tprimary: '#F5F7FA',
        tsecondary: '#A5AFBF',
        tmuted: '#6F7C90',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'SF Mono',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.35)',
        elevated: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
        drawer: '-4px 0 24px -2px rgba(0, 0, 0, 0.65)',
        glow: '0 0 15px rgba(13, 148, 251, 0.25)',
      },
    },
  },
  plugins: [],
}
