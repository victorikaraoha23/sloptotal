import { VERDICTS } from "./copy";
import type { VerdictTier } from "./types";

/** A verdict tier enriched with the copy + Tailwind class stems the UI needs. */
export interface VerdictView {
  tier: VerdictTier;
  headline: string;
  sub: string;
  tell: string;
  color: string;
  /** Tailwind utility stems for text / border / soft background tint. */
  text: string;
  border: string;
  bg: string;
}

// Forensic palette mapping: emerald (clean) → amber (warn) → red (slop).
const CLASS_STEMS: Record<VerdictTier, { text: string; border: string; bg: string }> = {
  human: { text: "text-clean", border: "border-clean/40", bg: "bg-clean/[0.07]" },
  suspicious: { text: "text-warn", border: "border-warn/40", bg: "bg-warn/[0.08]" },
  ai: { text: "text-slop", border: "border-slop/40", bg: "bg-slop/[0.07]" },
};

/** Clamp a raw score into 0–100 and round to one decimal. */
export function normalizeScore(raw: number | undefined | null): number {
  if (typeof raw !== "number" || Number.isNaN(raw)) return 0;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

/**
 * Map a 0–100 score to its verdict view.
 *
 * The bands (0–25 human / 26–60 suspicious / 61–100 AI) are the design-led tiers.
 * The backend's own calibrated `overall_verdict` string is displayed separately so
 * the UI never contradicts the measured score.
 */
export function verdictFor(scoreRaw: number): VerdictView {
  const score = normalizeScore(scoreRaw);
  const tier: VerdictTier = score <= 25 ? "human" : score <= 60 ? "suspicious" : "ai";
  const copy = VERDICTS[tier];
  const stems = CLASS_STEMS[tier];
  return { ...copy, ...stems };
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
  // Anchor points mirror the forensic verdict colours so the arc matches the band.
  const stops = [
    { at: 0, c: [45, 138, 78] }, // clean
    { at: 45, c: [201, 139, 29] }, // warn
    { at: 100, c: [181, 40, 46] }, // slop
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


