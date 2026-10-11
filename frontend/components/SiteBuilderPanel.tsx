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
      <h3 className="flex items-center gap-2 font-display text-xl font-normal text-ink">
        <Hammer className="h-4 w-4 text-stamp" />
        Site fingerprints
      </h3>

      <div
        className={cn(
          "rounded border px-3.5 py-3",
          hasBuilders
            ? "border-stamp-muted border-l-[3px] border-l-stamp bg-stamp-bg"
            : "border-[#a9d8b8] border-l-[3px] border-l-clean bg-[#e6f4eb]",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2 text-[13px] font-medium",
            hasBuilders ? "text-slop" : "text-clean",
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
          <p className="mt-1 font-mono text-xs text-dim">
            Generator tag: <span className="text-slate">{generator}</span>
          </p>
        )}
      </div>

      {hasBuilders && (
        <div className="grid gap-2 sm:grid-cols-2">
          {builders.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded border border-rule-light bg-cream p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">{b.name}</span>
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
                    b.confidence === "confirmed"
                      ? "border-stamp-muted bg-stamp-bg text-slop"
                      : "border-[#e9cf95] bg-[#fdf4e0] text-warn",
                  )}
                >
                  {b.confidence}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {b.evidence.map((ev) => (
                  <li key={ev} className="flex items-start gap-1.5 text-xs font-light text-dim">
                    <CircleHelp className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
                    {ev}
                  </li>
                ))}
              </ul>
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono text-[10px] text-stamp hover:underline"
              >
                {b.url}
              </a>
            </motion.div>
          ))}
        </div>
      )}

      {site.text && (
        <p className="font-mono text-xs text-muted">
          On-page text quick score: {Math.round(site.text.score)} ({site.text.verdict})
        </p>
      )}

      <p className="text-xs font-light text-muted">
        Evidence, not a probability: no marker does not mean the code was written by hand.
      </p>
    </div>
  );
}
