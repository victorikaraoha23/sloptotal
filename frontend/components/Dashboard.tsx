"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Radar, ScanLine, Microscope } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Header from "@/components/Header";
import ScanSection, { type ScanSpeed } from "@/components/ScanSection";
import ResultsDashboard from "@/components/ResultsDashboard";
import EngineCatalog from "@/components/EngineCatalog";
import { BackendDownToast } from "@/components/RenderColdStartAlert";
import { analyze, extractDocument, quickScore, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ScanResult } from "@/lib/types";

type Tab = "scan" | "engines";

const TAB_ITEMS: Array<{ id: Tab; label: string; icon: typeof Radar }> = [
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "engines", label: "Inspect Engines", icon: Microscope },
];

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("scan");
  const [loading, setLoading] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downToast, setDownToast] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runScan = useCallback(
    async (payload: { text?: string; url?: string; speed: ScanSpeed }) => {
      // Reset UI state for a fresh run.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setResult(null);
      setDownToast(false);
      setColdStart(false);

      const onSlow = () => setColdStart(true);

      try {
        const scanResult =
          payload.speed === "quick"
            ? await quickScore({ ...payload, onSlow, signal: controller.signal })
            : await analyze({ ...payload, onSlow, signal: controller.signal });

        setResult(scanResult);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return; // cancelled
        if (err instanceof ApiError) {
          setError(friendlyMessage(err));
          if (err.status === 0 || err.status >= 500) setDownToast(true);
        } else {
          setError("Something exploded. Even the engines are embarrassed.");
          setDownToast(true);
        }
      } finally {
        setColdStart(false);
        setLoading(false);
      }
    },
    [],
  );

  const handleFileExtract = useCallback(async (file: File) => {
    try {
      const { text } = await extractDocument(file);
      return text;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't read that file.");
      return "";
    }
  }, []);


  return (
    <div className="space-y-6">
      <Header />

      <div
        role="tablist"
        aria-label="Dashboard views"
        className="inline-flex rounded-xl border border-white/10 bg-void-900/70 p-1"
      >
        {TAB_ITEMS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                active ? "text-void-950" : "text-slate-400 hover:text-slate-200",
              )}
            >
              {active && (
                <motion.span
                  layoutId="dash-tab"
                  className="absolute inset-0 -z-0 rounded-lg bg-neon-cyan shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "scan" ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <ScanSection
              onScan={runScan}
              onFileExtract={handleFileExtract}
              loading={loading}
              coldStart={coldStart}
              error={error}
            />
            {result && (
              <ResultsDashboard result={result} onReset={() => setResult(null)} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="engines"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass p-6 sm:p-8"
          >
            <EngineCatalog />
          </motion.div>
        )}
      </AnimatePresence>

      <BackendDownToast
        visible={downToast}
        message="The Render backend didn't answer. It may be asleep or out of memory — hit retry, or come back in a minute."
        onRetry={() => {
          setDownToast(false);
          setError(null);
        }}
      />
    </div>
  );
}

/** Turn an ApiError into a human, slightly-too-honest message. */
function friendlyMessage(err: ApiError): string {
  switch (err.status) {
    case 400:
      return err.message || "That text is too short — the engines need at least 50 characters.";
    case 429:
      return "The detector is swamped right now (free-tier limits). Give it a few seconds and try again.";
    case 502:
      return "Couldn't fetch that URL. Is it public and reachable?";
    case 0:
      return err.message || "Couldn't reach the backend — it might be napping.";
    default:
      return err.message || "The analysis failed. The engines demand a recount.";
  }
}
