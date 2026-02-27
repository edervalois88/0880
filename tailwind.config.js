import daisyui from "daisyui"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        brand: {
          black: "#191919",
          white: "#FFFFFF",
          grey: "#CAC7C2",
        }
      }
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        luxury: {
          "primary": "#191919", // Brand Black
          "secondary": "#CAC7C2", // Brand Grey
          "accent": "#CAC7C2",
          "neutral": "#191919",
          "base-100": "#FFFFFF", // Brand White
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
          "--rounded-box": "0rem", 
          "--rounded-btn": "0rem",
          "--rounded-badge": "0rem",
          "--tab-radius": "0rem",
        },
      },
    ],
  },
}
