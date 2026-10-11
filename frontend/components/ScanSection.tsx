"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardPaste,
  FileText,
  Link2,
  Loader2,
  ScanLine,
  Trash2,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import RenderColdStartAlert from "@/components/RenderColdStartAlert";
import { cn } from "@/lib/cn";

export type ScanMode = "text" | "url" | "file";
export type ScanSpeed = "quick" | "full";

const TABS: Array<{ id: ScanMode; label: string; icon: typeof FileText }> = [
  { id: "text", label: "Raw Text", icon: FileText },
  { id: "url", label: "URL", icon: Link2 },
  { id: "file", label: "File", icon: UploadCloud },
];

const ACCEPTED = ".txt,.md,.pdf,.docx";

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export interface ScanSectionProps {
  onScan: (payload: {
    mode: ScanMode;
    text?: string;
    url?: string;
    speed: ScanSpeed;
  }) => void;
  loading: boolean;
  coldStart: boolean;
  /** Called when a file is dropped, so the parent can run /api/extract. */
  onFileExtract?: (file: File) => Promise<string | void>;
  error?: string | null;
}

export default function ScanSection({
  onScan,
  loading,
  coldStart,
  onFileExtract,
  error,
}: ScanSectionProps) {
  const [mode, setMode] = useState<ScanMode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [speed, setSpeed] = useState<ScanSpeed>("full");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chars = text.length;
  const words = countWords(text);
  const tooShort = mode === "text" && chars > 0 && chars < 50;
  const canScanText = chars >= 50 && !loading;
  const canScanUrl = url.trim().length > 0 && !loading;

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      /* permission denied — silently no-op */
    }
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!/\.(txt|md|pdf|docx)$/i.test(file.name)) {
      setFileName("Unsupported file. Use .txt, .md, .pdf or .docx");
      return;
    }
    setFileName(file.name);
    setExtracting(true);
    try {
      if (onFileExtract) {
        const extracted = await onFileExtract(file);
        if (typeof extracted === "string" && extracted) {
          setText(extracted);
          setMode("text");
        }
      }
    } finally {
      setExtracting(false);
    }
  }

  function submit() {
    if (loading) return;
    if (mode === "text") {
      if (chars < 50) return;
      onScan({ mode, text, speed });
    } else if (mode === "url") {
      if (!url.trim()) return;
      onScan({ mode, url: url.trim(), speed });
    }
  }

  return (
    <section className="glass relative overflow-hidden p-5 sm:p-7">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-neon-cyan/0 via-neon-cyan/10 to-neon-cyan/0" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Input type"
          className="inline-flex rounded-xl border border-white/10 bg-void-900/70 p-1"
        >
          {TABS.map((tab) => {
            const active = mode === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                  active ? "text-void-950" : "text-slate-400 hover:text-slate-200",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="scan-tab"
                    className="absolute inset-0 -z-0 rounded-lg bg-neon-cyan shadow-glow"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto inline-flex items-center gap-1 rounded-xl border border-white/10 bg-void-900/70 p-1 text-xs">
          <button
            onClick={() => setSpeed("quick")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono uppercase tracking-wide transition",
              speed === "quick"
                ? "bg-neon-lime/20 text-neon-lime"
                : "text-slate-500 hover:text-slate-300",
            )}
            title="4 ML classifiers, ~300-500ms"
          >
            <Zap className="h-3.5 w-3.5" /> Quick
          </button>
          <button
            onClick={() => setSpeed("full")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono uppercase tracking-wide transition",
              speed === "full"
                ? "bg-neon-cyan/20 text-neon-cyan"
                : "text-slate-500 hover:text-slate-300",
            )}
            title="All 23 engines, calibrated ensemble"
          >
            <ScanLine className="h-3.5 w-3.5" /> Full
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text here before ChatGPT takes your job..."
                spellCheck={false}
                className="h-56 w-full resize-y rounded-xl border border-white/10 bg-void-950/70 p-4 font-mono text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-neon-cyan/50 focus:shadow-glow"
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-mono">
                <span className={cn(chars < 50 && chars > 0 && "text-slop-ai")}>{chars}</span>{" "}
                chars · {words} words
              </span>
              {tooShort && (
                <span className="text-slop-ai">
                  Need at least 50 characters. The engines get stage fright below that.
                </span>
              )}
              <button
                onClick={pasteFromClipboard}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 font-medium text-slate-400 transition hover:border-neon-cyan/40 hover:text-neon-cyan"
              >
                <ClipboardPaste className="h-3.5 w-3.5" /> Paste from Clipboard
              </button>
            </div>
          </motion.div>
        )}

        {mode === "url" && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canScanUrl && submit()}
                placeholder="https://example.com/some-suspiciously-fluent-article"
                spellCheck={false}
                className="h-14 w-full rounded-xl border border-white/10 bg-void-950/70 pl-12 pr-4 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-neon-cyan/50 focus:shadow-glow"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              We&apos;ll fetch the page and read its main prose. Public URLs only — we
              refuse to poke your router.
            </p>
          </motion.div>
        )}

        {mode === "file" && (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition",
                dragActive
                  ? "border-neon-cyan bg-neon-cyan/5"
                  : "border-white/15 bg-void-950/50 hover:border-neon-cyan/40",
              )}
            >
              {extracting ? (
                <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
              ) : (
                <UploadCloud className="h-8 w-8 text-slate-500" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">
                  {extracting
                    ? "Extracting text from your document..."
                    : "Drop a file or click to upload"}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  .txt · .md · .pdf · .docx (max 10 MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            {fileName && (
              <p
                className={cn(
                  "mt-2 flex items-center gap-2 font-mono text-xs",
                  fileName.includes("Unsupported") ? "text-slop-ai" : "text-neon-lime",
                )}
              >
                <FileText className="h-3.5 w-3.5" /> {fileName}
                {!fileName.includes("Unsupported") && " — text loaded into the editor above."}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <RenderColdStartAlert visible={coldStart} className="mt-4" />

      {error && (
        <p className="mt-4 rounded-lg border border-slop-ai/40 bg-slop-ai/10 px-4 py-2.5 text-sm text-slop-ai">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={
            loading || (mode === "text" && !canScanText) || (mode === "url" && !canScanUrl)
          }
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition",
            "bg-gradient-to-r from-neon-cyan to-neon-violet text-void-950 shadow-glow",
            "hover:brightness-110 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sniffing the LLM on your text...</span>
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4" />
              Scan for Slop
            </>
          )}
        </button>

        <button
          onClick={() => {
            setText("");
            setUrl("");
            setFileName(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-medium text-slate-400 transition hover:border-slop-ai/40 hover:text-slop-ai disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" /> Purge Text
        </button>
      </div>
    </section>
  );
}


