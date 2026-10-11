/**
 * The voice of SlopTotal — a deadpan forensic lab that files your prose as
 * evidence and then roasts it.
 *
 * Design rule: the UI is a calm, paper-and-ink evidence board; the *words* do the
 * heckling. Every line is written for an audience of developers who have, at some
 * point, shipped a `TODO: fix later` and called it a roadmap.
 *
 * Keep copy here so tone stays consistent and the calibrated Python thresholds in
 * the backend never have to care about our jokes.
 */

import type { VerdictTier } from "./types";

/** The big verdict, keyed by score band tier. Rendered like a rubber stamp. */
export interface VerdictCopy {
  tier: VerdictTier;
  /** The stamp text. Short, punchy, screenshot-worthy. */
  headline: string;
  /** A one-line follow-up, filed as the "finding". */
  sub: string;
  /** A developer-flavoured "receipt" that names the tell. */
  tell: string;
  /** Semantic colour (hex) for the gauge arc and accents. */
  color: string;
}

export const VERDICTS: Record<VerdictTier, VerdictCopy> = {
  human: {
    tier: "human",
    headline: "Certified Human Slop",
    sub: "Organic, artisanal, and beautifully inefficient. No model was harmed — though several were embarrassed.",
    tell: "Exhibit A: real typos, strong opinions, and a sentence that goes absolutely nowhere. Charming.",
    color: "#2d8a4e",
  },
  suspicious: {
    tier: "suspicious",
    headline: "Suspiciously Fluent",
    sub: "This prose is *awfully* smooth. We're not saying an LLM wrote it. We're just filing it under 'review'.",
    tell: "Exhibit B: suspiciously balanced paragraphs and a bulleted list where none was strictly required.",
    color: "#c98b1d",
  },
  ai: {
    tier: "ai",
    headline: "Synthetic Slop Detected",
    sub: "A masterclass in 'delve', 'tapestry', and things that are 'not just X, but Y'. Bold of you to ship this.",
    tell: "Exhibit C: delves, tapestries, unwavering commitment, and a conclusion that summarises the summary.",
    color: "#b5282e",
  },
};

/** Rotating gags shown while a scan runs. */
export const LOADING_LINES = [
  "Interrogating the language model…",
  "Counting how many times you wrote 'delve'…",
  "Asking GPT-2 if it recognises its own handwriting…",
  "Measuring burstiness. Yours appears to be flatlined…",
  "Running 23 engines that never needed a coffee break…",
  "Cross-referencing against the tapestry corpus…",
];

/** Rotating gags for the Render cold-start banner. */
export const COLD_START_LINES = [
  "Render's free instance is waking up from its nap. This is the part where you go make coffee…",
  "Cold-starting on 512 MB of RAM. We've seen tougher boxes run Doom.",
  "Waking 23 engines. The GPT-2 needs its espresso before it'll judge you…",
  "Render is yawning. Should be back before your kettle boils…",
  "Free-tier boot in progress. Somewhere, a server is stretching…",
];

/** Primary hero copy on the landing page. */
export const HERO = {
  badge: "23 engines · one honest verdict",
  titleLead: "Was it written by a human, or by a very",
  titleAccent: "confident autocomplete",
  titleTrail: "?",
  subtitle:
    "Paste text, drop a URL, or upload a document. We run it past 23 detection engines and file a verdict with all the subtlety of a code review at 4:55pm on a Friday.",
};

/** Textarea placeholder — the first joke a user meets. */
export const PLACEHOLDER =
  "Paste the text you want to analyse… before ChatGPT takes your job (it's coming for the TODO comments first)";

/** Button + control labels. */
export const BUTTONS = {
  scan: "Run Analysis",
  purge: "Clear",
  inspect: "Inspect Engines",
  scanning: "Analysing…",
  reset: "New Scan",
  retry: "Retry",
  paste: "Paste from clipboard",
  dropFile: "Drop a file, or click to browse",
  extracting: "Reading your document like it owes us money…",
};

/** Header status pill copy. */
export const STATUS_LABELS = {
  checking: "Waking backend…",
  online: "Backend online",
  degraded: "Running on fumes",
  offline: "Backend napping",
  enginesLoaded: (loaded: number, total: number) => `${loaded}/${total} engines loaded`,
};

/** Microcopy under the URL input. */
export const URL_HINT =
  "We fetch the page and read its main prose. Public URLs only — we refuse to poke your router.";

/** File dropzone supporting-types line. */
export const FILE_HINT = "PDF, Word (.docx) or plain text — up to 10 MB";

/** Footer tagline. */
export const FOOTER =
  "Built by humans who mass-produce slop and then judge it. Every engine runs on this server; nothing is sent to third parties.";

/** Empty-state line before the first scan. */
export const EMPTY_RESULTS =
  "No verdict filed yet. Paste something suspicious and let the engines do the roasting.";
