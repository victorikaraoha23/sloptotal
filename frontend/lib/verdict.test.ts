import { describe, expect, it } from "vitest";
import { gaugeColor, normalizeScore, tierFromQuickVerdict, verdictFor } from "@/lib/verdict";

describe("normalizeScore", () => {
  it("passes through a normal 0–100 score, rounded to one decimal", () => {
    expect(normalizeScore(42.345)).toBe(42.3);
    expect(normalizeScore(0)).toBe(0);
    expect(normalizeScore(100)).toBe(100);
  });

  it("clamps out-of-range values", () => {
    expect(normalizeScore(-5)).toBe(0);
    expect(normalizeScore(140)).toBe(100);
  });

  it("treats missing or NaN input as 0, never NaN", () => {
    expect(normalizeScore(undefined)).toBe(0);
    expect(normalizeScore(null)).toBe(0);
    expect(normalizeScore(NaN)).toBe(0);
  });
});

describe("verdictFor", () => {
  it("bands 0–25 as human", () => {
    expect(verdictFor(0).tier).toBe("human");
    expect(verdictFor(25).tier).toBe("human");
  });

  it("bands 26–60 as suspicious", () => {
    expect(verdictFor(26).tier).toBe("suspicious");
    expect(verdictFor(60).tier).toBe("suspicious");
  });

  it("bands 61–100 as ai", () => {
    expect(verdictFor(61).tier).toBe("ai");
    expect(verdictFor(100).tier).toBe("ai");
  });

  it("always returns copy plus Tailwind stems so the UI never renders bare", () => {
    for (const score of [5, 40, 90]) {
      const v = verdictFor(score);
      expect(v.headline.length).toBeGreaterThan(0);
      expect(v.sub.length).toBeGreaterThan(0);
      expect(v.tell.length).toBeGreaterThan(0);
      expect(v.text).toMatch(/^text-/);
      expect(v.border).toMatch(/^border-/);
      expect(v.bg).toMatch(/^bg-/);
    }
  });
});

describe("tierFromQuickVerdict", () => {
  it("maps the backend quick-score enum to UI tiers", () => {
    expect(tierFromQuickVerdict("ai")).toBe("ai");
    expect(tierFromQuickVerdict("mixed")).toBe("suspicious");
    expect(tierFromQuickVerdict("clean")).toBe("human");
  });

  it("defaults unknown or missing verdicts to human, not ai", () => {
    expect(tierFromQuickVerdict(undefined)).toBe("human");
    expect(tierFromQuickVerdict("bogus")).toBe("human");
  });
});

describe("gaugeColor", () => {
  it("returns an rgb() string anchored near green at 0 and red at 100", () => {
    expect(gaugeColor(0)).toBe("rgb(45,138,78)");
    expect(gaugeColor(100)).toBe("rgb(181,40,46)");
  });

  it("never returns NaN channels for edge inputs", () => {
    for (const s of [-10, 0, 50, 100, 200, NaN]) {
      expect(gaugeColor(s)).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    }
  });
});
