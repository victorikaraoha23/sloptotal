# SlopTotal — Frontend

A dark, sarcastic, cyberpunk-terminal dashboard for the [SlopTotal](https://github.com/pablocaeg/sloptotal)
open-source AI text detector. Next.js 14 (App Router) + Tailwind CSS, built to
deploy on **Vercel** and talk to the FastAPI backend on **Render**.

It handles the sad reality of a free-tier Render backend (cold starts, 512 MB RAM,
occasional naps) with grace, humour, and a status badge.

---

## ⚠️ Read this before deploying: CORS + build-time env

Your backend locks CORS to a fixed allow-list (see `allow_origin_regex` in
`app/main.py`):

```
^(chrome-extension://.*|http://localhost(:\d+)?|https://sloptotal\.com|https://pablocaeg\.github\.io)$
```

A Vercel domain is **not** in that list. If the browser calls Render directly, the
response is blocked. There are two ways to fix it — pick **one**.

### Option A — Same-origin proxy (recommended, zero backend changes)

Vercel rewrites `/api/*` and `/health` to Render **server-side**. The browser only
ever talks to your Vercel origin, so CORS never applies.

1. In the Vercel dashboard → **Settings → Environment Variables**, add:

   | Key                   | Value                                   | Scope        |
   | --------------------- | --------------------------------------- | ------------ |
   | `RENDER_BACKEND_URL`  | `https://your-render-app.onrender.com`  | All envs     |

2. Leave `NEXT_PUBLIC_API_URL` **empty / unset**.
3. (Optional) set `NEXT_PUBLIC_GITHUB_URL` if you fork the repo.

> **Build-time gotcha:** Next.js evaluates `rewrites()` when the project is
> **built**, not at request time. Vercel injects your env vars during the build,
> so this "just works" on Vercel. But it means: if you change
> `RENDER_BACKEND_URL` later, you must **redeploy** for the rewrite to update.

### Option B — Call Render directly (requires a backend change)

1. Set `NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com` in Vercel.
2. Add your Vercel origin to `CORSMiddleware.allow_origin_regex` in
   `app/main.py`, then redeploy Render. Otherwise the browser blocks the response.

---

## Local development

```bash
cp .env.local.example .env.local   # then fill in values
npm install
npm run dev                        # http://localhost:3000
```

To test the same-origin proxy locally, set `RENDER_BACKEND_URL` in `.env.local`
and restart `next dev` (rewrites are re-read on dev-server restart).

---

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # eslint (next lint)
npm run typecheck   # tsc --noEmit
```

---

## What it talks to (backend endpoints)

| Method | Path                  | Used for                                             |
| ------ | --------------------- | ---------------------------------------------------- |
| GET    | `/health`             | Header status badge (engine load counts, cold state) |
| GET    | `/api/engines`        | "Inspect Engines" roster, grouped by engine type     |
| POST   | `/api/analyze`        | **Full** scan (23 engines, calibrated ensemble)      |
| POST   | `/api/quick-score`    | **Quick** scan (4 ML classifiers, ~300–500 ms)       |
| POST   | `/api/extract`        | File upload → extracted text (`.txt/.md/.pdf/.docx`) |
| POST   | `/api/scan/site`      | URL scan → AI-app-builder fingerprints               |
| GET    | `/api/queue/ticket/*` | Polling for a 202-queued analysis (backpressure)     |

### Notes on the API contract

- `POST /api/analyze` can return **200** (immediate report), **202** (`{ticket_id}` —
  the client polls the ticket endpoint), **400** (too short), **429** (busy —
  honours `retry_after`), **502** (URL fetch failed), or **500**. The client handles
  all of these with friendly fallbacks.
- Engine scores in a full report are **0–1**; quick-score engine scores are **0–100**.
  `lib/api.ts` normalises both to 0–100 for display.
- Verdict tiers for the big banner are the design-led bands (0–25 / 26–60 / 61–100).
  The backend's own measured `overall_verdict` string is shown underneath so the UI
  never contradicts the calibrated score.

---

## Project structure

```
app/
  layout.tsx            metadata + fonts + paper shell (server component)
  page.tsx              hero + <Dashboard/> (server component)
  globals.css           forensic theme tokens, paper grain, shared classes
components/
  Dashboard.tsx         client orchestrator: tabs, scan state, cold-start, errors
  Header.tsx            ink masthead, live /health status pill, GitHub link
  ScanSection.tsx       tabbed input: text (counter + clipboard) / URL / file dropzone
  ResultsDashboard.tsx  gauge, stamped verdict, stat pills, engine grid
  ScoreGauge.tsx        animated SVG ring, serif score, green→amber→red
  EngineBreakdown.tsx   per-engine accordion grouped by type
  EngineCatalog.tsx     "Inspect Engines" roster from /api/engines
  RenderColdStartAlert.tsx  cold-start banner + backend-down toast
lib/
  api.ts                resilient client (timeout, retry, 202 polling, cold-start hint)
  types.ts              TypeScript types mirroring the FastAPI schemas
  verdict.ts            score bands, colour interpolation, tier mapping
  copy.ts               ALL user-facing copy (verdicts, jokes, labels, hints)
  cn.ts                 clsx + tailwind-merge helper
```

---

## Design language

Ports the original `web/` UI's **"Forensic Lab / Evidence Board"** aesthetic so the
two frontends read as one product:

- **Warm paper canvas**, near-black **ink** masthead with a red bottom rule, and a
  single **red "stamp"** accent for verdicts — deliberately calm and deadpan.
- **Editorial type**: *Instrument Serif* for the logo, headlines and scores;
  *Lexend* for body; *DM Mono* for codes, labels and metadata. All self-hosted via
  `next/font` (no external requests).
- Verdicts land as a rotated **rubber-stamp** headline; engine rows read like filed
  evidence (code chip, name, verdict badge, score bar).
- Motion via **Framer Motion** (stamp-in, layout tab underline, gauge spring,
  accordion height). Icons via **Lucide React**; no other UI framework.
- All the personality lives in **`lib/copy.ts`** — the visuals stay restrained while
  the words heckle. Fully responsive and `prefers-reduced-motion` safe.

