"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects, type Blueprint as BP } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { useSeen } from "@/lib/hooks";
import { Counter } from "../ui/Counter";
import { SectionTitle } from "../ui/SectionTitle";

const HologramCanvas = dynamic(() => import("../three/ProjectCanvas"), { ssr: false });

const CYCLE_MS = 9000;

/** The architecture under a product, drawn as a blueprint. */
function Blueprint({ bp }: { bp: BP }) {
  const nodes = Object.fromEntries(bp.nodes.map((n) => [n.id, n]));
  return (
    <div className="absolute inset-0 bg-[#031526]/95">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,227,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(79,227,255,0.12)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,227,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,227,255,0.05)_1px,transparent_1px)] bg-[size:6px_6px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {bp.edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#9ef3ff"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            style={{ animation: `dash-flow ${1.2 + i * 0.2}s linear infinite` }}
          />
        ))}
      </svg>
      {bp.nodes.map((n) => (
        <div
          key={n.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-holo-soft bg-[#031526] px-2 py-1.5 font-mono text-[10px] text-ice shadow-[0_0_20px_rgba(79,227,255,0.25)] sm:px-3 sm:py-2 sm:text-[11px]"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <span className="mr-1.5 text-amber sm:mr-2">▣</span>
          {n.label}
        </div>
      ))}
      <div className="absolute bottom-3 right-4 font-mono text-[10px] tracking-[0.25em] text-holo-soft/70">BLUEPRINT · REV A</div>
    </div>
  );
}

/** X-ray lens: follows the pointer, drifts on a Lissajous path when idle. */
function useLens(on: boolean) {
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!on || !el) return;
    let raf = 0;
    let hovering = false;
    const set = (x: number, y: number) => {
      layer.current?.style.setProperty("--lx", `${x}px`);
      layer.current?.style.setProperty("--ly", `${y}px`);
      if (lens.current) lens.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const loop = (ms: number) => {
      if (!hovering) {
        const t = ms / 1000;
        set(el.clientWidth * (0.5 + 0.3 * Math.sin(t * 0.55)), el.clientHeight * (0.5 + 0.26 * Math.sin(t * 0.9 + 1)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      set(e.clientX - b.left, e.clientY - b.top);
    };
    const enter = () => (hovering = true);
    const leave = () => (hovering = false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [on]);
  return { box, layer, lens };
}

export function Projects() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [xrayOn, setXrayOn] = useState(false);
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -20% 0px", false);
  const startedAt = useRef(0);
  const bar = useRef<HTMLSpanElement>(null);
  const p = projects[idx];
  const xray = xrayOn && !!p.blueprint;
  const { box, layer, lens } = useLens(xray);

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
        <SectionTitle id="projects" title="Featured Projects" wordplay="Shipped, not scripted." effect="flicker" />

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

          {/* hologram, with an X-ray lens onto the architecture underneath */}
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-7">
            <div ref={box} className="panel relative h-[380px] overflow-hidden sm:h-[480px] lg:h-[640px]" data-lock={xray ? "X-ray lens" : undefined}>
              <HologramCanvas active={p.id} />
              {p.blueprint && (
                <div
                  ref={layer}
                  className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                  style={{
                    opacity: xray ? 1 : 0,
                    maskImage: "radial-gradient(circle 120px at var(--lx, 50%) var(--ly, 50%), #000 0 110px, transparent 122px)",
                    WebkitMaskImage: "radial-gradient(circle 120px at var(--lx, 50%) var(--ly, 50%), #000 0 110px, transparent 122px)",
                  }}
                >
                  <Blueprint bp={p.blueprint} />
                </div>
              )}
              {xray && (
                <div ref={lens} className="pointer-events-none absolute left-0 top-0">
                  <div className="absolute -left-[122px] -top-[122px] h-[244px] w-[244px] rounded-full border border-holo-soft/70 shadow-[0_0_40px_rgba(79,227,255,0.35),inset_0_0_30px_rgba(79,227,255,0.25)]">
                    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
                      <circle cx="50" cy="50" r="48" fill="none" stroke="#ffb547" strokeWidth="0.6" strokeDasharray="1 5" />
                    </svg>
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9.5px] tracking-[0.3em] text-amber">X-RAY</span>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                <span className="live-dot" />
                <span className="hud-label">Holo-projector · {p.name}</span>
              </div>
              {p.blueprint && (
                <button
                  type="button"
                  onClick={() => {
                    hudAudio.tick();
                    setXrayOn((v) => !v);
                  }}
                  aria-pressed={xray}
                  className={`absolute right-3 top-3 border px-2.5 py-1.5 font-mono text-[10.5px] tracking-[0.2em] transition-colors ${xray ? "border-amber bg-amber/15 text-amber" : "border-holo/30 bg-void/60 text-holo-soft hover:border-amber hover:text-amber"}`}
                  data-lock="Toggle X-ray"
                >
                  {xray ? "◐ HOLOGRAM" : "◑ X-RAY"}
                </button>
              )}
              <div className="pointer-events-none absolute bottom-4 right-4 text-right font-mono text-[10px] leading-relaxed tracking-[0.18em] text-holo/50">
                <div>MODEL {String(idx + 1).padStart(2, "0")}/{String(projects.length).padStart(2, "0")}</div>
                <div>{p.kind.toUpperCase()}</div>
              </div>
              <div className="pointer-events-none absolute bottom-4 left-4 hidden font-mono text-[10px] tracking-[0.18em] text-holo/50 sm:block">
                {xray ? "MOVE CURSOR · X-RAY LENS" : "MOVE CURSOR · ORBIT"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
