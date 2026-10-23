/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border, #2F3336)",
        input: "var(--input, #2F3336)",
        ring: "var(--ring, #1D9BF0)",
        background: "var(--background, #000000)",
        foreground: "var(--foreground, #F7F9F9)",
        primary: {
          DEFAULT: "var(--primary, #1D9BF0)",
          foreground: "var(--primary-foreground, #FFFFFF)",
          hover: "#1A8CD8",
        },
        secondary: {
          DEFAULT: "var(--secondary, #FFFFFF)",
          foreground: "var(--secondary-foreground, #0F1419)",
        },
        destructive: {
          DEFAULT: "var(--destructive, #F4212E)",
          foreground: "var(--destructive-foreground, #FFFFFF)",
        },
        muted: {
          DEFAULT: "var(--muted, #22303C)",
          foreground: "var(--muted-foreground, #71767B)",
        },
        accent: {
          DEFAULT: "var(--accent, #15202B)",
          foreground: "var(--accent-foreground, #1D9BF0)",
        },
        popover: {
          DEFAULT: "var(--popover, #16181C)",
          foreground: "var(--popover-foreground, #F7F9F9)",
        },
        card: {
          DEFAULT: "var(--card, #16181C)",
          foreground: "var(--card-foreground, #F7F9F9)",
        },
        twitter: {
          blue: "#1D9BF0",
          hover: "#1A8CD8",
          red: "#F4212E",
          black: "#000000",
          card: "#16181C",
          accent: "#15202B",
          muted: "#22303C",
          border: "#2F3336",
          text: "#F7F9F9",
          subtext: "#71767B",
        },
      },
      borderRadius: {
        lg: "var(--radius, 0.5rem)",
        md: "calc(var(--radius, 0.5rem) - 2px)",
        sm: "calc(var(--radius, 0.5rem) - 4px)",
      },
    },
  },
  plugins: [],
}
