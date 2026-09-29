"use client";

import { animate } from "motion/react";
import { useEffect, useRef } from "react";
import { useSeen } from "@/lib/hooks";

/** Counts up to `value` once visible, with a brief "calibration" overshoot. */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 1.8,
  className = "",
  replayKey,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  replayKey?: string | number;
}) {
  const [ref, seen] = useSeen<HTMLSpanElement>("0px 0px -10% 0px");
  const out = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => `${prefix}${Math.round(n).toLocaleString("en-IN")}${suffix}`;

  useEffect(() => {
    if (!seen || !out.current) return;
    const el = out.current;
    const c = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = fmt(v)),
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, value, replayKey]);

  return (
    <span ref={ref} className={className}>
      <span ref={out}>{fmt(0)}</span>
    </span>
  );
}
