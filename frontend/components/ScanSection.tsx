"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardPaste,
  FileText,
  Link2,
  Loader2,
  Radar,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import RenderColdStartAlert from "@/components/RenderColdStartAlert";
import { cn } from "@/lib/cn";
import {
  BUTTONS,
  FILE_HINT,
  LOADING_LINES,
  PLACEHOLDER,
  URL_HINT,
} from "@/lib/copy";

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

  // Rotate a snarky status line while a scan runs.
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);
  useEffect(() => {
    if (!loading) return;
    setLoadingLine(LOADING_LINES[0]);
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % LOADING_LINES.length;
      setLoadingLine(LOADING_LINES[i]);
    }, 2600);
    return () => clearInterval(id);
  }, [loading]);

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
    <section className="card overflow-hidden">
      {/* A calm top progress bar while scanning. */}
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-rule-light">
          <motion.div
            className="h-full w-1/3 bg-stamp"
            initial={{ x: "-100%" }}
            animate={{ x: "300%" }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* Tabs — underline style, mirroring web/static */}
      <div
        role="tablist"
        aria-label="Input type"
        className="relative flex border-b border-rule bg-paper-warm px-1"
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
                "relative z-1 flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium transition-colors",
                active ? "text-ink" : "text-muted hover:text-slate",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-50")} />
              {tab.label}
              {active && (
                <motion.span
                  layoutId="scan-tab"
                  className="absolute -bottom-px left-3 right-3 h-0.5 rounded-t bg-stamp"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}

        {/* Speed toggle, pinned right */}
        <div className="ml-auto flex items-center gap-1 pr-2 text-[11px]">
          <button
            onClick={() => setSpeed("quick")}
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-1 font-mono uppercase tracking-wide transition",
              speed === "quick"
                ? "bg-stamp/10 text-stamp"
                : "text-muted hover:text-slate",
            )}
            title="4 ML classifiers, ~300-500ms"
          >
            <Zap className="h-3 w-3" /> Quick
          </button>
          <button
            onClick={() => setSpeed("full")}
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-1 font-mono uppercase tracking-wide transition",
              speed === "full"
                ? "bg-stamp/10 text-stamp"
                : "text-muted hover:text-slate",
            )}
            title="All 23 engines, calibrated ensemble"
          >
            <Radar className="h-3 w-3" /> Full
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait">
          {mode === "text" && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                spellCheck={false}
                className="field min-h-[150px] resize-y font-body"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs tabular-nums text-muted">
                  <span className={cn(chars < 50 && chars > 0 && "text-stamp")}>{chars}</span>{" "}
                  chars · {words} words
                </span>
                {tooShort && (
                  <span className="font-mono text-xs text-stamp">
                    Need at least 50 characters. The engines get stage fright below that.
                  </span>
                )}
                <button
                  onClick={pasteFromClipboard}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-sm border border-dashed border-rule px-2.5 py-1 text-[13px] text-slate transition hover:border-stamp hover:text-stamp"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" /> {BUTTONS.paste}
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
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canScanUrl && submit()}
                  placeholder="https://example.com/article"
                  spellCheck={false}
                  autoComplete="off"
                  className="field pl-10"
                />
              </div>
              <p className="mt-2 text-xs font-light text-muted">{URL_HINT}</p>
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
                  "flex h-44 cursor-pointer flex-col items-center justify-center gap-2.5 rounded border border-dashed transition",
                  dragActive
                    ? "border-stamp bg-stamp/[0.04]"
                    : "border-rule bg-white/40 hover:border-stamp",
                )}
              >
                {extracting ? (
                  <Loader2 className="h-6 w-6 animate-spin text-stamp" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-muted" />
                )}
                <div className="text-center">
                  <p className="text-[13px] font-medium text-slate">
                    {extracting ? BUTTONS.extracting : BUTTONS.dropFile}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">{FILE_HINT}</p>
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
                    fileName.includes("Unsupported") ? "text-stamp" : "text-clean",
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
          <p className="mt-4 flex items-center gap-2 rounded border border-stamp-muted border-l-[3px] border-l-stamp bg-stamp-bg px-3.5 py-2.5 text-[13px] text-slop">
            {error}
          </p>
        )}

        {/* Form bottom: primary action + clear */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button onClick={submit} disabled={loading || (mode === "text" && !canScanText) || (mode === "url" && !canScanUrl)} className="btn-ink">
            {loading ? (
              <>
                <span className="spinner" />
                {loadingLine}
              </>
            ) : (
              <>
                {BUTTONS.scan}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
            className="text-[13px] font-light text-muted transition hover:text-stamp disabled:opacity-40"
          >
            {BUTTONS.purge}
          </button>

          <span className="ml-auto hidden text-xs font-light text-muted sm:inline">
            Free &amp; private. Every engine runs on this server; nothing is sent to third parties.
          </span>
        </div>
      </div>
    </section>
  );
}


