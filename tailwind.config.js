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
        brand: {
          blue: '#06B6D4',      // Aqua Cyan
          red: '#F43F5E',       // Rose red / Coral
          yellow: '#F59E0B',    // Amber
          green: '#10B981',     // Seafoam / Emerald Green
        },
        dark: {
          bg: '#030E1B',        // Ocean Deep Midnight
          card: '#081729',      // Ocean Sub-surface Card
          border: '#112942',    // Coastal Reef Reef Border
          accent: '#2DD4BF',    // Vibrant Seafoam / Mint
        },
        ocean: {
          abyss: '#020813',     // Extreme Deep Navy
          breeze: '#0EA5E9',    // Breeze Sky Blue
          lagoon: '#0D9488',    // Deep Lagoon Teal
          seafoam: '#14B8A6',   // Bright Seafoam
          coral: '#F43F5E',     // Accent Coral Reef
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
