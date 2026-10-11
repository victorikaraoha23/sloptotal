import type {
  AnalysisReport,
  EngineRow,
  HealthResponse,
  QuickScoreResult,
  ScanResult,
  SiteScanResult,
} from "./types";
import { normalizeScore, tierFromQuickVerdict, verdictFor } from "./verdict";

/**
 * Base URL for the backend.
 *
 * - If NEXT_PUBLIC_API_URL is set → call Render directly (Mode B, needs CORS).
 * - If empty → use relative "/api/..."; Vercel's rewrite proxy forwards these to
 *   Render server-side (Mode A, no CORS, recommended).
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so an empty value must fall back
 * to "" (relative), NOT to a hardcoded host.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** How long before we nudge the user that Render is probably cold-booting. */
const COLD_START_HINT_MS = 6000;
/** Hard ceiling for a single attempt. Render cold starts can be slow, but we bail
 *  so the UI can offer a retry instead of hanging forever. */
const REQUEST_TIMEOUT_MS = 120_000;

export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // Propagate an external abort (e.g. user clicked "Purge Text") into ours.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Core fetch wrapper: JSON, timeouts, cold-start hint, and friendly errors. */
async function request<T>(
  path: string,
  init: RequestInit & { onSlow?: () => void } = {},
): Promise<T> {
  const { onSlow, ...rest } = init;
  const url = `${API_BASE}${path}`;

  const slowTimer = onSlow ? setTimeout(onSlow, COLD_START_HINT_MS) : null;
  const { signal, clear } = withTimeout(rest.signal ?? undefined);

  try {
    const res = await fetch(url, {
      ...rest,
      signal,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(rest.headers ?? {}),
      },
    });

    // 202 → queued. analyze() handles polling; here we just surface the body.
    if (res.status === 202) return (await res.json()) as T;

    let data: unknown = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const message =
        (data as { error?: string })?.error ?? `The backend shrugged (HTTP ${res.status}).`;
      const retryAfter = Number(
        res.headers.get("retry-after") ?? (data as { retry_after?: number })?.retry_after,
      );
      throw new ApiError(message, res.status, Number.isFinite(retryAfter) ? retryAfter : undefined);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "The request timed out. Render's free instance may still be waking up — try again.",
        0,
      );
    }
    // Network-level failure (backend asleep, DNS, CORS block, offline).
    throw new ApiError(
      "Couldn't reach the detector. The Render instance might be napping, or CORS is blocking us.",
      0,
    );
  } finally {
    if (slowTimer) clearTimeout(slowTimer);
    clear();
  }
}

/** Normalise an AnalysisReport into the dashboard's ScanResult shape. */
function reportToScanResult(report: AnalysisReport): ScanResult {
  const score = normalizeScore(report.overall_score);
  const engines: EngineRow[] = report.engine_results.map((e) => ({
    key: e.engine_name,
    name: e.engine_name,
    score: normalizeScore(e.score * 100),
    verdict: e.verdict,
    details: e.details,
    description: e.description,
  }));
  return {
    score,
    tier: verdictFor(score).tier,
    backendVerdict: report.overall_verdict,
    engines,
    enginesFlagged: report.engines_flagged,
    enginesTotal: report.engines_total,
    wordCount: report.word_count,
    reportId: report.id,
  };
}

/** Poll a queued ticket until it resolves, or throw after a generous deadline. */
async function pollTicket(
  ticketId: string,
  onSlow?: () => void,
  signal?: AbortSignal,
): Promise<AnalysisReport> {
  const deadline = Date.now() + 150_000;
  // Start fast, ease off so we don't hammer a busy box.
  let delay = 1200;
  for (;;) {
    if (signal?.aborted) throw new ApiError("Cancelled.", 0);
    const res = await request<AnalysisReport & { status?: string }>(
      `/api/queue/ticket/${ticketId}`,
      { signal, onSlow },
    ).catch((e) => {
      // 404 = ticket expired/gone; treat like a fresh failure the UI can retry.
      if (e instanceof ApiError && e.status === 404) {
        throw new ApiError("The scan queue forgot about us. Please try again.", 404);
      }
      throw e;
    });

    // Completed reports come back as the AnalysisReport itself.
    if (res && (res as AnalysisReport).engine_results) return res as AnalysisReport;

    if (res && "status" in res) {
      const status = res.status;
      if (status === "rejected") {
        // The job was rejected while we were waiting (capacity full).
        // Surface like a 429 so the UI can offer a retry.
        const rej = res as unknown as { error?: string; retry_after?: number };
        throw new ApiError(rej.error ?? 'The queue is full. Try again shortly.', 429, rej.retry_after);
      }
      if (status === 'queued') {
        await sleep(delay);
        delay = Math.min(delay * 1.3, 4000);
        continue;
      }
    }

    if (Date.now() > deadline) {
      throw new ApiError(
        "This one's stuck in the queue behind a sleepy Render. Try a shorter text.",
        0,
      );
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.3, 4000);
  }
}

