/**
 * Tests for the API client (lib/api.ts) using mocked fetch.
 *
 * These pin the exact behaviours the UI depends on:
 *  - 200 JSON passes through
 *  - backend `error` fields become ApiError messages
 *  - 202 queued full-analysis polls the ticket endpoint until done
 *  - network failures surface as status 0 (the "backend napping" path)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, analyze, getHealth, quickScore } from "@/lib/api";

const QUICK_OK = {
  score: 12.5,
  verdict: "clean",
  confidence: "high",
  engines: [{ engine: "fakespot", score: 10, verdict: "clean" }],
  elapsed_ms: 320,
};

const FULL_REPORT = {
  id: "abc123",
  source_type: "text",
  source: "hello world",
  text_excerpt: "hello world, this is a long enough piece of text for analysis",
  word_count: 12,
  engine_results: [
    {
      engine_name: "Fakespot",
      score: 0.1,
      verdict: "clean",
      details: "looks human",
      description: "RoBERTa classifier",
    },
  ],
  overall_score: 11.0,
  overall_verdict: "Clean — likely human-written",
  engines_flagged: 0,
  engines_total: 1,
  created_at: "2026-10-11T00:00:00",
};

function mkJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Loose helper for explicit 2-arg calls (body + status) used in the 202 polling test.
export {}


beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("quickScore", () => {
  it("normalises a 200 quick-score into a ScanResult", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mkJsonResponse(QUICK_OK));
    const r = await quickScore({ text: "x".repeat(60) });
    expect(r.score).toBe(12.5);
    expect(r.tier).toBe("human");
    expect(r.engines).toHaveLength(1);
    expect(r.engines[0].score).toBe(10);
  });

  it("maps clean/mixed/ai quick verdicts to human/suspicious/ai tiers", async () => {
    for (const [verdict, tier] of [
      ["clean", "human"],
      ["mixed", "suspicious"],
      ["ai", "ai"],
    ] as const) {
      vi.mocked(fetch).mockResolvedValueOnce(mkJsonResponse({ ...QUICK_OK, verdict }));
      const r = await quickScore({ text: "x".repeat(60) });
      expect(r.tier).toBe(tier);
    }
  });

  it("refuses to send an empty payload client-side", async () => {
    await expect(quickScore({})).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("turns a backend 400 into an ApiError with the backend message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mkJsonResponse({ error: "Text must be at least 50 characters." }, 400),
    );
    const err = await quickScore({ text: "x".repeat(60) }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/50 characters/);
  });

  it("carries retry_after from a 429 so the UI can back off", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mkJsonResponse({ error: "busy", retry_after: 7 }, 429, { "retry-after": "7" }),
    );
    const err = await quickScore({ text: "x".repeat(60) }).catch((e) => e);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(7);
  });

  it("maps a network failure to status 0, the backend-napping path", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const err = await quickScore({ text: "x".repeat(60) }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });
});

describe("analyze (full)", () => {
  it("returns the report directly on 200", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mkJsonResponse(FULL_REPORT));
    const r = await analyze({ text: "x".repeat(60) });
    expect(r.score).toBe(11);
    expect(r.reportId).toBe("abc123");
    expect(r.enginesTotal).toBe(1);
  });

  it("polls the ticket endpoint when the backend queues the job (202)", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mkJsonResponse({ status: "queued", ticket_id: "t1", position: 1, estimated_wait_ms: 10 }),
        202,
      )
      .mockResolvedValueOnce(mkJsonResponse({ status: "queued", position: 1 }, 202))
      .mockResolvedValueOnce(mkJsonResponse(FULL_REPORT));
    const r = await analyze({ text: "x".repeat(60) });
    expect(r.reportId).toBe("abc123");
    expect(vi.mocked(fetch).mock.calls[2][0]).toMatch(/\/api\/queue\/ticket\/t1/);
  });

  it("surfaces a rejected queue as a 429 with retry_after", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mkJsonResponse({ status: "rejected", error: "busy", retry_after: 5 }),
      )
      .mockResolvedValueOnce(
        mkJsonResponse({ status: "rejected", error: "busy", retry_after: 5 }),
      );
    const err = await analyze({ text: "x".repeat(60) }).catch((e) => e);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(5);
  });
});

describe("getHealth", () => {
  it("returns the health payload on 200", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mkJsonResponse({ status: "healthy", engines: { total: 23, loaded: 23, failed: [] } }),
    );
    const h = await getHealth();
    expect(h?.status).toBe("healthy");
  });

  it("returns null instead of throwing when the backend is down", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(getHealth()).resolves.toBeNull();
  });
});
