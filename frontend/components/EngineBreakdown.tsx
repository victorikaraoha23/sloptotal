"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { normalizeScore } from "@/lib/verdict";
import type { EngineRow } from "@/lib/types";

/** Colour a single engine bar by its own 0–100 score. */
function barColor(score: number): string {
  if (score < 40) return "bg-clean";
  if (score < 65) return "bg-warn";
  return "bg-slop";
}

/** Verdict → badge classes (mirrors report.html's verdict-badge). */
function verdictBadge(v: string): string {
  if (v === "slop") return "bg-stamp-bg text-slop border-stamp-muted";
  if (v === "suspicious") return "bg-[#fdf4e0] text-warn border-[#e9cf95]";
  return "bg-[#e6f4eb] text-clean border-[#a9d8b8]";
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

  // Group engines by type so the breakdown reads like the backend's tiers.
  const groups = engines.reduce<Record<string, EngineRow[]>>((acc, e) => {
    const key = e.engineType ?? "classifier";
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  const orderedGroups = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b border-rule pb-3">
        <h3 className="font-display text-xl font-normal text-ink">Engine Breakdown</h3>
        {typeof flagged === "number" && typeof total === "number" && (
          <span className="font-mono text-xs tabular-nums text-dim">
            {flagged} / {total} flagged
          </span>
        )}
      </div>

      <div className="space-y-5">
        {orderedGroups.map(([type, rows]) => (
          <div key={type}>
            <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-dim">
              {TYPE_LABEL[type] ?? type}
            </p>
            <div className="space-y-1">
            {rows.map((e, i) => {
              const score = normalizeScore(e.score);
              const isOpen = openKey === e.key;
              return (
                <motion.div
                  key={e.key}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.015 }}
                  className="overflow-hidden rounded border border-rule-light bg-white/50"
                >
                  <button
                    onClick={() => setOpenKey(isOpen ? null : e.key)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-paper-warm/60"
                  >
                    {/* Engine code chip */}
                    <span className="grid h-6 w-7 shrink-0 place-items-center rounded-sm border border-rule bg-paper-warm font-mono text-[10px] font-medium uppercase text-dim">
                      {(e.key ?? e.name).slice(0, 2).toUpperCase()}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                      {e.name}
                    </span>

                    {/* Verdict badge */}
                    <span
                      className={cn(
                        "hidden shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide sm:inline-block",
                        verdictBadge(e.verdict),
                      )}
                    >
                      {e.verdict}
                    </span>

                    {/* Score bar */}
                    <span className="relative hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-paper-deep sm:block">
                      <motion.span
                        className={cn("absolute inset-y-0 left-0 rounded-full", barColor(score))}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.5, delay: i * 0.015 }}
                      />
                    </span>

                    <span className="w-10 shrink-0 text-right font-display text-[15px] italic tabular-nums text-slate">
                      {Math.round(score)}
                    </span>

                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
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
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 border-t border-rule-light px-3 py-3">
                          {(e.description || e.details) && (
                            <p className="text-xs font-light leading-relaxed text-slate">
                              {e.details || e.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wide text-muted">
                            {e.engineType && <span>· {e.engineType}</span>}
                            {e.url && (
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-stamp transition hover:underline"
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
    </div>
  );
}
