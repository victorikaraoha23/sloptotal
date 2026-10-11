"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Coffee, CloudMoon, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A smart banner that appears when a request has been in flight longer than the
 * cold-start hint window (Render's free instance spins down after ~15 min idle,
 * then takes 30–60s to wake). Shown while a scan runs; dismissed otherwise.
 */
export interface RenderColdStartAlertProps {
  visible: boolean;
  className?: string;
}

const JOKES = [
  "Render free instance is waking up, grab a quick coffee...",
  "Stretching the 512 MB of RAM. One sec...",
  "Cold-starting 23 neural engines. The GPT-2 needs its espresso too...",
  "Render is yawning. We'll be back before your coffee cools...",
];

export default function RenderColdStartAlert({
  visible,
  className,
}: RenderColdStartAlertProps) {
  const [joke, setJoke] = useState(JOKES[0]);

  // Rotate the gag every few seconds so a long cold start doesn't feel stuck.
  useEffect(() => {
    if (!visible) return;
    setJoke(JOKES[0]);
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % JOKES.length;
      setJoke(JOKES[i]);
    }, 4000);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className={cn("overflow-hidden", className)}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 rounded-xl border border-neon-amber/40 bg-neon-amber/10 px-4 py-3 text-neon-amber">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-amber/20">
              <Coffee className="h-4 w-4 animate-pulse" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold uppercase tracking-wide">
                Cold start detected
              </p>
              <p className="text-sm text-neon-amber/90">{joke}</p>
            </div>
            <TriangleAlert className="ml-auto h-4 w-4 shrink-0 opacity-60" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A companion dismissible toast for offline / failed backend states. */
export function BackendDownToast({
  visible,
  message,
  onRetry,
}: {
  visible: boolean;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2"
        >
          <div className="glass-strong flex items-center gap-3 border-slop-ai/40 px-4 py-3 shadow-glow-red">
            <CloudMoon className="h-5 w-5 shrink-0 text-slop-ai" />
            <p className="min-w-0 flex-1 text-sm text-slate-200">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="shrink-0 rounded-lg bg-slop-ai/20 px-3 py-1.5 text-xs font-semibold text-slop-ai transition hover:bg-slop-ai/30"
              >
                Retry
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
