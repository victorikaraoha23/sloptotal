import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ScoreGauge from "@/components/ScoreGauge";

describe("ScoreGauge", () => {
  it("renders the rounded score and a /100 readout", () => {
    render(<ScoreGauge value={42.6} />);
    expect(screen.getByText("43")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
  });

  it("colours low scores green-ish and high scores stamp-red", () => {
    const { rerender } = render(<ScoreGauge value={5} />);
    const lowStyle = screen.getByText("5").getAttribute("style") ?? "";
    rerender(<ScoreGauge value={95} />);
    const highStyle = screen.getByText("95").getAttribute("style") ?? "";
    expect(lowStyle).not.toBe(highStyle);
    // High scores interpolate towards the stamp red (181, 40, 46).
    expect(highStyle).toMatch(/18\d/);
  });

  it("clamps out-of-range input instead of rendering NaN", () => {
    render(<ScoreGauge value={999} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
