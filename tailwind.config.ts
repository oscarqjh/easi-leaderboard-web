import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    borderRadius: {
      DEFAULT: "0",
      none: "0",
    },
    extend: {
      colors: {
        lb: {
          bg: "#f5f5f2",
          surface: "#ffffff",
          primary: "#4338ca",
          "primary-light": "rgba(67, 56, 202, 0.06)",
          "primary-muted": "rgba(67, 56, 202, 0.15)",
          accent: "#f97316",
          "accent-light": "rgba(249, 115, 22, 0.1)",
          text: "#1e1e2e",
          "text-secondary": "#64748b",
          "text-muted": "#94a3b8",
          border: "#e2e0dc",
          "border-emphasis": "#4338ca",
          gold: "#d4a017",
          silver: "#94a3b8",
          bronze: "#c2854a",
          best: "#059669",
          "header-bg": "#1b1f3b",
          "header-fg": "#c4cbf5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.1" }],
        heading: ["2rem", { lineHeight: "1.2" }],
        subheading: ["1.5rem", { lineHeight: "1.3" }],
        body: ["1.125rem", { lineHeight: "1.6" }],
        caption: ["1rem", { lineHeight: "1.5" }],
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "2rem",
        xl: "4rem",
      },
      boxShadow: {
        "border-thin": "0 0 0 1px currentColor",
        "border-medium": "0 0 0 2px currentColor",
        "border-thick": "0 0 0 4px currentColor",
      },
    },
  },
  plugins: [],
};

export default config;
