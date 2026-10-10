"use client";

import { motion } from "motion/react";
import { achievements } from "@/data/content";
import { useSeen } from "@/lib/hooks";
import { Counter } from "./Counter";

const SEGMENTS = 36;
// round so server and client render identical attribute strings
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const SWEEP = 300; // degrees of arc used by the gauge

function arc(r: number, a0: number, a1: number) {
  const p = (a: number) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

/** Arc-reactor gauge that powers up and counts when it scrolls into view. */
export function Gauge({ a, i }: { a: (typeof achievements)[number]; i: number }) {
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -12% 0px");
  const accent = i % 2 === 0 ? "#ffb547" : "#4fe3ff";
  const start = 90 + (360 - SWEEP) / 2;
  const segLen = SWEEP / SEGMENTS;
  return (
    <motion.div
      ref={ref}
      className="group relative flex flex-col items-center text-center"
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, delay: (i % 3) * 0.1 }}
      data-lock={a.label}
    >
      <div className="relative aspect-square w-full max-w-[150px]">
        <svg viewBox="-120 -120 240 240" className="absolute inset-0 h-full w-full overflow-visible">
          {/* rotating tick ring */}
          <g className="animate-spin-slower group-hover:[animation-duration:6s]" style={{ transformOrigin: "0px 0px" }}>
            {Array.from({ length: 72 }, (_, k) => {
              const ang = (k / 72) * Math.PI * 2;
              const r1 = 108, r2 = k % 6 === 0 ? 116 : 112;
              return (
                <line
                  key={k}
                  x1={r3(Math.cos(ang) * r1)}
                  y1={r3(Math.sin(ang) * r1)}
                  x2={r3(Math.cos(ang) * r2)}
                  y2={r3(Math.sin(ang) * r2)}
                  stroke={k % 6 === 0 ? accent : "rgba(79,227,255,0.35)"}
                  strokeWidth={1}
                />
              );
            })}
          </g>
          {/* segmented arc that powers up */}
          {Array.from({ length: SEGMENTS }, (_, k) => {
            const a0 = start + k * segLen + 0.9;
            const a1 = start + (k + 1) * segLen - 0.9;
            return (
              <path
                key={k}
                d={arc(92, a0, a1)}
                fill="none"
                strokeWidth={10}
                stroke={seen ? accent : "rgba(79,227,255,0.08)"}
                style={{
                  opacity: seen ? 0.25 + 0.75 * (k / SEGMENTS) : 1,
                  transition: `stroke 0.2s ${k * 0.035}s, opacity 0.2s ${k * 0.035}s`,
                  filter: seen ? `drop-shadow(0 0 4px ${accent})` : "none",
                }}
              />
            );
          })}
          <circle r={78} fill="none" stroke="rgba(79,227,255,0.18)" strokeWidth="1" />
          <g className="animate-spin-rev" style={{ transformOrigin: "0px 0px" }}>
            <circle r={70} fill="none" stroke="rgba(226,251,255,0.25)" strokeWidth="1" strokeDasharray="2 6" />
          </g>
          <circle r={62} fill="rgba(5,16,24,0.85)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Counter value={a.value} prefix={a.prefix} suffix={a.suffix} className="font-display text-[clamp(20px,2.2vw,28px)] font-bold leading-none text-ice" />
          <span className="mt-1 font-mono text-[8.5px] tracking-[0.25em]" style={{ color: accent }}>
            {a.unit}
          </span>
        </div>
      </div>
      <p className="mt-2 max-w-[160px] text-[12.5px] leading-snug text-ice/70">{a.label}</p>
    </motion.div>
  );
}
