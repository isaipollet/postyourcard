import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent — burgundy (renamed from teal but keeping the class name
        // so existing components don't need rewrites). Matches Bruges Audio Tour.
        teal: {
          DEFAULT: "#6B1F2A",
          50: "#FAF1F2",
          100: "#F2DCE0",
          200: "#E0AAB1",
          300: "#C97982",
          400: "#A04C58",
          500: "#6B1F2A",
          600: "#5A1822",
          700: "#45111A",
          800: "#3D0F16",
          900: "#260910",
        },
        // Cream/stone tones — aligned with Bruges palette
        sand: {
          DEFAULT: "#EFE8D5",
          50: "#FAF6EE",
          100: "#F5E9CC",
          200: "#EFE8D5",
          300: "#E0D4B6",
          400: "#C4B89A",
          500: "#A89A7E",
          600: "#8B7E6E",
          700: "#6E5F4E",
          800: "#4F4234",
          900: "#1C1712",
        },
        gold: {
          DEFAULT: "#C9963A",
          light: "#E8C47A",
          pale: "#F5E9CC",
        },
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        handwritten: ["var(--font-handwritten)", "cursive"],
        "hand-print": ["var(--font-hand-print)", "cursive"],
        "hand-cursive": ["var(--font-hand-cursive)", "cursive"],
        "hand-pen": ["var(--font-hand-pen)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
