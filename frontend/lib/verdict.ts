import type { VerdictTier } from "./types";

/**
 * Design-led verdict tiers. The user-specified humour bands (0–25 / 26–60 / 61–100)
 * drive the big banner and gauge colour. The backend's own measured verdict string
 * (`overall_verdict`, whose thresholds live in the backend's config.py) is shown as
 * a secondary line so we never contradict the calibrated score.
 */
export interface VerdictCopy {
  tier: VerdictTier;
  /** Big sarcastic headline. */
  headline: string;
  /** Smaller supporting jab. */
  sub: string;
  /** Gauge + banner accent (hex). */
  color: string;
  /** Tailwind text/border/shadow utility stems. */
  text: string;
  border: string;
  glow: string;
}

const BANDS: Array<{
  max: number;
  copy: VerdictCopy;
}> = [
  {
    max: 25,
    copy: {
      tier: "human",
      headline: "100% Organic Human Trash 🧠",
      sub: "Certified artisanal. No LLM was harmed in the making of this text — probably.",
      color: "#34d399",
      text: "text-slop-human",
      border: "border-slop-human/50",
      glow: "shadow-glow-green",
    },
  },
  {
    max: 60,
    copy: {
      tier: "suspicious",
      headline: "Suspiciously Fluent (Smells like Claude) 🤖",
      sub: "This prose is *awfully* smooth. We're not saying it. We're just saying.",
      color: "#fbbf24",
      text: "text-slop-suspicious",
      border: "border-slop-suspicious/50",
      glow: "shadow-glow-amber",
    },
  },
  {
    max: 100,
    copy: {
      tier: "ai",
      headline: "100% Pure Synthetic AI Slop (Delve, Tapestry, Unwavering) 🌊",
      sub: "A masterclass in 'delve', 'tapestry' and things being 'not just X, but Y'.",
      color: "#f43f5e",
      text: "text-slop-ai",
      border: "border-slop-ai/50",
      glow: "shadow-glow-red",
    },
  },
];

/** Clamp a raw score into 0–100 and round to one decimal. */
export function normalizeScore(raw: number | undefined | null): number {
  if (typeof raw !== "number" || Number.isNaN(raw)) return 0;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

/** Map a 0–100 score to its humorous verdict copy. */
export function verdictFor(scoreRaw: number): VerdictCopy {
  const score = normalizeScore(scoreRaw);
  const band = BANDS.find((b) => score <= b.max) ?? BANDS[BANDS.length - 1];
  return band.copy;
}

/** Map a quick-score string verdict ("clean"|"mixed"|"ai") to a tier. */
export function tierFromQuickVerdict(v: string | undefined): VerdictTier {
  if (v === "ai") return "ai";
  if (v === "mixed") return "suspicious";
  return "human";
}

/** Interpolate a colour for the gauge arc (green → amber → red) across 0–100. */
export function gaugeColor(scoreRaw: number): string {
  const score = normalizeScore(scoreRaw);
  // Anchor points: 0 = green, 45 = amber, 100 = red.
  const stops = [
    { at: 0, c: [52, 211, 153] },
    { at: 45, c: [251, 191, 36] },
    { at: 100, c: [244, 63, 94] },
  ];
  if (score <= stops[0].at) return `rgb(${stops[0].c.join(",")})`;
  for (let i = 1; i < stops.length; i++) {
    if (score <= stops[i].at) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (score - a.at) / (b.at - a.at);
      const mixed = a.c.map((ch, k) => Math.round(ch + (b.c[k] - ch) * t));
      return `rgb(${mixed.join(",")})`;
    }
  }
  return `rgb(${stops[stops.length - 1].c.join(",")})`;
}
