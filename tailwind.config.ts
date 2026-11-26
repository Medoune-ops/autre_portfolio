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
        neon: "#2872a1",
        neon2: "#1c5a82",
        ice: "#16232c",
        mist: "#cbdde9",
        steel: "#789a99",
        amber: "#f59e0b",
        border: "rgba(22, 35, 44, 0.12)",
        input: "rgba(22, 35, 44, 0.12)",
        ring: "#2872a1",
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.72)",
          foreground: "#16232c",
        },
        popover: {
          DEFAULT: "rgba(255, 255, 255, 0.96)",
          foreground: "#16232c",
        },
        primary: {
          DEFAULT: "#2872a1",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "rgba(120, 154, 153, 0.14)",
          foreground: "#16232c",
        },
        accent: {
          DEFAULT: "rgba(203, 221, 233, 0.5)",
          foreground: "#16232c",
        },
        muted: {
          DEFAULT: "rgba(22, 35, 44, 0.06)",
          foreground: "rgba(22, 35, 44, 0.75)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        "chart-2": "#789a99",
        background: "#f1f5f9",
        foreground: "#16232c",
      },
      ringOffsetColor: {
        background: "#f1f5f9",
      },
      borderColor: {
        DEFAULT: "rgba(22, 35, 44, 0.12)",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(22, 35, 44, 0.08)",
        glow: "0 0 0 1px rgba(40, 114, 161, 0.16), 0 12px 40px rgba(40, 114, 161, 0.16)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
