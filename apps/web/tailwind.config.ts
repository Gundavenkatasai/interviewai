import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F5F3EE', // Sandstone Alabaster
        surface: '#FFFFFF', // Chalk White
        'surface-subtle': '#FAF8F5',
        'border-stone': '#E5E0D4', // Warm structural divider
        'border-stone-strong': '#DCD5C6',
        ink: '#181614', // Carbon Umber
        'ink-muted': '#5C564E',
        'ink-faint': '#8C8479',
        'ink-ghost': '#B5AEA3',
        terracotta: {
          DEFAULT: '#C84B26', // Warm Vermilion
          hover: '#B53E1B',
          dark: '#983416',
          faint: '#FBF0EC',
          border: '#F4D4C9',
        },
        celadon: {
          DEFAULT: '#2E6347', // Muted Celadon Herb
          bg: '#EBF3EE',
          border: '#D0E3D6',
          light: '#E2EFE7',
        },
        honey: {
          DEFAULT: '#A36114', // Raw Honey Amber
          bg: '#FDF6E9',
          border: '#F7E6C4',
        },
        brick: {
          DEFAULT: '#9E2A2B', // Brick Oxide
          bg: '#FCEEEE',
          border: '#F7D0D0',
        },
        navy: {
          DEFAULT: '#172535', // Deep Oxford Navy
          surface: '#111D2B',
          light: '#23384E',
          muted: '#8B9CAD',
        },
      },
      fontFamily: {
        serif: ['Charter', 'Bitstream Charter', 'Sitka Text', 'Cambria', 'serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'keycap-terracotta': '0 2px 0 0 #983416',
        'keycap-navy': '0 2px 0 0 #0E1721',
        'keycap-stone': '0 2px 0 0 #C9C2B3',
        'card-physical': '0 1px 3px rgba(24, 22, 20, 0.04), 0 1px 2px rgba(24, 22, 20, 0.02)',
        'paper-elevation': '0 10px 25px -5px rgba(24, 22, 20, 0.08), 0 8px 10px -6px rgba(24, 22, 20, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-bar': 'scanBar 3.5s ease-in-out infinite',
        'needle-wobble': 'needleWobble 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scanBar: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        needleWobble: {
          '0%': { transform: 'rotate(-2deg)' },
          '100%': { transform: 'rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
