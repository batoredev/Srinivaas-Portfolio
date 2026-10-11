"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { hudAudio } from "@/lib/audio";
import { getStore, setStore, useStore } from "@/lib/store";
import { CORE_TINTS } from "../three/coreLabels";

/*
 * "Retrain the Core": a small toy. Each press re-initialises the Core's
 * weights, so it blows apart and re-forms in a new colour; no two visitors
 * leave with quite the same one.
 */

const origin = { x: 0, y: 0 };

export function retrain(from?: { x: number; y: number }) {
  origin.x = from?.x ?? window.innerWidth / 2;
  origin.y = from?.y ?? window.innerHeight / 2;
  hudAudio.confirm();
  setStore({ retrain: getStore().retrain + 1 });
}

export function RetrainButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      data-lock="Retrain the Core"
      aria-label="Retrain the Core"
      title="Retrain the Core (R)"
      onClick={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        retrain({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
      }}
      className="group flex items-center gap-2 font-mono text-[10.5px] tracking-[0.2em] text-holo-soft/80 hover:text-ice"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="transition-transform duration-700 group-hover:rotate-180">
        <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12.6 1.6v3h-3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {!compact && <span>RETRAIN</span>}
    </button>
  );
}

/** Colour ripple from the button, the R shortcut, and an epoch toast. */
export function RetrainFx() {
  const n = useStore((s) => s.retrain);
  const engaged = useStore((s) => s.engaged);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!engaged) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey && !e.altKey) retrain();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engaged]);

  useEffect(() => {
    if (n === 0) return;
    // showing the toast is the point of reacting to the retrain counter
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 2200);
  }, [n]);

  const color = CORE_TINTS[n % CORE_TINTS.length];
  return (
    <>
      <AnimatePresence>
        {n > 0 && (
          <motion.span
            key={n}
            aria-hidden
            className="pointer-events-none fixed z-[69] h-10 w-10 rounded-full border"
            style={{ left: origin.x - 20, top: origin.y - 20, borderColor: color, background: `${color}1f` }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 70, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="pointer-events-none fixed bottom-14 left-1/2 z-[72] -translate-x-1/2 border border-holo/25 bg-void/80 px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-ice backdrop-blur-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <span style={{ color }}>●</span> WEIGHTS RE-INITIALISED · EPOCH {String(n).padStart(2, "0")}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
