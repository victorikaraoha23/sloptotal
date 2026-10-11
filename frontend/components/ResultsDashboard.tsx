"use client";

import { motion } from "framer-motion";
import { Clock, FileSearch, Flag, Hash, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { verdictFor } from "@/lib/verdict";
import type { ScanResult } from "@/lib/types";
import EngineBreakdown from "@/components/EngineBreakdown";
import ScoreGauge from "@/components/ScoreGauge";
import SiteBuilderPanel from "@/components/SiteBuilderPanel";

export interface ResultsDashboardProps {
  result: ScanResult;
  onReset: () => void;
}

export default function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const copy = verdictFor(result.score);

  const stats: Array<{ icon: typeof Clock; label: string; value: string }> = [];
  if (typeof result.wordCount === "number") {
    stats.push({ icon: FileSearch, label: "Words", value: String(result.wordCount) });
  }
  if (typeof result.enginesTotal === "number") {
    stats.push({ icon: Hash, label: "Engines", value: String(result.enginesTotal) });
  }
  if (typeof result.enginesFlagged === "number") {
    stats.push({ icon: Flag, label: "Flagged", value: String(result.enginesFlagged) });
  }
  if (typeof result.elapsedMs === "number") {
    stats.push({
      icon: Clock,
      label: "Elapsed",
      value: `${(result.elapsedMs / 1000).toFixed(1)}s`,
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="space-y-6"
    >
      {/* Gauge + verdict banner */}
      <div className="glass flex flex-col items-center gap-6 p-6 sm:p-8 md:flex-row md:items-center md:gap-10">
        <div className="shrink-0">
          <ScoreGauge value={result.score} />
        </div>

        <div className="min-w-0 flex-1 text-center md:text-left">
          <motion.h2
            key={copy.headline}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-balance text-2xl font-bold leading-tight sm:text-3xl",
              copy.text,
            )}
          >
            {copy.headline}
          </motion.h2>
          <p className="mt-2 max-w-prose text-sm text-slate-400">{copy.sub}</p>

          {result.backendVerdict && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-void-900/60 px-3 py-1.5 font-mono text-xs text-slate-300">
              <span className="text-slate-500">backend verdict:</span>
              <span className={copy.text}>{result.backendVerdict}</span>
            </p>
          )}

          {stats.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/5 bg-void-900/40 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
                      <Icon className="h-3 w-3" /> {s.label}
                    </div>
                    <div className="mt-0.5 font-mono text-lg font-semibold text-slate-200">
                      {s.value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={onReset}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-neon-cyan/40 hover:text-neon-cyan"
          >
            <RotateCcw className="h-4 w-4" /> Scan something else
          </button>
        </div>
      </div>

      {/* Engine breakdown */}
      {result.engines.length > 0 && (
        <div className="glass p-6 sm:p-8">
          <EngineBreakdown
            engines={result.engines}
            flagged={result.enginesFlagged}
            total={result.enginesTotal}
          />
        </div>
      )}

      {/* Site builder fingerprints (URL scans only) */}
      {result.site && (
        <div className="glass p-6 sm:p-8">
          <SiteBuilderPanel site={result.site} />
        </div>
      )}
    </motion.section>
  );
}
