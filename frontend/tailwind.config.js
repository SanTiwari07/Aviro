/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic dynamic theme surfaces & text
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          sunken: 'var(--bg-surface-sunken)',
        },
        sidebar: {
          DEFAULT: 'var(--bg-sidebar)',
          hover: 'var(--bg-sidebar-hover)',
          active: 'var(--bg-sidebar-active)',
          border: 'var(--border-sidebar)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-base)',
          strong: 'var(--border-strong)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },

        // ARIVO Extended Semantic Palette
        brand: {
          DEFAULT: '#0D94FB', // Brand Blue
          blue: '#0D94FB',
          electric: '#2F7BFF',
          hover: '#0B82DE',
          prussian: '#012652', // Deep Prussian
          light: 'rgba(13, 148, 251, 0.12)',
        },
        ai: {
          DEFAULT: '#8B7CFF', // AI Violet
          violet: '#8B7CFF',
          subtle: 'rgba(139, 124, 255, 0.12)',
          border: 'rgba(139, 124, 255, 0.3)',
        },
        status: {
          matched: '#04DB7C',   // Success Mint
          mint: '#04DB7C',
          review: '#FFB454',    // Review Amber
          amber: '#FFB454',
          exception: '#FF647C', // Exception Coral
          coral: '#FF647C',
          cyan: '#43C6E8',      // Info Cyan
          neutral: '#97A0AF',
        },

        // Compatibility mappings for gradual refactor
        tprimary: 'var(--text-primary)',
        tsecondary: 'var(--text-secondary)',
        tmuted: 'var(--text-muted)',
        navy: {
          950: 'var(--navy-950)',
          900: 'var(--navy-900)',
          850: 'var(--navy-850)',
          800: 'var(--navy-800)',
          750: 'var(--navy-750)',
          700: 'var(--navy-700)',
          600: 'var(--navy-600)',
          500: 'var(--navy-500)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Muli',
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
      borderRadius: {
        DEFAULT: '4px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        drawer: 'var(--shadow-drawer)',
        glow: '0 0 15px rgba(13, 148, 251, 0.25)',
        'ai-glow': '0 0 18px rgba(139, 124, 255, 0.2)',
        'mint-glow': '0 0 14px rgba(4, 219, 124, 0.2)',
        'amber-glow': '0 0 14px rgba(255, 180, 84, 0.2)',
        'coral-glow': '0 0 14px rgba(255, 100, 124, 0.2)',
      },
    },
  },
  plugins: [],
}
