"use client";

import { motion } from "framer-motion";
import { Activity, Github, Loader2, MoonStar, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { getHealth } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/copy";
import type { HealthResponse } from "@/lib/types";

type Status = "checking" | "online" | "degraded" | "offline";

const STATUS_META: Record<
  Status,
  { label: string; dot: string; text: string; icon: typeof Activity }
> = {
  checking: { label: STATUS_LABELS.checking, dot: "bg-warn", text: "text-[#bbb]", icon: Loader2 },
  online: { label: STATUS_LABELS.online, dot: "bg-clean", text: "text-clean", icon: Activity },
  degraded: { label: STATUS_LABELS.degraded, dot: "bg-warn", text: "text-warn", icon: Zap },
  offline: { label: STATUS_LABELS.offline, dot: "bg-slop", text: "text-slop", icon: MoonStar },
};

export default function Header() {
  const [status, setStatus] = useState<Status>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/pablocaeg/sloptotal";

  async function ping() {
    setStatus((s) => (s === "online" ? s : "checking"));
    const h = await getHealth();
    if (!h) {
      setStatus("offline");
      setHealth(null);
      return;
    }
    setHealth(h);
    setStatus(h.status === "healthy" ? "online" : "degraded");
  }

  useEffect(() => {
    ping();
    const id = setInterval(ping, 60_000);
    return () => clearInterval(id);
  }, []);

  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-stamp bg-ink">
      <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-baseline gap-0.5">
          <span className="font-display text-[26px] italic leading-none text-white">Slop</span>
          <span className="relative top-[-1px] font-mono text-[13px] font-medium uppercase tracking-[0.15em] text-stamp-muted">
            Total
          </span>
        </a>

        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Status pill */}
          <button
            onClick={ping}
            title={
              health
                ? STATUS_LABELS.enginesLoaded(health.engines.loaded, health.engines.total)
                : "Check backend health"
            }
            className={cn(
              "flex items-center gap-2 rounded-full border border-white/15 px-2.5 py-1 font-normal transition hover:border-white/30",
              meta.text,
            )}
          >
            <span className={cn("status-dot", meta.dot, status !== "online" && "animate-pulse")} />
            <StatusIcon className={cn("h-3.5 w-3.5", status === "checking" && "animate-spin")} />
            <span className="hidden sm:inline">{meta.label}</span>
            {health && status === "online" && (
              <span className="hidden font-mono text-[11px] text-[#777] sm:inline">
                {health.engines.loaded}/{health.engines.total}
              </span>
            )}
          </button>

          {/* GitHub */}
          <motion.a
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#999] transition hover:text-white"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </motion.a>
        </div>
      </div>
    </header>
  );
}
