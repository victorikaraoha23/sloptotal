"use client";

import { motion } from "framer-motion";
import { BadgeCheck, CircleHelp, Hammer, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SiteScanResult } from "@/lib/types";

/** Renders the AI-app-builder fingerprints from POST /api/scan/site. */
export default function SiteBuilderPanel({ site }: { site: SiteScanResult }) {
  const { builders, generator, verdict } = site.site;
  const hasBuilders = builders.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Hammer className="h-4 w-4 text-neon-violet" />
        <h3 className="font-mono text-sm uppercase tracking-widest text-neon-violet/80">
          Vibe-Coded Site Builder Fingerprints
        </h3>
      </div>

      <div
        className={cn(
          "rounded-xl border px-4 py-3",
          hasBuilders
            ? "border-neon-violet/40 bg-neon-violet/10"
            : "border-slop-human/30 bg-slop-human/5",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            hasBuilders ? "text-neon-violet" : "text-slop-human",
          )}
        >
          {hasBuilders ? (
            <BadgeCheck className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {verdict}
        </p>
        {generator && (
          <p className="mt-1 font-mono text-xs text-slate-400">
            Generator tag: <span className="text-slate-200">{generator}</span>
          </p>
        )}
      </div>

      {hasBuilders && (
        <div className="grid gap-3 sm:grid-cols-2">
          {builders.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/10 bg-void-900/50 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100">{b.name}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                    b.confidence === "confirmed"
                      ? "bg-slop-ai/20 text-slop-ai"
                      : "bg-slop-suspicious/20 text-slop-suspicious",
                  )}
                >
                  {b.confidence}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {b.evidence.map((ev) => (
                  <li
                    key={ev}
                    className="flex items-start gap-1.5 text-xs text-slate-400"
                  >
                    <CircleHelp className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
                    {ev}
                  </li>
                ))}
              </ul>
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono text-[10px] text-neon-cyan/70 hover:text-neon-cyan"
              >
                {b.url}
              </a>
            </motion.div>
          ))}
        </div>
      )}

      {site.text && (
        <p className="font-mono text-xs text-slate-500">
          On-page text quick score: {Math.round(site.text.score)}% ({site.text.verdict})
        </p>
      )}
    </div>
  );
}
