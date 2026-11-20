import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f1f5f9",
        neon: "#0891b2",
        neon2: "#0284c7",
        ice: "#0f172a",
        border: "rgba(15, 23, 42, 0.12)",
        input: "rgba(15, 23, 42, 0.12)",
        ring: "#0891b2",
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.72)",
          foreground: "#0f172a",
        },
        popover: {
          DEFAULT: "rgba(255, 255, 255, 0.96)",
          foreground: "#0f172a",
        },
        primary: {
          DEFAULT: "#0891b2",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "rgba(15, 23, 42, 0.06)",
          foreground: "#0f172a",
        },
        accent: {
          DEFAULT: "rgba(15, 23, 42, 0.06)",
          foreground: "#0f172a",
        },
        muted: {
          DEFAULT: "rgba(15, 23, 42, 0.06)",
          foreground: "rgba(15, 23, 42, 0.58)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        "chart-2": "#0891b2",
        background: "#f1f5f9",
        foreground: "#0f172a",
      },
      ringOffsetColor: {
        background: "#f1f5f9",
      },
      borderColor: {
        DEFAULT: "rgba(234, 246, 255, 0.12)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
