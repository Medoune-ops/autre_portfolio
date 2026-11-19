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
        card: {
          DEFAULT: "rgba(10, 15, 28, 0.96)",
          foreground: "#EAF6FF",
        },
        muted: {
          DEFAULT: "rgba(234, 246, 255, 0.08)",
          foreground: "rgba(234, 246, 255, 0.65)",
        },
        background: "#0A0F1C",
        foreground: "#EAF6FF",
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
