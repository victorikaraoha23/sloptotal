import type { Config } from "tailwindcss";

/**
 * SlopTotal design system — "Forensic Lab / Evidence Board".
 *
 * Ported from the original web/static UI: warm paper canvas, near-black ink
 * masthead, hairline rules, an editorial serif (Instrument Serif) for display,
 * and a single red "stamp" accent used for verdicts. The humour lives in the
 * copy (lib/copy.ts); the visual language stays deadpan and forensic.
 *
 * Colour tokens mirror the CSS custom properties in web/static/css/style.css so
 * the two frontends read as one product.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — warm paper.
        paper: "#f5f0e8",
        "paper-warm": "#ede7db",
        "paper-deep": "#e4ddd0",
        cream: "#faf6ee",
        // Ink + text.
        ink: "#1a1a18",
        slate: "#3d3b37",
        dim: "#7a756b",
        muted: "#a09a8e",
        // Hairlines.
        rule: "#cdc6b8",
        "rule-light": "#ddd7cb",
        // Verdict / accent — the red "stamp".
        stamp: {
          DEFAULT: "#b5282e",
          muted: "#d4878a",
          bg: "#fce8e9",
        },
        // Semantic verdict colours (from the original palette).
        clean: "#2d8a4e",
        low: "#5a9e3e",
        warn: "#c98b1d",
        danger: "#c45d1a",
        slop: "#b5282e",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
      },
      fontSize: {
        // Editorial display scale.
        "display-lg": ["clamp(34px, 5vw, 54px)", { lineHeight: "1.08", letterSpacing: "-0.01em" }],
        "display": ["clamp(28px, 4vw, 40px)", { lineHeight: "1.12", letterSpacing: "-0.01em" }],
        "display-sm": ["24px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
      },
      boxShadow: {
        // Paper elevation — soft, warm, no neon.
        card: "0 1px 2px rgba(26,26,24,0.04), 0 8px 28px rgba(26,26,24,0.07)",
        lift: "0 2px 4px rgba(26,26,24,0.06), 0 12px 36px rgba(26,26,24,0.1)",
        stamp: "0 4px 14px rgba(181,40,46,0.18)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.82)" },
        },
        "tab-slide": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "stamp-in": {
          "0%": { opacity: "0", transform: "scale(1.25) rotate(-6deg)" },
          "60%": { opacity: "1", transform: "scale(0.96) rotate(-3deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-3deg)" },
        },
        "marquee-down": {
          from: { opacity: "0", transform: "translateY(-100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        pulse: "pulse 1.6s ease infinite",
        "tab-slide": "tab-slide 0.3s cubic-bezier(0.16,1,0.3,1)",
        "stamp-in": "stamp-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "marquee-down": "marquee-down 0.4s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;


