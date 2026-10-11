"use client";

import { motion } from "framer-motion";
import { gaugeColor, normalizeScore } from "@/lib/verdict";

/**
 * A circular gauge ring, styled like the report.html gauge: a neutral track and
 * a coloured arc that sweeps 270°, with the score set in the editorial serif.
 */
export default function ScoreGauge({
  value,
  size = 176,
}: {
  value: number;
  size?: number;
}) {
  const score = normalizeScore(value);
  const stroke = 10;
  const radius = (size - stroke) / 2 - 6;
  const circumference = 2 * Math.PI * radius;
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
        className="-rotate-[90deg]"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#cdc6b8"
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 55, damping: 16 }}
        />
      </svg>

      {/* Center readout — serif score, mono "/100" */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-[34px] italic leading-none transition-colors"
          style={{ color }}
        >
          {Math.round(score)}
        </span>
        <span className="mt-0.5 font-mono text-xs font-light text-muted">/ 100</span>
      </div>
    </div>
  );
}


