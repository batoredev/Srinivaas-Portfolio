"use client";

import { motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";
import { currentlyBuilding, education, experience, profile, projects } from "@/data/content";
import { useSeen } from "@/lib/hooks";
import { setStore } from "@/lib/store";
import { SectionTitle } from "../ui/SectionTitle";

function Skeleton({ w }: { w: string }) {
  return <span className="block h-[5px] rounded-full bg-holo/25" style={{ width: w }} />;
}

/** A page that is laser-traced, then printed line by line by a scan bar. */
function PrintedPage() {
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -15% 0px", false);
  const p = useMotionValue(0);
  const t0 = useRef<number | null>(null);
  useAnimationFrame((time) => {
    if (!seen) return;
    if (t0.current === null) t0.current = time;
    const cycle = 9000;
    const k = ((time - t0.current) % cycle) / cycle;
    // trace 0–15%, print 15–70%, hold, then reset
    p.set(k < 0.15 ? 0 : Math.min(1, (k - 0.15) / 0.55));
  });
  const clip = useTransform(p, (v) => `inset(0 0 ${100 - v * 100}% 0)`);
  const barTop = useTransform(p, (v) => `${v * 100}%`);
  const barOpacity = useTransform(p, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);

  const sections: [string, string[]][] = [
    ["Experience", experience.map((e) => `${e.title} · ${e.org}`)],
    ["Projects", projects.map((x) => x.name)],
    ["Building", currentlyBuilding.slice(0, 2).map((b) => b.name)],
    ["Education", [education[0].program.split(",")[0] + " · " + education[0].short]],
  ];

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[420px] [perspective:1400px]">
      <div className="animate-float">
        <div className="relative aspect-[1/1.3] w-full [transform:rotateY(-14deg)_rotateX(8deg)] [transform-style:preserve-3d]">
          {/* laser outline */}
          <svg viewBox="0 0 100 130" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <motion.rect
              x="0.5"
              y="0.5"
              width="99"
              height="129"
              fill="rgba(6,20,32,0.7)"
              stroke="#4fe3ff"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={seen ? { pathLength: 1 } : undefined}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 0 6px #4fe3ff)" }}
            />
          </svg>
          {/* printed content */}
          <motion.div className="absolute inset-0 p-[8%]" style={{ clipPath: clip }}>
            <div className="font-display text-[clamp(16px,2vw,22px)] font-bold uppercase tracking-wide text-ice">{profile.name}</div>
            <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-amber">{profile.role.toUpperCase()}</div>
            <div className="mt-1 font-mono text-[8px] text-fog">
              {profile.email} · {profile.city}
            </div>
            <div className="mt-3 h-px bg-holo/30" />
            <div className="mt-3 space-y-1.5">
              <Skeleton w="96%" />
              <Skeleton w="88%" />
            </div>
            {sections.map(([h, items]) => (
              <div key={h} className="mt-4">
                <div className="font-mono text-[8.5px] tracking-[0.25em] text-holo">{h.toUpperCase()}</div>
                <div className="mt-1.5 space-y-1">
                  {items.map((it) => (
                    <div key={it} className="truncate text-[9.5px] leading-tight text-ice/80">
                      ▸ {it}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
          {/* print head */}
          <motion.div
            className="absolute -left-[6%] -right-[6%] h-[3px] bg-gradient-to-r from-transparent via-amber to-transparent shadow-[0_0_24px_#ffb547,0_0_60px_rgba(255,181,71,0.6)]"
            style={{ top: barTop, opacity: barOpacity }}
          />
        </div>
      </div>
      <div className="mx-auto mt-6 h-6 w-[70%] rounded-[50%] bg-holo/20 blur-xl" />
    </div>
  );
}

export function Resume() {
  const report: [string, string][] = [
    ["Input", `${projects.length} production systems · ${currentlyBuilding.length} builds in progress · 1 studio · 1 degree`],
    ["Output", "1 page"],
    ["Ratio", "lossless"],
    ["Format", "PDF · print-ready"],
  ];
  return (
    <section id="resume" data-section="resume" className="section">
      <div className="container-hud">
        <SectionTitle id="resume" title="Resume" wordplay="Lossless compression." effect="scan" />
        <div className="mt-14 grid items-center gap-14 lg:grid-cols-2">
          <PrintedPage />
          <div>
            <div className="panel p-6 sm:p-7">
              <div className="hud-label mb-4">Compression report</div>
              <dl className="space-y-3">
                {report.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[90px_1fr] gap-4 border-b border-holo/10 pb-3 last:border-0 last:pb-0">
                    <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-holo/70">{k}</dt>
                    <dd className={`text-[15px] ${k === "Ratio" ? "font-display font-semibold uppercase tracking-widest text-mint" : "text-ice/90"}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={profile.resumePdf} download className="btn-holo justify-center" data-lock="Download PDF">
                Download résumé · PDF ↓
              </a>
              <button type="button" className="btn-ghost justify-center" data-lock="Professional mode" onClick={() => setStore({ handoff: true })}>
                Professional mode ↗
              </button>
            </div>
            <p className="mt-5 max-w-[520px] text-[14px] leading-relaxed text-fog">
              Professional mode is the same story told plainly: a clean, printable résumé for interviewers and hiring teams. It is a one-way
              door, so the cinematic interface stays behind.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
