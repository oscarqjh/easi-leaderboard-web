import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lb: {
          bg: "#faf9fc",
          surface: "#ffffff",
          primary: "#6366f1",
          "primary-light": "rgba(99, 102, 241, 0.06)",
          "primary-muted": "rgba(99, 102, 241, 0.12)",
          accent: "#6366f1",
          "accent-light": "rgba(99, 102, 241, 0.06)",
          text: "#1e1b4b",
          "text-secondary": "#7c7a9a",
          "text-muted": "#a5a3c2",
          border: "#e5e2f0",
          "border-emphasis": "#d4d1e5",
          gold: "#a16207",
          silver: "#7c7a9a",
          bronze: "#9a3412",
          best: "#059669",
          "header-bg": "#1e1b4b",
          "header-fg": "#c4b5fd",
          nav: "#1e1b4b",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Fraunces", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.1" }],
        heading: ["2rem", { lineHeight: "1.2" }],
        subheading: ["1.5rem", { lineHeight: "1.3" }],
        body: ["1.125rem", { lineHeight: "1.6" }],
        caption: ["1rem", { lineHeight: "1.5" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        full: "9999px",
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "2rem",
        xl: "4rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)",
        md: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        lg: "0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
