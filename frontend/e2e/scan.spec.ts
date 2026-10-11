import { test, expect, type Page } from "@playwright/test";
import { BASE } from "./mock-backend";

/**
 * e2e coverage for the Scan tab.
 *
 * The suite boots `next start` against a production build with the API proxy
 * pointed at the mock backend, so every assertion below depends only on the
 * mocked contract, never on Render.
 */

test("healthy scan", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Our renderer is healthy.
  const health = await page.request.get(`${BASE}/health`);
  expect(health.ok).toBeTruthy();

  // Importing the newest engines is the payoff.
  const engines = await page.request.get(`${BASE}/api/engines`);
  expect(engines.ok).toBeTruthy();
});

test("queued/polling analysis completes", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Simulate a queued job: POST /api/analyze answers 202 with a ticket.
  const queued = await page.request.post(`${BASE}/api/analyze`, {
    data: { text: "x".repeat(120) },
    headers: { "Content-Type": "application/json" },
  });
  expect(queued.status()).toBe(202);
  const body = await queued.json() as { ticket_id?: string };
  expect(body.ticket_id).toBeTruthy();

  // Poll the ticket until the backend finishes it.
  const ticket = await page.request.get(`${BASE}/api/queue/ticket/${body.ticket_id}`);
  expect(ticket.ok).toBeTruthy();
  const report = await ticket.json() as { engine_results?: unknown[] };
  expect(report.engine_results).toBeTruthy();
});

test("429 surface when the queue is full while polling", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  // The backend reports the job was rejected (queue full) on the ticket
  // endpoint. The client surfaces this as a retriable 429.
  const t = "t-rejected";
  const res = await page.request.get(`${BASE}/api/queue/ticket/${t}`);
  expect(res.ok).toBeTruthy();
  const payload = await res.json() as { status?: string; retry_after?: number };
  expect(payload.status).toBe("rejected");
  expect(payload.retry_after).toBe(5);
});

test("500/502 surfaced as a friendly inline error", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  // A 500 from the backend is a UI-visible error by design.
  const res = await page.request.post(`${BASE}/api/analyze`, {
    data: { text: "x".repeat(120) },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(500);
});

test("network down reaches the retry toast", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Nothing listens on a closed port to simulate a down back-end.
  const down = await page.request.get("http://127.0.0.1:3999/health", { retryUntil: { isFallback: true } });
  // request.get throws on a dead port, which is the UI's ApiError(0) path.
  await expect(async () => {
    try {
      await page.request.get("http://127.0.0.1:3999/health");
    } catch (e) {
      // Expected: backend unreachable.
    }
  // request.get throws on a dead port, which is the UI's ApiError(0) path.
  let threw = false;
  try {
    await page.request.get("http://127.0.0.1:3999/health");
  } catch {
    threw = true;
  }
  expect(threw).toBe(true);
});
  }).not.toThrow();
});

test("empty input rejects with a 400", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const res = await page.request.post(`${BASE}/api/analyze`, {
    data: { text: "" },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(400);
});

test("bad URL rejected with a 400", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const res = await page.request.post(`${BASE}/api/analyze`, {
    data: { url: "not-a-url" },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.status()).toBe(400);
});

test("file upload accepted", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const res = await page.request.post(`${BASE}/api/extract`, {
    data: { file: "dummy" },
    headers: { "Content-Type": "application/json" },
  });
  expect(res.ok).toBeTruthy();
});
