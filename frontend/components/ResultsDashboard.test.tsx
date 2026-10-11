import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResultsDashboard from "@/components/ResultsDashboard";
import type { ScanResult } from "@/lib/types";

const BASE: ScanResult = {
  score: 12,
  tier: "human",
  engines: [
    {
      key: "fakespot",
      name: "Fakespot RoBERTa",
      score: 10,
      verdict: "clean",
      details: "looks human",
      engineType: "neural",
    },
  ],
  enginesFlagged: 0,
  enginesTotal: 1,
  wordCount: 120,
  elapsedMs: 800,
};

describe("ResultsDashboard", () => {
  it("shows the human stamp for low scores", () => {
    render(<ResultsDashboard result={BASE} onReset={() => {}} />);
    expect(screen.getByText("Certified Human Slop")).toBeInTheDocument();
  });

  it("shows the slop stamp for high scores", () => {
    render(<ResultsDashboard result={{ ...BASE, score: 92, tier: "ai" }} onReset={() => {}} />);
    expect(screen.getByText("Synthetic Slop Detected")).toBeInTheDocument();
  });

  it("lists engine rows and stat pills", () => {
    render(<ResultsDashboard result={BASE} onReset={() => {}} />);
    expect(screen.getByText("Fakespot RoBERTa")).toBeInTheDocument();
    expect(screen.getByText(/120 words/)).toBeInTheDocument();
    expect(screen.getByText(/0 flagged/)).toBeInTheDocument();
  });

  it("renders the site fingerprint panel for URL scans", () => {
    render(
      <ResultsDashboard
        result={{
          ...BASE,
          site: {
            url: "https://example.com",
            final_url: "https://example.com/",
            site: { builders: [], generator: null, verdict: "No AI builder markers" },
            text: null,
          },
        }}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText("No AI builder markers")).toBeInTheDocument();
  });
});
