"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { caseStudies, type CaseStudy } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { SectionTitle } from "../ui/SectionTitle";

const ACTIVITY: Record<string, string[]> = {
  pss: ["Membership renewed", "Food pass issued", "Check-in recorded", "Referral cashback queued"],
  bites: ["Place extracted → review queue", "Reviewer approved listing", "Today's picks cached", "Geo query · within 2 km"],
  infra: ["Schema migrated · project_a", "Tunnel healthy", "Object sync → MinIO", "TLS renewed by Caddy"],
};

function Surface({ cs }: { cs: CaseStudy }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[linear-gradient(160deg,#0b1a26,#060d15)] p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber" />
          <span className="font-display text-[14px] font-semibold uppercase tracking-wider text-ice">{cs.title}</span>
        </div>
        <span className="rounded-full bg-mint/10 px-2.5 py-0.5 font-mono text-[10px] text-mint">{cs.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cs.surface.map((m) => (
          <div key={m.label} className="rounded-md border border-white/5 bg-white/[0.03] p-3">
            <div className="text-[10.5px] text-fog">{m.label}</div>
            <div className="mt-1 font-display text-lg font-semibold text-ice">{m.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid flex-1 grid-cols-5 gap-3">
        <div className="col-span-3 flex items-end gap-1.5 rounded-md border border-white/5 bg-white/[0.02] p-3">
          {[40, 55, 48, 70, 62, 85, 78, 92, 88, 96].map((h, i) => (
            <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-holo/30 to-holo/80" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="col-span-2 space-y-2">
          {ACTIVITY[cs.id].map((a) => (
            <div key={a} className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2 text-[11px] text-ice/80">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
              <span className="truncate">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Blueprint({ cs }: { cs: CaseStudy }) {
  const nodes = Object.fromEntries(cs.blueprint.nodes.map((n) => [n.id, n]));
  return (
    <div className="absolute inset-0 bg-[#031526]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,227,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(79,227,255,0.12)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,227,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,227,255,0.05)_1px,transparent_1px)] bg-[size:6px_6px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {cs.blueprint.edges.map(([a, b], i) => (
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
      {cs.blueprint.nodes.map((n) => (
        <div
          key={n.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-holo-soft bg-[#031526] px-3 py-2 font-mono text-[11px] text-ice shadow-[0_0_20px_rgba(79,227,255,0.25)]"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <span className="mr-2 text-amber">▣</span>
          {n.label}
        </div>
      ))}
      <div className="absolute bottom-3 right-4 font-mono text-[10px] tracking-[0.25em] text-holo-soft/70">BLUEPRINT · REV A</div>
    </div>
  );
}

function XRay({ cs }: { cs: CaseStudy }) {
  const box = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const hovering = useRef(false);

  useEffect(() => {
    let raf = 0;
    const set = (x: number, y: number) => {
      layer.current?.style.setProperty("--lx", `${x}px`);
      layer.current?.style.setProperty("--ly", `${y}px`);
      if (lens.current) lens.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    // idle lens drifts on a Lissajous path so the effect explains itself
    const loop = (ms: number) => {
      if (!hovering.current && box.current) {
        const t = ms / 1000;
        const w = box.current.clientWidth, h = box.current.clientHeight;
        set(w * (0.5 + 0.32 * Math.sin(t * 0.55)), h * (0.5 + 0.28 * Math.sin(t * 0.9 + 1)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const el = box.current!;
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      set(e.clientX - b.left, e.clientY - b.top);
    };
    const enter = () => (hovering.current = true);
    const leave = () => (hovering.current = false);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div className="panel relative overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-holo/15 px-4 py-2.5">
        <span className="hud-label">X-ray viewer · {full ? "blueprint" : "surface"}</span>
        <button
          type="button"
          onClick={() => {
            hudAudio.tick();
            setFull((v) => !v);
          }}
          className="font-mono text-[10.5px] tracking-[0.2em] text-amber hover:text-ice"
          data-lock="Toggle X-ray"
        >
          {full ? "◐ SURFACE" : "◑ FULL X-RAY"}
        </button>
      </div>
      <div ref={box} className="relative h-[420px] overflow-hidden sm:h-[460px]" data-lock="X-ray lens">
        <Surface cs={cs} />
        <div
          ref={layer}
          className="absolute inset-0 transition-[clip-path] duration-700"
          style={{
            maskImage: full ? "none" : "radial-gradient(circle 120px at var(--lx, 50%) var(--ly, 50%), #000 0 110px, transparent 122px)",
            WebkitMaskImage: full ? "none" : "radial-gradient(circle 120px at var(--lx, 50%) var(--ly, 50%), #000 0 110px, transparent 122px)",
          }}
        >
          <Blueprint cs={cs} />
        </div>
        {!full && (
          <div ref={lens} className="pointer-events-none absolute left-0 top-0">
            <div className="absolute -left-[122px] -top-[122px] h-[244px] w-[244px] rounded-full border border-holo-soft/70 shadow-[0_0_40px_rgba(79,227,255,0.35),inset_0_0_30px_rgba(79,227,255,0.25)]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#ffb547" strokeWidth="0.6" strokeDasharray="1 5" />
              </svg>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9.5px] tracking-[0.3em] text-amber">X-RAY</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseStudies() {
  const [idx, setIdx] = useState(0);
  const cs = caseStudies[idx];
  return (
    <section id="cases" data-section="cases" className="section">
      <div className="container-hud">
        <SectionTitle id="cases" title="Case Studies" wordplay="Every product has an X-ray." effect="blueprint" />

        <div role="tablist" aria-label="Case studies" className="mt-12 flex flex-wrap gap-2">
          {caseStudies.map((c, i) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={i === idx}
              onClick={() => {
                hudAudio.tick();
                setIdx(i);
              }}
              data-lock={c.title}
              className={`border px-4 py-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors ${i === idx ? "border-amber bg-amber/10 text-amber" : "border-holo/20 text-ice/60 hover:border-holo/50 hover:text-ice"}`}
            >
              <span className="mr-2 font-mono text-[10px] opacity-60">0{i + 1}</span>
              {c.title}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={cs.id}
            className="mt-8 grid gap-8 lg:grid-cols-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
          >
            <div className="lg:col-span-7">
              <XRay cs={cs} />
            </div>
            <div className="space-y-7 lg:col-span-5">
              <div>
                <div className="hud-label !text-alert/80">Problem</div>
                <p className="mt-2 text-[15.5px] leading-relaxed text-ice/85">{cs.problem}</p>
              </div>
              <div>
                <div className="hud-label">Approach</div>
                <ol className="mt-3 space-y-3">
                  {cs.approach.map((a, i) => (
                    <li key={a} className="flex gap-4 text-[14.5px] leading-relaxed text-ice/80">
                      <span className="mt-0.5 font-mono text-[12px] text-amber">{String(i + 1).padStart(2, "0")}</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="brackets border border-mint/20 bg-mint/[0.04] p-5" style={{ ["--bc" as string]: "rgba(93,255,181,.8)" }}>
                <div className="hud-label !text-mint">Outcome</div>
                <p className="mt-2 font-display text-[18px] font-medium leading-snug text-ice">{cs.outcome}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
