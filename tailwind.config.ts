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
        neon: "#475569",
        neon2: "#334155",
        ice: "#0f172a",
        border: "rgba(15, 23, 42, 0.12)",
        input: "rgba(15, 23, 42, 0.12)",
        ring: "#475569",
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.72)",
          foreground: "#0f172a",
        },
        popover: {
          DEFAULT: "rgba(255, 255, 255, 0.96)",
          foreground: "#0f172a",
        },
        primary: {
          DEFAULT: "#475569",
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
          foreground: "rgba(15, 23, 42, 0.75)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        "chart-2": "#475569",
        background: "#f1f5f9",
        foreground: "#0f172a",
      },
      ringOffsetColor: {
        background: "#f1f5f9",
      },
      borderColor: {
        DEFAULT: "rgba(15, 23, 42, 0.12)",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(15, 23, 42, 0.08)",
        glow: "0 0 0 1px rgba(71, 85, 105, 0.12), 0 12px 40px rgba(71, 85, 105, 0.12)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
