import Dashboard from "@/components/Dashboard";
import { HERO } from "@/lib/copy";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[820px] px-5 pb-12 pt-4 sm:px-6">
      {/* Hero */}
      <div className="py-12 text-center sm:py-16">
        <span className="mb-5 inline-block rounded-[20px] border border-stamp-muted px-3.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-stamp animate-fade-up">
          {HERO.badge}
        </span>
        <h1 className="animate-fade-up text-display-sm font-normal text-ink [animation-delay:0.1s] sm:text-display">
          {HERO.titleLead}{" "}
          <em className="italic text-stamp">{HERO.titleAccent}</em>
          {HERO.titleTrail}
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-pretty text-[15px] font-light leading-relaxed text-dim animate-fade-up [animation-delay:0.2s]">
          {HERO.subtitle}
        </p>
      </div>

      <Dashboard />
    </main>
  );
}


