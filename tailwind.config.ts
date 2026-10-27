import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        space: {
          950: "#050814",
          900: "#0a0f24",
          850: "#0e1530",
          800: "#131b3e",
          750: "#17224d",
          700: "#1b2756",
          600: "#243472",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
