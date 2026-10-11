#!/usr/bin/env node

/**
 * Mock backend for the Playwright e2e suite.
 *
 * Serves the production front-end (built by `next start`) and mocks the API
 * surface the dashboard's `lib/api.ts` talks to:
 *
 *   GET  /health
 *   POST /api/quick-score
 *   POST /api/analyze        (200 report | 202 queued | 429 rejected)
 *   GET  /api/queue/ticket/:id
 *   POST /api/extract
 *
 * The front-end build is served from the repo root's `.next/standalone`.
 */

import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.PORT || 3210);
const DIST = join(ROOT, ".next", "standalone");

const htmlFile = join(DIST, "index.html");
const html = existsSync(htmlFile) ? readFileSync(htmlFile, "utf8") : "";

const QUICK_OK = {
  score: 12.4,
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

let analyzeCallCount = 0;

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { status: "healthy", engines: { total: 23, loaded: 23, failed: [] } });
  }

  if (req.method === "POST" && url.pathname === "/api/quick-score") {
    try {
      const body = JSON.parse((req.body || "{}"));
      if (body.text && body.text.length < 50) return json(res, 400, { error: "Text must be at least 50 characters." });
    } catch {}
    return json(res, 200, QUICK_OK);
  }

  if (req.method === "POST" && url.pathname === "/api/analyze") {
    analyzeCallCount += 1;
    const body = req.body ? JSON.parse(req.body) : {};
    if (body.text === "") return json(res, 400, { error: "Text must be at least 50 characters." });
    if (typeof body.url !== "undefined" && body.url !== "" && body.url !== "not-a-url")
      return json(res, 400, { error: "Invalid URL." });
    if (analyzeCallCount % 4 === 0) return json(res, 429, { status: "rejected", retry_after: 5 });
    if (analyzeCallCount % 3 === 0) return json(res, 202, { status: "queued", ticket_id: "t" + analyzeCallCount, position: 1, estimated_wait_ms: 10 });
    return json(res, 200, FULL_REPORT);
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/queue/ticket/")) {
    const id = url.pathname.split("/").pop() || "t";
    if (id === "t-rejected") return json(res, 429, { status: "rejected", retry_after: 5 });
    return json(res, 200, { status: "completed", ...FULL_REPORT, ticket_id: id });
  }

  if (req.method === "POST" && url.pathname === "/api/extract") {
    return json(res, 200, { extracted: 999, chars: "hello world" });
  }

  if ((req.method === "GET" || req.method === "HEAD") && (url.pathname === "/" || url.pathname.startsWith("/_next/") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".png") || url.pathname.endsWith(".svg"))) {
    const file = join(DIST, url.pathname.replace(/^\/_next\//, "_next/").replace(/^\/?/, ""));
    if (existsSync(file)) {
      const contentType = extname(file) === ".css"
        ? "text/css"
        : extname(file) === ".js"
          ? "application/javascript"
          : extname(file) === ".png" ? "image/png"
          : extname(file) === ".svg" ? "image/svg+xml"
          : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      return res.end(readFileSync(file));
    }
  }

  if (url.pathname === "/") return res.end(html || `{"error":"no index"}`);
  return json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.error(`[mock-backend] serving front-end from ${DIST} on http://127.0.0.1:${PORT}`);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
