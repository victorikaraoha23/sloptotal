"use client";

import { motion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { EngineMeta } from "@/lib/types";

// Subtle type chips in the forensic palette.
const TYPE_STYLE: Record<string, string> = {
  neural: "text-stamp border-stamp-muted",
  statistical: "text-warn border-[#e9cf95]",
  linguistic: "text-clean border-[#a9d8b8]",
  embedding: "text-dim border-rule",
  classifier: "text-slate border-rule",
};

/**
 * The "Inspect Engines" catalog. Fetches GET /api/engines and shows every
 * detection engine the backend runs, grouped and colour-coded by type.
 */
export default function EngineCatalog() {
  const [engines, setEngines] = useState<EngineMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/engines`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setEngines(Array.isArray(data) ? data : []))
      .catch((e) => {
        if (e.name !== "AbortError") setError("Couldn't load the engine roster.");
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <p className="rounded border border-stamp-muted border-l-[3px] border-l-stamp bg-stamp-bg px-3.5 py-2.5 text-[13px] text-slop">
        {error}
      </p>
    );
  }

  if (!engines) {
    return (
      <div className="flex items-center gap-2 px-1 py-8 text-sm font-light text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Interrogating the engine rack…
      </div>
    );
  }

  const byType = engines.reduce<Record<string, EngineMeta[]>>((acc, e) => {
    (acc[e.engine_type] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex items-end justify-between border-b border-rule pb-3">
        <div>
          <h3 className="font-display text-xl font-normal text-ink">Detection Engines</h3>
          <p className="mt-1 text-[13px] font-light text-dim">
            Each engine uses a different methodology. Results are weighted and combined into a single forensic score.
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-dim">
          {engines.length}
        </span>
      </div>

      <div className="space-y-6">
        {Object.entries(byType).map(([type, list]) => (
          <div key={type}>
            <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
              {type} · {list.length}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e, i) => (
                <motion.div
                  key={e.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group rounded border border-rule-light bg-cream p-3 transition hover:border-stamp-muted"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase",
                        TYPE_STYLE[e.engine_type] ?? "text-dim border-rule",
                      )}
                    >
                      {e.code}
                    </span>
                    <span className="truncate text-[13px] font-medium text-ink">{e.name}</span>
                    {e.url && (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-muted transition group-hover:text-stamp"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-light leading-relaxed text-dim">
                    {e.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

