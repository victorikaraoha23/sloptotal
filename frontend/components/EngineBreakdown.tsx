"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { normalizeScore } from "@/lib/verdict";
import type { EngineRow } from "@/lib/types";

/** Colour a single engine bar by its own 0–100 score. */
function barColor(score: number): string {
  if (score < 40) return "bg-slop-human";
  if (score < 65) return "bg-slop-suspicious";
  return "bg-slop-ai";
}

const TYPE_LABEL: Record<string, string> = {
  neural: "Neural",
  statistical: "Statistical",
  linguistic: "Linguistic",
  embedding: "Embedding",
  classifier: "Classifier",
};

export interface EngineBreakdownProps {
  engines: EngineRow[];
  flagged?: number;
  total?: number;
}

export default function EngineBreakdown({
  engines,
  flagged,
  total,
}: EngineBreakdownProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Group engines by type so the dashboard reads like the backend's tiers.
  const groups = engines.reduce<Record<string, EngineRow[]>>((acc, e) => {
    const key = e.engineType ?? "classifier";
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  const orderedGroups = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm uppercase tracking-widest text-neon-cyan/80">
          Engine Breakdown
        </h3>
        {typeof flagged === "number" && typeof total === "number" && (
          <span className="rounded-full border border-white/10 bg-void-900/70 px-3 py-1 font-mono text-xs text-slate-400">
            {flagged}/{total} engines flagged
          </span>
        )}
      </div>

      {orderedGroups.map(([type, rows]) => (
        <div key={type}>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            {TYPE_LABEL[type] ?? type} · {rows.length}
          </p>
          <div className="space-y-1.5">
            {rows.map((e, i) => {
              const score = normalizeScore(e.score);
              const isOpen = openKey === e.key;
              return (
                <motion.div
                  key={e.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="overflow-hidden rounded-lg border border-white/5 bg-void-900/40"
                >
                  <button
                    onClick={() => setOpenKey(isOpen ? null : e.key)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
                  >
                    <span className="w-40 shrink-0 truncate font-mono text-xs text-slate-300 sm:w-52">
                      {e.name}
                    </span>

                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-void-700">
                      <motion.span
                        className={cn("absolute inset-y-0 left-0 rounded-full", barColor(score))}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.6, delay: i * 0.02 }}
                      />
                    </span>

                    <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-slate-400">
                      {Math.round(score)}%
                    </span>

                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 border-t border-white/5 px-3 py-3">
                          {(e.description || e.details) && (
                            <p className="text-xs text-slate-400">
                              {e.details || e.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[10px] uppercase tracking-wide text-slate-500">
                            <span>verdict: {e.verdict}</span>
                            {e.engineType && <span>· {e.engineType}</span>}
                            {e.url && (
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-neon-cyan/70 hover:text-neon-cyan"
                              >
                                source <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