export interface AnalyzeArgs {
  text?: string;
  url?: string;
  onSlow?: () => void;
  signal?: AbortSignal;
}

/**
 * Full scan (all 23 engines) via POST /api/analyze. Transparently handles the
 * 202 "queued" path by polling the ticket endpoint.
 */
export async function analyze({ text, url, onSlow, signal }: AnalyzeArgs): Promise<ScanResult> {
  const body: Record<string, string> = {};
  if (url) body.url = url.trim();
  else if (text) body.text = text.trim();
  else throw new ApiError("Nothing to scan — paste some text first.", 400);

  const first = await request<AnalysisReport | { status: string; ticket_id?: string }>(
    "/api/analyze",
    { method: "POST", body: JSON.stringify(body), onSlow, signal },
  );

  if (first && "status" in first && first.status === "rejected") {
    // The submit-posted job was rejected (capacity full) right away.
    const rej = first as unknown as { error?: string; retry_after?: number };
    throw new ApiError(rej.error ?? 'The queue is full. Try again shortly.', 429, rej.retry_after);
  }

  if (first && (first as { ticket_id?: string }).ticket_id) {
    const report = await pollTicket((first as { ticket_id: string }).ticket_id, onSlow, signal);
    return reportToScanResult(report);
  }
  return reportToScanResult(first as AnalysisReport);
}

/** Fast scan (4 ML classifiers) via POST /api/quick-score. */
export async function quickScore(args: {
  text?: string;
  url?: string;
  onSlow?: () => void;
  signal?: AbortSignal;
}): Promise<ScanResult> {
  const body: Record<string, string> = {};
  if (args.url) body.url = args.url.trim();
  else if (args.text) body.text = args.text.trim();
  else throw new ApiError("Nothing to scan — paste some text first.", 400);

  const q = await request<QuickScoreResult>("/api/quick-score", {
    method: "POST",
    body: JSON.stringify(body),
    onSlow: args.onSlow,
    signal: args.signal,
  });

  const score = normalizeScore(q.score);
  const engines: EngineRow[] = (q.engines ?? []).map((e) => ({
    key: e.engine,
    name: e.engine,
    score: normalizeScore(e.score),
    verdict: e.verdict,
  }));

  return {
    score,
    tier: tierFromQuickVerdict(q.verdict),
    backendVerdict: q.verdict,
    engines,
    enginesTotal: engines.length,
    elapsedMs: q.elapsed_ms,
  };
}

/** Extract text from an uploaded document via POST /api/extract (multipart). */
export async function extractDocument(file: File): Promise<{
  text: string;
  filename: string;
  word_count: number;
}> {
  const form = new FormData();
  form.append("file", file);
  const url = `${API_BASE}/api/extract`;

  const { signal, clear } = withTimeout();
  try {
    const res = await fetch(url, { method: "POST", body: form, signal });
    const data = (await res.json().catch(() => null)) as {
      text?: string;
      filename?: string;
      word_count?: number;
      error?: string;
    } | null;
    if (!res.ok) {
      throw new ApiError(data?.error ?? `Upload failed (HTTP ${res.status}).`, res.status);
    }
    return {
      text: data?.text ?? "",
      filename: data?.filename ?? file.name,
      word_count: data?.word_count ?? 0,
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Couldn't upload that file. Is the backend awake?", 0);
  } finally {
    clear();
  }
}

/** Site-builder + text scan via POST /api/scan/site. */
export async function scanSite(args: {
  url: string;
  onSlow?: () => void;
  signal?: AbortSignal;
}): Promise<SiteScanResult> {
  return request<SiteScanResult>("/api/scan/site", {
    method: "POST",
    body: JSON.stringify({ url: args.url.trim(), include_text: true }),
    onSlow: args.onSlow,
    signal: args.signal,
  });
}

/** Backend health for the status badge. */
export async function getHealth(signal?: AbortSignal): Promise<HealthResponse | null> {
  try {
    return await request<HealthResponse>("/health", { signal });
  } catch {
    return null; // Badge shows "offline / napping" on failure.
  }
}

