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
        // Ocean Breeze Design System - Exact spec values
        primary: '#0EA5E9',       // Sky Blue
        secondary: '#06B6D4',     // Cyan
        accent: '#14B8A6',        // Teal
        'app-dark': '#0F172A',    // Deep Navy (sidebar, dark surfaces)
        'app-bg': '#F8FAFC',      // Light ocean-breeze background
        'app-card': '#FFFFFF',    // White cards
        success: '#10B981',       // Emerald green
        warning: '#F59E0B',       // Amber
        danger: '#EF4444',        // Red
        // Legacy brand tokens (kept for backwards compat)
        brand: {
          blue: '#0EA5E9',
          red: '#EF4444',
          yellow: '#F59E0B',
          green: '#10B981',
        },
        // Ocean palette extras
        ocean: {
          abyss: '#0F172A',
          breeze: '#0EA5E9',
          lagoon: '#0D9488',
          seafoam: '#14B8A6',
          coral: '#EF4444',
          light: '#F0F9FF',
          mist: '#E0F2FE',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      spacing: {
        '68': '17rem',
      },
      borderRadius: {
        'card': '16px',
      },
      boxShadow: {
        'ocean': '0 4px 24px rgba(14, 165, 233, 0.12)',
        'ocean-lg': '0 8px 40px rgba(14, 165, 233, 0.18)',
        'card': '0 2px 16px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 8px 32px rgba(15, 23, 42, 0.14)',
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #14B8A6 100%)',
        'ocean-gradient-soft': 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(20,184,166,0.08) 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,249,255,0.95) 100%)',
      },
      animation: {
        'count-up': 'count-up 1s ease-out forwards',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}
