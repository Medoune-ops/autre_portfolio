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
        bg: "#0A0F1C",
        neon: "#00E5FF",
        neon2: "#1E90FF",
        ice: "#EAF6FF",
        border: "rgba(234, 246, 255, 0.12)",
        input: "rgba(234, 246, 255, 0.12)",
        ring: "#00E5FF",
        card: {
          DEFAULT: "rgba(10, 15, 28, 0.96)",
          foreground: "#EAF6FF",
        },
        popover: {
          DEFAULT: "rgba(10, 15, 28, 0.98)",
          foreground: "#EAF6FF",
        },
        primary: {
          DEFAULT: "#00E5FF",
          foreground: "#0A0F1C",
        },
        secondary: {
          DEFAULT: "rgba(234, 246, 255, 0.08)",
          foreground: "#EAF6FF",
        },
        accent: {
          DEFAULT: "rgba(234, 246, 255, 0.08)",
          foreground: "#EAF6FF",
        },
        muted: {
          DEFAULT: "rgba(234, 246, 255, 0.08)",
          foreground: "rgba(234, 246, 255, 0.65)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        "chart-2": "#00E5FF",
        background: "#0A0F1C",
        foreground: "#EAF6FF",
      },
      ringOffsetColor: {
        background: "#0A0F1C",
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
