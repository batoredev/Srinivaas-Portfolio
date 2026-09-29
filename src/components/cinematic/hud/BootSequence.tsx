"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { setStore, useStore } from "@/lib/store";
import { powerDownToProfessional } from "./Handoff";

const LOG = [
  ["OK", "Mounting /dev/imagination"],
  ["OK", "Loading neural lattice ........ 15,000 nodes"],
  ["OK", "Syncing Perfect Study Space ... ~2,000 students"],
  ["OK", "Warming PostGIS spatial index"],
  ["OK", "Indexing pgvector embeddings"],
  ["OK", "Cloudflare Tunnel ............. 0 open ports"],
  ["OK", "Waking agents ................. 31 standing by"],
  ["WARN", "Chai reserves at 23%"],
  ["OK", "Holographic projectors ........ online"],
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil?";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}

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

export function BootSequence({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const audio = useStore((s) => s.audio);
  const [phase, setPhase] = useState<"ignite" | "boot" | "ready" | "exit">("ignite");
  const [lines, setLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [typed, setTyped] = useState("");
  const [greet] = useState(greeting);
  const exiting = useRef(false);

  const message = `${greet} You've reached the neural interface of ${profile.name}. I can walk you through how he was built, one chapter at a time, or hand you the résumé.`;

  // ignite → boot
  useEffect(() => {
    const t = setTimeout(() => setPhase("boot"), reduced ? 50 : 750);
    return () => clearTimeout(t);
  }, [reduced]);

  // boot log + progress
  useEffect(() => {
    if (phase !== "boot") return;
    let i = 0;
    const id = setInterval(
      () => {
        i++;
        setLines(i);
        setProgress(Math.min(1, i / LOG.length));
        if (i >= LOG.length) {
          clearInterval(id);
          setTimeout(() => setPhase("ready"), reduced ? 0 : 450);
        }
      },
      reduced ? 10 : 230,
    );
    return () => clearInterval(id);
  }, [phase, reduced]);

  // typed greeting
  useEffect(() => {
    if (phase !== "ready") return;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTyped(message.slice(0, i));
      if (i >= message.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [phase, message]);

  const engage = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    hudAudio.engage();
    hudAudio.speak("Welcome. All systems online.");
    setPhase("exit");
    try {
      sessionStorage.setItem("sv_engaged", "1");
    } catch {
      /* private mode */
    }
    setTimeout(() => setStore({ engaged: true }), 350);
    setTimeout(onDone, 1900);
  }, [onDone]);

  const professional = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    powerDownToProfessional();
  }, []);

  const skip = useCallback(() => {
    setLines(LOG.length);
    setProgress(1);
    setPhase("ready");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (phase === "ready") engage();
        else skip();
      } else if (e.key.toLowerCase() === "p" && phase === "ready") professional();
      else if (e.key.toLowerCase() === "s") {
        const next = !audio;
        hudAudio.setEnabled(next);
        setStore({ audio: next });
      } else if (e.key === "Escape" && phase === "boot") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, engage, professional, skip, audio]);

  const ready = phase === "ready";

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

        {/* corner readouts */}
        <div className="absolute left-5 top-5 flex items-center gap-3 sm:left-8 sm:top-7">
          <span className="live-dot" />
          <span className="hud-label">SV-OS · Boot sequence</span>
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
          {!ready && phase !== "exit" && (
            <button type="button" onClick={skip} className="hud-label hover:text-ice" data-lock="Skip boot">
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
                : ready
                  ? { opacity: 1, scale: 0.52, y: "-92%" }
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

        {/* boot log */}
        <div className="absolute bottom-6 left-5 max-w-[92vw] font-mono text-[10.5px] leading-[1.75] sm:bottom-8 sm:left-8 sm:text-[11.5px]">
          {LOG.slice(0, lines).map(([lvl, msg], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: ready ? 0.35 : 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="whitespace-pre"
            >
              <span className={lvl === "OK" ? "text-mint" : "text-amber"}>[{lvl === "OK" ? " OK " : "WARN"}]</span>{" "}
              <span className="text-ice/75">{msg}</span>
            </motion.div>
          ))}
        </div>
        <div className="absolute bottom-6 right-5 hidden text-right sm:bottom-8 sm:right-8 sm:block">
          <div className="hud-label">Neural lattice</div>
          <div className="mt-2 h-px w-40 bg-holo/15">
            <motion.div className="h-full origin-left bg-amber" animate={{ scaleX: progress }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* greeting + choice */}
        <AnimatePresence>
          {ready && (
            <motion.div
              className="absolute inset-x-0 top-[48%] flex flex-col items-center px-5 text-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="max-w-[640px] font-display text-[clamp(18px,2.4vw,28px)] font-medium leading-snug text-ice">
                {typed}
                <span className="animate-blink text-amber">▌</span>
              </p>
              <motion.div
                className="mt-10 flex w-full max-w-[640px] flex-col gap-3 sm:flex-row"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <button
                  type="button"
                  autoFocus
                  onClick={engage}
                  data-lock="Begin the story"
                  className="group relative flex-1 border border-amber/70 bg-amber/10 px-6 py-5 text-left transition-colors hover:bg-amber/20"
                >
                  <span className="brackets brackets-amber absolute inset-0" />
                  <span className="flex items-center justify-between">
                    <span className="font-display text-[15px] font-semibold uppercase tracking-[0.22em] text-amber">▶ Begin the story</span>
                    <span className="font-mono text-[10px] text-amber/70">ENTER</span>
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-ice/60">15 chapters · 3D · motion · cinematic</span>
                </button>
                <button
                  type="button"
                  onClick={professional}
                  data-lock="Professional mode"
                  className="group relative flex-1 border border-holo/30 bg-holo/[0.04] px-6 py-5 text-left transition-colors hover:bg-holo/10"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-display text-[15px] font-semibold uppercase tracking-[0.22em] text-holo-soft">Professional mode</span>
                    <span className="font-mono text-[10px] text-holo/60">P</span>
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-ice/60">Clean résumé view · one-way door</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
