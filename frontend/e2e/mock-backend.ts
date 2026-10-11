/**
 * Playwright helpers for the mock backend.
 *
 * The e2e suite spins up its own mock backend on 127.0.0.1:3210 via
 * `npm run e2e:serve` (see playwright.config.ts webServer), so the browser
 * never touches Render. The mock replicates the contract the dashboard's
 * `lib/api.ts` expects:
 *
 *   GET  /health
 *   POST /api/quick-score
 *   POST /api/analyze        (200 full report | 202 {ticket_id} | 429 full queue)
 *   GET  /api/queue/ticket/:id
 */

export const BASE = "http://127.0.0.1:3210";
