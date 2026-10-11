// Shared types mirroring the live FastAPI backend (app/schemas.py + routes).
// Keep field names EXACTLY as the backend serialises them (snake_case) so the
// API responses map 1:1 with zero translation glue.

/** One engine's result inside a full AnalysisReport (POST /api/analyze). */
export interface EngineResultItem {
  engine_name: string;
  /** 0.0 – 1.0 */
  score: number;
  /** Backend enum: "clean" | "suspicious" | "slop" */
  verdict: string;
  details: string;
  description: string;
}

/** Full report returned by POST /api/analyze (AnalysisReport.model_dump()). */
export interface AnalysisReport {
  id: string;
  source_type: "text" | "url";
  source: string;
  text_excerpt: string;
  word_count: number;
  engine_results: EngineResultItem[];
  /** 0.0 – 100.0 */
  overall_score: number;
  /** e.g. "Clean — likely human-written" | "Likely AI-generated" | "Slop detected" */
  overall_verdict: string;
  engines_flagged: number;
  engines_total: number;
  input_chars?: number | null;
  created_at: string;
  language?: string;
  language_support?: string;
}

/** One engine in the fast quick-score breakdown (score is 0–100 here). */
export interface QuickEngineItem {
  engine: string;
  /** 0 – 100 */
  score: number;
  verdict: string;
}

/** Fast response from POST /api/quick-score. */
export interface QuickScoreResult {
  /** 0 – 100 */
  score: number;
  verdict: "clean" | "mixed" | "ai";
  confidence: string;
  engines: QuickEngineItem[];
  elapsed_ms: number;
}

/** 202 "queued" response from POST /api/analyze when the server is at capacity. */
export interface QueuedResponse {
  status: "queued";
  ticket_id: string;
  position: number;
  estimated_wait_ms: number;
}

/** Engine metadata from GET /api/engines. */
export interface EngineMeta {
  key: string;
  name: string;
  description: string;
  code: string;
  engine_type: string;
  url: string;
}

/** One AI-app-builder fingerprint from POST /api/scan/site. */
export interface BuilderFingerprint {
  name: string;
  url: string;
  confidence: "confirmed" | "possible";
  evidence: string[];
}

export interface SiteScanResult {
  url: string;
  final_url: string;
  site: {
    builders: BuilderFingerprint[];
    generator: string | null;
    verdict: string;
  };
  text: QuickScoreResult | null;
}

/** Shape of GET /health, used by the status badge. */
export interface HealthResponse {
  status: "healthy" | "degraded";
  database: { status: string };
  engines: {
    total: number;
    loaded: number;
    failed: string[];
  };
  queue?: Record<string, unknown>;
}

/** A single AI-vs-human band, derived from the 0–100 overall score. */
export type VerdictTier = "human" | "suspicious" | "ai";

/** A discriminated result the dashboard can render regardless of endpoint used. */
export interface ScanResult {
  /** 0 – 100 */
  score: number;
  /** The humorous, design-led banner tier. */
  tier: VerdictTier;
  /** The backend's own verdict string, when available (full analyze). */
  backendVerdict?: string;
  /** Normalised per-engine rows for the breakdown grid. */
  engines: EngineRow[];
  enginesFlagged?: number;
  enginesTotal?: number;
  wordCount?: number;
  elapsedMs?: number;
  reportId?: string;
  /** Present when the input was a URL and builder fingerprints were found. */
  site?: SiteScanResult;
}

/** A per-engine row normalised for display (score always 0–100). */
export interface EngineRow {
  key: string;
  name: string;
  score: number;
  verdict: string;
  details?: string;
  description?: string;
  engineType?: string;
  url?: string;
}
