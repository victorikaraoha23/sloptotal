"use client";

import { motion } from "framer-motion";
import { Activity, Github, Loader2, Moon, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { getHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

type Status = "checking" | "online" | "degraded" | "offline";

const STATUS_META: Record<
  Status,
  { label: string; dot: string; text: string; ring: string; icon: typeof Activity }
> = {
  checking: {
    label: "Waking backend…",
    dot: "bg-slate-400",
    text: "text-slate-300",
    ring: "border-white/10",
    icon: Loader2,
  },
  online: {
    label: "Backend online",
    dot: "bg-slop-human",
    text: "text-slop-human",
    ring: "border-slop-human/40",
    icon: Activity,
  },
  degraded: {
    label: "Degraded",
    dot: "bg-slop-suspicious",
    text: "text-slop-suspicious",
    ring: "border-slop-suspicious/40",
    icon: Zap,
  },
  offline: {
    label: "Backend napping",
    dot: "bg-slop-ai",
    text: "text-slop-ai",
    ring: "border-slop-ai/40",
    icon: Moon,
  },
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
    // Poll gently so a cold-started Render is noticed without spamming it.
    const id = setInterval(ping, 60_000);
    return () => clearInterval(id);
  }, []);

  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-void-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet shadow-glow">
            <Zap className="h-5 w-5 text-void-950" />
          </div>
          <div className="leading-none">
            <div className="text-lg font-bold tracking-tight text-slate-100">
              Slop<span className="text-neon-cyan">Total</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              23 engines · 0 mercy
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Status badge */}
          <button
            onClick={ping}
            title={
              health
                ? `${health.engines.loaded}/${health.engines.total} engines loaded`
                : "Check backend health"
            }
            className={cn(
              "flex items-center gap-2 rounded-full border bg-void-900/60 px-3 py-1.5 text-xs font-medium transition hover:brightness-110",
              meta.ring,
              meta.text,
            )}
          >
            <span className={cn("status-dot", meta.dot)} />
            <StatusIcon
              className={cn("h-3.5 w-3.5", status === "checking" && "animate-spin")}
            />
            <span className="hidden sm:inline">{meta.label}</span>
            {health && status === "online" && (
              <span className="hidden font-mono text-[10px] text-slate-500 sm:inline">
                {health.engines.loaded}/{health.engines.total}
              </span>
            )}
          </button>

          {/* GitHub */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-void-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-neon-cyan/40 hover:text-neon-cyan"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">Star on GitHub</span>
          </motion.a>
        </div>
      </div>
    </header>
  );
}
