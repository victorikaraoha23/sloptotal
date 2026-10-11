"use client";

import { motion } from "framer-motion";
import { gaugeColor, normalizeScore } from "@/lib/verdict";

/**
 * A circular gauge ring. `value` is a 0–100 AI-likelihood score. The arc sweeps
 * clockwise from the top and the colour shifts green → amber → red with the score.
 */
export default function ScoreGauge({
  value,
  size = 240,
  label = "AI Score",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const score = normalizeScore(value);
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // We draw only the top 270° (three-quarter) for a speedometer feel.
  const sweep = 0.75;
  const arcLength = circumference * sweep;
  const offset = arcLength * (1 - score / 100);
  const color = gaugeColor(score);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="presentation"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-[225deg]"
      >
        <defs>
          <filter id="gauge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          filter="url(#gauge-glow)"
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>

      {/* Center readout */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div
            className="font-mono text-5xl font-bold tabular-nums"
            style={{ color }}
          >
            {Math.round(score)}
            <span className="text-2xl align-top">%</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
