/**
 * Next.js config for the SlopTotal dashboard (Vercel deploy).
 *
 * ---------------------------------------------------------------------------
 * WHY THE REWRITE EXISTS (read this before "just" calling Render directly)
 * ---------------------------------------------------------------------------
 * The FastAPI backend on Render locks CORS to a fixed allow-list:
 *
 *   allow_origin_regex = ^(chrome-extension://.*|http://localhost(:\d+)?
 *                        |https://sloptotal\.com|https://pablocaeg\.github\.io)$
 *
 * A Vercel domain (https://<you>.vercel.app) is NOT in that list, so a browser
 * fetch straight at Render is rejected by CORS.
 *
 * Two ways to make it work, pick ONE:
 *
 *   A) SAME-ORIGIN PROXY (recommended — no backend change, no CORS at all).
 *      Set the SERVER-ONLY env var on Vercel:
 *          RENDER_BACKEND_URL=https://your-render-app.onrender.com
 *      Leave NEXT_PUBLIC_API_URL UNSET. Vercel forwards /api/* and /health to
 *      Render server-side; the browser only ever talks to your Vercel origin.
 *
 *   B) DIRECT (call Render from the browser).
 *      Set NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com AND add
 *      your Vercel origin to the backend's CORSMiddleware allow_origin_regex
 *      in app/main.py, then redeploy Render.
 *
 * The client code (lib/api.ts) uses relative URLs when NEXT_PUBLIC_API_URL is
 * empty, so the SAME bundle works in both modes.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    const backend = (process.env.RENDER_BACKEND_URL || "").replace(/\/+$/, "");
    if (!backend) return [];
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/health", destination: `${backend}/health` },
    ];
  },

  // Backend responses are dynamic; never cache them at the edge.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
