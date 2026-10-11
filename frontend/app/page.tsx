import Dashboard from "@/components/Dashboard";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-slate-50 sm:text-5xl">
          Is it{" "}
          <span className="bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-magenta bg-clip-text text-transparent">
            AI slop
          </span>{" "}
          or glorious human trash?
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-slate-400 sm:text-base">
          Paste text, drop a URL, or upload a document. We&apos;ll run it past 23
          detection engines and deliver a verdict with all the subtlety of a
          slap.
        </p>
      </div>

      <Dashboard />
    </main>
  );
}
