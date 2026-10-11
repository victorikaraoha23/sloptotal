import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk terminal palette
        void: {
          950: "#05060a",
          900: "#0a0c14",
          850: "#0e111b",
          800: "#131826",
          700: "#1b2233",
          600: "#273049",
        },
        neon: {
          cyan: "#22d3ee",
          green: "#34d399",
          lime: "#a3e635",
          amber: "#fbbf24",
          rose: "#fb7185",
          magenta: "#e879f9",
          violet: "#a78bfa",
        },
        // Verdict colors used across gauge + banners
        slop: {
          human: "#34d399", // green
          suspicious: "#fbbf24", // amber
          ai: "#f43f5e", // red
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(34, 211, 238, 0.45)",
        "glow-green": "0 0 28px -4px rgba(52, 211, 153, 0.5)",
        "glow-amber": "0 0 28px -4px rgba(251, 191, 36, 0.5)",
        "glow-red": "0 0 28px -4px rgba(244, 63, 94, 0.55)",
        panel: "0 20px 60px -20px rgba(0, 0, 0, 0.8)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(to right, rgba(34,211,238,0.06) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(34,211,238,0.12), transparent 70%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "41%": { opacity: "1" },
          "42%": { opacity: "0.55" },
          "43%": { opacity: "1" },
          "45%": { opacity: "0.4" },
          "46%": { opacity: "1" },
        },
        "rise-fade": {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite",
        scan: "scan 2.2s linear infinite",
        shimmer: "shimmer 1.8s infinite",
        flicker: "flicker 4s linear infinite",
        "rise-fade": "rise-fade 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
