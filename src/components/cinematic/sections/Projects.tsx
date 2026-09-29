"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { useSeen } from "@/lib/hooks";
import { Counter } from "../ui/Counter";
import { SectionTitle } from "../ui/SectionTitle";

const HologramCanvas = dynamic(() => import("../three/ProjectCanvas"), { ssr: false });

const CYCLE_MS = 9000;

export function Projects() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -20% 0px", false);
  const startedAt = useRef(0);
  const bar = useRef<HTMLSpanElement>(null);
  const p = projects[idx];

  // auto-advance with a visible timer bar; pauses on hover or when off-screen
  useEffect(() => {
    if (!seen || paused) return;
    startedAt.current = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - startedAt.current) / CYCLE_MS;
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, t)})`;
      if (t >= 1) setIdx((i) => (i + 1) % projects.length);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idx, seen, paused]);

  return (
    <section id="projects" data-section="projects" className="section">
      <div className="container-hud">
        <SectionTitle id="projects" title="Featured Projects" wordplay="Shipped, not just scripted." effect="flicker" />

        <div
          ref={ref}
          className="mt-14 grid gap-6 lg:grid-cols-12 lg:gap-8"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          {/* selector */}
          <div className="order-2 min-w-0 lg:order-1 lg:col-span-5">
            <div role="tablist" aria-label="Projects" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
              {projects.map((pr, i) => {
                const on = i === idx;
                return (
                  <button
                    key={pr.id}
                    role="tab"
                    aria-selected={on}
                    type="button"
                    data-lock={pr.name}
                    onClick={() => {
                      hudAudio.tick();
                      setIdx(i);
                    }}
                    className={`group relative shrink-0 border px-4 py-3 text-left transition-colors lg:border-x-0 lg:border-t-0 lg:px-2 lg:py-5 ${on ? "border-amber/50 bg-amber/[0.06] lg:bg-transparent" : "border-holo/15 lg:border-holo/10"}`}
                  >
                    <div className="flex items-baseline gap-4">
                      <span className={`font-mono text-[11px] ${on ? "text-amber" : "text-holo/50"}`}>0{i + 1}</span>
                      <span>
                        <span className={`block whitespace-nowrap font-display text-lg font-semibold uppercase tracking-wide transition-colors lg:text-2xl ${on ? "text-ice" : "text-ice/45 group-hover:text-ice/80"}`}>
                          {pr.name}
                        </span>
                        <span className="hidden font-mono text-[11px] text-fog lg:block">{pr.kind}</span>
                      </span>
                    </div>
                    {on && (
                      <span className="absolute inset-x-0 -bottom-px h-px overflow-hidden">
                        <span ref={bar} className="block h-full origin-left bg-amber" style={{ transform: "scaleX(0)" }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={p.id}
                className="mt-8"
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.45 }}
                role="tabpanel"
              >
                <div className="hud-label">{p.role}</div>
                <p className="mt-3 font-display text-[22px] font-medium leading-snug text-ice">{p.headline}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ice/70">{p.summary}</p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                  {p.metrics.map((m) => (
                    <div key={m.label}>
                      <Counter
                        value={m.value}
                        prefix={m.prefix}
                        suffix={m.suffix}
                        replayKey={p.id}
                        className="font-display text-4xl font-bold text-amber glow-amber"
                      />
                      <div className="hud-label mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>
                <ul className="mt-6 space-y-2">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-[14px] text-ice/80">
                      <span className="mt-2 h-1 w-3 shrink-0 bg-holo" />
                      {h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* hologram */}
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-7">
            <div className="panel relative h-[380px] overflow-hidden sm:h-[480px] lg:h-[640px]">
              <HologramCanvas active={p.id} />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                <span className="live-dot" />
                <span className="hud-label">Holo-projector · {p.name}</span>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 text-right font-mono text-[10px] leading-relaxed tracking-[0.18em] text-holo/50">
                <div>MODEL {String(idx + 1).padStart(2, "0")}/{String(projects.length).padStart(2, "0")}</div>
                <div>{p.kind.toUpperCase()}</div>
              </div>
              <div className="pointer-events-none absolute bottom-4 left-4 hidden font-mono text-[10px] tracking-[0.18em] text-holo/50 sm:block">
                MOVE CURSOR · ORBIT
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
