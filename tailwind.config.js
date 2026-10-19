/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#123C2D",
          dark: "#0B261D",
          light: "#1B4F3D",
          deep: "#00271A",
        },
        emerald: {
          accent: "#237653",
          light: "#287451",
          muted: "#3F6655",
        },
        lime: {
          accent: "#C8F169",
          dim: "#ADD450",
          dark: "#93B737",
        },
        sage: {
          pale: "#DDE8D8",
          container: "#E8F0E4",
          high: "#E2EBDE",
          highest: "#DCE5D9",
        },
        ivory: {
          warm: "#F5F5EC",
          canvas: "#F7F7F0",
        },
        surface: {
          DEFAULT: "#F3FCEF",
          dim: "#D4DDD0",
          container: "#E8F0E4",
          low: "#EDF6E9",
          lowest: "#FFFFFF",
          variant: "#DCE5D9",
        },
        charcoal: "#161D16",
        subtle: "#576258",
        borderTone: "#E2E6DC",
        alert: {
          amber: "#E6A23C",
          crimson: "#BA1A1A",
          crimsonBg: "#FFDAD6",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
        'sm': '0.25rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        subtle: '0 8px 30px -4px rgba(21, 61, 46, 0.06), 0 2px 6px -1px rgba(21, 61, 46, 0.04)',
        glass: '0 4px 20px -2px rgba(18, 60, 45, 0.08)',
      }
    },
  },
  plugins: [],
}
