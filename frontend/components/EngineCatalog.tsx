"use client";

import { motion } from "framer-motion";
import { ExternalLink, Loader2, Microscope } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { EngineMeta } from "@/lib/types";

const TYPE_STYLE: Record<string, string> = {
  neural: "text-neon-violet border-neon-violet/40 bg-neon-violet/10",
  statistical: "text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10",
  linguistic: "text-neon-lime border-neon-lime/40 bg-neon-lime/10",
  embedding: "text-neon-magenta border-neon-magenta/40 bg-neon-magenta/10",
  classifier: "text-neon-amber border-neon-amber/40 bg-neon-amber/10",
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
      <p className="rounded-xl border border-slop-ai/30 bg-slop-ai/5 px-4 py-3 text-sm text-slop-ai">
        {error}
      </p>
    );
  }

  if (!engines) {
    return (
      <div className="flex items-center gap-2 px-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Interrogating the engine rack…
      </div>
    );
  }

  const byType = engines.reduce<Record<string, EngineMeta[]>>((acc, e) => {
    (acc[e.engine_type] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Microscope className="h-4 w-4 text-neon-cyan" />
        <h3 className="font-mono text-sm uppercase tracking-widest text-neon-cyan/80">
          Detection Engine Roster
        </h3>
        <span className="ml-auto font-mono text-xs text-slate-500">
          {engines.length} engines
        </span>
      </div>

      {Object.entries(byType).map(([type, list]) => (
        <div key={type}>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            {type} · {list.length}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e, i) => (
              <motion.div
                key={e.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="group rounded-xl border border-white/5 bg-void-900/40 p-3 transition hover:border-white/15"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold",
                      TYPE_STYLE[e.engine_type] ?? "text-slate-400 border-white/10",
                    )}
                  >
                    {e.code}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-200">
                    {e.name}
                  </span>
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-slate-600 transition hover:text-neon-cyan"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                  {e.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
