"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Coffee, MoonStar } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { BUTTONS, COLD_START_LINES } from "@/lib/copy";

/**
 * A calm banner that appears when a request has been in flight longer than the
 * cold-start hint window (Render's free instance spins down after ~15 min idle,
 * then takes 30–60s to wake). Shown while a scan runs; dismissed otherwise.
 */
export interface RenderColdStartAlertProps {
  visible: boolean;
  className?: string;
}

export default function RenderColdStartAlert({
  visible,
  className,
}: RenderColdStartAlertProps) {
  const [line, setLine] = useState(COLD_START_LINES[0]);

  // Rotate the gag every few seconds so a long cold start doesn't feel stuck.
  useEffect(() => {
    if (!visible) return;
    setLine(COLD_START_LINES[0]);
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % COLD_START_LINES.length;
      setLine(COLD_START_LINES[i]);
    }, 4500);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className={cn("overflow-hidden", className)}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 rounded border border-[#e9cf95] border-l-[3px] border-l-warn bg-[#fdf4e0] px-3.5 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-warn/15 text-warn">
              <Coffee className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-warn">
                Cold start detected
              </p>
              <p className="text-[13px] font-light text-slate">{line}</p>
            </div>
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
          <div className="flex items-center gap-3 rounded border border-stamp-muted border-l-[3px] border-l-stamp bg-cream px-4 py-3 shadow-card">
            <MoonStar className="h-5 w-5 shrink-0 text-slop" />
            <p className="min-w-0 flex-1 text-[13px] text-slate">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="shrink-0 rounded-sm border border-stamp bg-stamp-bg px-3 py-1.5 text-xs font-semibold text-slop transition hover:bg-stamp hover:text-white"
              >
                {BUTTONS.retry}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

