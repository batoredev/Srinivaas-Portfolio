"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { hudAudio } from "@/lib/audio";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { getStore, setStore, useStore } from "@/lib/store";

const BOOT_MS = 2600;

function Reactor({ progress }: { progress: number }) {
  const R = 180;
  const ticks = Array.from({ length: 120 }, (_, i) => i);
  const coils = Array.from({ length: 10 }, (_, i) => i);
  const draw = { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 } };
  return (
    <svg viewBox="-200 -200 400 400" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="core" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#fff7e6" />
          <stop offset="35%" stopColor="#ffc56b" />
          <stop offset="70%" stopColor="rgba(255,122,26,0.35)" />
          <stop offset="100%" stopColor="rgba(255,122,26,0)" />
        </radialGradient>
      </defs>
      <g className="animate-spin-slower" style={{ transformOrigin: "0px 0px" }}>
        {ticks.map((i) => {
          const a = (i / ticks.length) * Math.PI * 2;
          const long = i % 10 === 0;
          const r2 = R + (long ? 14 : 7);
          return (
            <motion.line
              key={i}
              x1={Math.cos(a) * R}
              y1={Math.sin(a) * R}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke={long ? "#ffb547" : "rgba(79,227,255,0.55)"}
              strokeWidth={long ? 1.6 : 1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.006 }}
            />
          );
        })}
        <motion.circle r={R} fill="none" stroke="rgba(79,227,255,0.5)" strokeWidth="1" {...draw} transition={{ duration: 1.2 }} />
      </g>
      <g className="animate-spin-rev" style={{ transformOrigin: "0px 0px" }}>
        <motion.circle r={150} fill="none" stroke="#ffb547" strokeWidth="2" strokeDasharray="44 14" {...draw} transition={{ duration: 1.4, delay: 0.2 }} />
      </g>
      <g className="animate-spin-slow" style={{ transformOrigin: "0px 0px" }}>
        {[0, 1, 2].map((k) => (
          <motion.path
            key={k}
            d={`M ${Math.cos((k * 120 * Math.PI) / 180) * 122} ${Math.sin((k * 120 * Math.PI) / 180) * 122} A 122 122 0 0 1 ${Math.cos(((k * 120 + 88) * Math.PI) / 180) * 122} ${Math.sin(((k * 120 + 88) * Math.PI) / 180) * 122}`}
            fill="none"
            stroke="#4fe3ff"
            strokeWidth="7"
            strokeLinecap="butt"
            {...draw}
            transition={{ duration: 1, delay: 0.4 + k * 0.15 }}
            style={{ filter: "drop-shadow(0 0 6px #4fe3ff)" }}
          />
        ))}
      </g>
      <g>
        {coils.map((i) => (
          <motion.rect
            key={i}
            x={-7}
            y={-100}
            width={14}
            height={20}
            rx={2}
            fill="rgba(79,227,255,0.12)"
            stroke="rgba(79,227,255,0.8)"
            strokeWidth="1"
            transform={`rotate(${i * 36})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: progress > i / coils.length ? 1 : 0.15 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </g>
      <motion.circle r={88} fill="none" stroke="rgba(226,251,255,0.35)" strokeWidth="0.8" {...draw} transition={{ duration: 1, delay: 0.6 }} />
      <motion.circle
        r={62}
        fill="url(#core)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0.9, 1.04, 0.96, 1], opacity: 1 }}
        transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror" }}
      />
      <circle r={30} fill="#fff7e6" opacity={0.9} style={{ filter: "blur(6px)" }} />
    </svg>
  );
}

/**
 * Arc-reactor power-up. No choices and no text: the core charges to 100%,
 * then the interface opens straight into the story. Enter or Skip opens it
 * immediately; Professional mode stays one click away in the HUD and hero.
 */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const audio = useStore((s) => s.audio);
  const [phase, setPhase] = useState<"ignite" | "boot" | "exit">("ignite");
  const [progress, setProgress] = useState(0);
  const exiting = useRef(false);

  const engage = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    setProgress(1);
    // only touch WebAudio once the visitor has opted in (no autoplay warnings)
    if (getStore().audio) hudAudio.engage();
    setPhase("exit");
    try {
      sessionStorage.setItem("sv_engaged", "1");
    } catch {
      /* private mode */
    }
    setTimeout(() => setStore({ engaged: true }), 350);
    setTimeout(onDone, 1900);
  }, [onDone]);

  // ignite → boot
  useEffect(() => {
    const t = setTimeout(() => setPhase("boot"), reduced ? 50 : 750);
    return () => clearTimeout(t);
  }, [reduced]);

  // charge the core, then open the interface
  useEffect(() => {
    if (phase !== "boot") return;
    const duration = reduced ? 300 : BOOT_MS;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      // whole percents: the reactor re-renders ~100 times, not every frame
      setProgress(Math.round((1 - Math.pow(1 - k, 2)) * 100) / 100);
      if (k < 1) raf = requestAnimationFrame(tick);
      else engage();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced, engage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") engage();
      else if (e.key.toLowerCase() === "s") {
        const next = !audio;
        hudAudio.setEnabled(next);
        setStore({ audio: next });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engage, audio]);

  return (
    <AnimatePresence>
      <motion.div
        key="boot"
        className="fixed inset-0 z-[80] overflow-hidden bg-void"
        initial={{ opacity: 1 }}
        animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1.4, delay: phase === "exit" ? 0.25 : 0, ease: [0.7, 0, 0.2, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="Interface boot sequence"
        style={{ pointerEvents: phase === "exit" ? "none" : "auto" }}
      >
        <div className="atmos-grid !absolute opacity-70" />

        {/* ignition line (CRT power-on) */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[2px] -translate-x-1/2 -translate-y-1/2 bg-ice shadow-[0_0_30px_#4fe3ff,0_0_80px_#4fe3ff]"
          initial={{ width: 0, opacity: 1 }}
          animate={phase === "ignite" ? { width: "70vw", opacity: 1 } : { width: "70vw", opacity: 0, scaleY: 40 }}
          transition={{ duration: phase === "ignite" ? 0.6 : 0.5, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* corner controls */}
        <div className="absolute left-5 top-5 flex items-center gap-3 sm:left-8 sm:top-7">
          <span className="live-dot" />
          <span className="hud-label">SV-OS</span>
        </div>
        <div className="absolute right-5 top-5 flex items-center gap-4 sm:right-8 sm:top-7">
          <button
            type="button"
            data-lock={audio ? "Sound off" : "Sound on"}
            onClick={() => {
              const next = !audio;
              hudAudio.setEnabled(next);
              setStore({ audio: next });
            }}
            className="hud-label hover:text-ice"
            aria-pressed={audio}
          >
            [S] Sound {audio ? "● on" : "○ off"}
          </button>
          {phase !== "exit" && (
            <button type="button" onClick={engage} className="hud-label hover:text-ice" data-lock="Skip boot">
              Skip ▸
            </button>
          )}
        </div>

        {/* reactor */}
        <motion.div
          className="absolute left-1/2 top-1/2 aspect-square w-[min(72vw,440px)]"
          initial={{ opacity: 0, scale: 0.6, y: "-50%" }}
          animate={
            phase === "ignite"
              ? { opacity: 0, scale: 0.6 }
              : phase === "exit"
                ? { opacity: 0, scale: 3.2, y: "-50%" }
                : { opacity: 1, scale: 1, y: "-50%" }
          }
          transition={{ duration: phase === "exit" ? 1.3 : 1, ease: [0.7, 0, 0.2, 1] }}
          style={{ x: "-50%" }}
        >
          <Reactor progress={progress} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[clamp(26px,5vw,40px)] font-bold text-void mix-blend-normal">
              {String(Math.round(progress * 100)).padStart(3, "0")}
            </span>
          </div>
        </motion.div>

        {/* charge bar */}
        <div className="absolute bottom-8 left-1/2 h-px w-[min(60vw,320px)] -translate-x-1/2 bg-holo/15">
          <div className="h-full origin-left bg-amber shadow-[0_0_10px_#ffb547]" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
