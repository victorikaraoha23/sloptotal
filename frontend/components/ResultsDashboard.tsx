"use client";

import { motion } from "framer-motion";
import { Clock, FileText, Flag, Hash, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { verdictFor } from "@/lib/verdict";
import { BUTTONS } from "@/lib/copy";
import type { ScanResult } from "@/lib/types";
import EngineBreakdown from "@/components/EngineBreakdown";
import ScoreGauge from "@/components/ScoreGauge";
import SiteBuilderPanel from "@/components/SiteBuilderPanel";

export interface ResultsDashboardProps {
  result: ScanResult;
  onReset: () => void;
}

export default function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const v = verdictFor(result.score);

  const stats: Array<{ icon: typeof Clock; label: string; value: string }> = [];
  if (typeof result.wordCount === "number") {
    stats.push({ icon: FileText, label: "Words", value: result.wordCount.toLocaleString() });
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 22 }}
      className="mt-6 space-y-8"
    >
      {/* Report header: gauge + verdict "stamp" */}
      <div className="card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <div className="shrink-0">
          <ScoreGauge value={result.score} />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="label mb-2 flex items-center justify-center gap-1.5 sm:justify-start">
            <span className="status-dot bg-clean" />
            Analysis complete
          </p>

          {/* The verdict, rendered as a rotated rubber stamp. */}
          <motion.h2
            key={v.headline}
            initial={{ opacity: 0, scale: 1.2, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className={cn("font-display text-display-sm font-normal italic", v.text)}
          >
            {v.headline}
          </motion.h2>

          <p className="mt-2 max-w-prose text-[14px] font-light leading-relaxed text-slate">
            {v.sub}
          </p>

          {/* The "tell" — a filed receipt. */}
          <p className="mt-3 max-w-prose border-l-2 border-rule bg-paper-warm/60 px-3 py-2 text-xs font-light leading-relaxed text-dim">
            {v.tell}
          </p>

          {result.backendVerdict && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-muted">
              backend verdict: <span className={cn("normal-case", v.text)}>{result.backendVerdict}</span>
            </p>
          )}

          {/* Stat pills */}
          {stats.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <span key={s.label} className="pill">
                    <Icon className="mr-1 h-3 w-3" />
                    {s.value} {s.label.toLowerCase()}
                  </span>
                );
              })}
            </div>
          )}

          <button onClick={onReset} className="btn-ghost mt-5">
            <RotateCcw className="h-3.5 w-3.5" /> {BUTTONS.reset}
          </button>
        </div>
      </div>

      {/* Engine breakdown */}
      {result.engines.length > 0 && (
        <div className="card p-6 sm:p-8">
          <EngineBreakdown
            engines={result.engines}
            flagged={result.enginesFlagged}
            total={result.enginesTotal}
          />
        </div>
      )}

      {/* Site builder fingerprints (URL scans only) */}
      {result.site && (
        <div className="card p-6 sm:p-8">
          <SiteBuilderPanel site={result.site} />
        </div>
      )}
    </motion.section>
  );
}


