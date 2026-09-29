"use client";

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { education } from "@/data/content";
import { mulberry32 } from "@/lib/random";
import { SectionTitle } from "../ui/SectionTitle";

const W = 640, H = 320, PAD = { l: 44, r: 20, t: 20, b: 36 };
const N = 120;

const CHECKPOINTS = [
  { at: 0.08, label: "first lines of code" },
  { at: 0.3, label: "first client system shipped" },
  { at: 0.52, label: "~2,000 users in production" },
  { at: 0.74, label: "owning the infrastructure" },
  { at: 0.95, label: "Integrated M.Tech · in progress" },
];

function curves() {
  const r = mulberry32(11);
  const loss: [number, number][] = [];
  const acc: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const l = 0.08 + 0.85 * Math.exp(-t * 3.6) + (r() - 0.5) * 0.06 * (1 - t * 0.7);
    const a = 0.12 + 0.8 * (1 - Math.exp(-t * 3.1)) + (r() - 0.5) * 0.04;
    loss.push([t, Math.max(0.03, l)]);
    acc.push([t, Math.min(0.97, a)]);
  }
  return { loss, acc };
}

const X = (t: number) => PAD.l + t * (W - PAD.l - PAD.r);
const Y = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);
const toPath = (pts: [number, number][]) => pts.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join("");

export function Education() {
  const ed = education[0];
  const chartRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: chartRef, offset: ["start 0.85", "end 0.45"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const { loss, acc } = useMemo(() => curves(), []);
  const [prog, setProg] = useState(0);
  useMotionValueEvent(p, "change", (v) => setProg(Math.max(0, Math.min(1, v))));
  const headIdx = Math.round(prog * N);
  const head = loss[headIdx];
  const headAcc = acc[headIdx];
  const epoch = Math.min(5, Math.floor(prog * 5) + 1);
  const pathLen = useTransform(p, [0, 1], [0, 1]);

  const hyper: [string, string][] = [
    ["learning_rate", "high"],
    ["batch_size", "1 founder"],
    ["optimizer", "ship → learn → repeat"],
    ["regularization", "production bugs"],
    ["dataset", "real businesses, Coimbatore"],
  ];

  return (
    <section id="education" data-section="education" className="section">
      <div className="container-hud">
        <SectionTitle id="education" title="Education" wordplay="Model still training." effect="progress" />

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <div ref={chartRef} className="panel p-5 sm:p-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="hud-label">Training run · srinivaas-v1</span>
              <span className="font-mono text-[11px] text-ice/80">
                epoch <span className="text-amber">{epoch}</span>/5 · loss <span className="text-holo">{head[1].toFixed(3)}</span> · acc{" "}
                <span className="text-amber">{headAcc[1].toFixed(3)}</span>
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full">
              {/* grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={Y(v)} y2={Y(v)} stroke="rgba(79,227,255,0.08)" />
                  <text x={PAD.l - 8} y={Y(v) + 3} textAnchor="end" fontSize="9" fill="rgba(138,166,184,0.8)" fontFamily="var(--font-jet)">
                    {v.toFixed(2)}
                  </text>
                </g>
              ))}
              {[1, 2, 3, 4, 5].map((e) => (
                <text key={e} x={X((e - 0.5) / 5)} y={H - 12} textAnchor="middle" fontSize="9" fill="rgba(138,166,184,0.8)" fontFamily="var(--font-jet)">
                  EPOCH {e}
                </text>
              ))}
              {/* curves */}
              <path d={toPath(loss)} fill="none" stroke="rgba(79,227,255,0.12)" strokeWidth="1.5" />
              <path d={toPath(acc)} fill="none" stroke="rgba(255,181,71,0.1)" strokeWidth="1.5" />
              <motion.path d={toPath(loss)} fill="none" stroke="#4fe3ff" strokeWidth="2.2" style={{ pathLength: pathLen, filter: "drop-shadow(0 0 6px #4fe3ff)" }} />
              <motion.path d={toPath(acc)} fill="none" stroke="#ffb547" strokeWidth="2.2" style={{ pathLength: pathLen, filter: "drop-shadow(0 0 6px #ffb547)" }} />
              {/* checkpoints */}
              {CHECKPOINTS.map((c, i) => {
                const reached = prog >= c.at;
                const pt = loss[Math.round(c.at * N)];
                const up = i % 2 === 0;
                return (
                  <g key={c.label} style={{ opacity: reached ? 1 : 0.15, transition: "opacity .5s" }}>
                    <line x1={X(c.at)} x2={X(c.at)} y1={Y(pt[1])} y2={Y(pt[1]) + (up ? -34 : 30)} stroke="rgba(226,251,255,0.35)" strokeDasharray="2 3" />
                    <circle cx={X(c.at)} cy={Y(pt[1])} r={reached ? 4 : 3} fill={reached ? "#5dffb5" : "#0b1a26"} stroke="#5dffb5" />
                    <text
                      x={Math.min(W - PAD.r - 4, Math.max(PAD.l + 4, X(c.at)))}
                      y={Y(pt[1]) + (up ? -40 : 44)}
                      textAnchor={c.at > 0.8 ? "end" : c.at < 0.15 ? "start" : "middle"}
                      fontSize="10"
                      fill="#e2fbff"
                      fontFamily="var(--font-jet)"
                    >
                      ✓ {c.label}
                    </text>
                  </g>
                );
              })}
              {/* head */}
              <circle cx={X(head[0])} cy={Y(head[1])} r="5" fill="#e2fbff" style={{ filter: "drop-shadow(0 0 8px #4fe3ff)" }} />
              <circle cx={X(headAcc[0])} cy={Y(headAcc[1])} r="4" fill="#ffb547" />
            </svg>
            <div className="mt-2 flex gap-6 font-mono text-[10.5px] text-fog">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-holo" /> loss (confusion)
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-amber" /> accuracy (shipping)
              </span>
            </div>
          </div>

          <div className="panel p-6 sm:p-7 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="hud-label">Model card</span>
              <span className="flex items-center gap-2 font-mono text-[10.5px] text-amber">
                <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse-dot" /> TRAINING
              </span>
            </div>
            <h3 className="mt-5 font-display text-[26px] font-semibold uppercase leading-tight tracking-wide text-ice">{ed.school}</h3>
            <p className="mt-2 text-[15px] text-holo-soft">{ed.program}</p>
            <p className="mt-3 text-[14px] text-ice/70">
              {ed.period}. {ed.note}
            </p>

            <div className="mt-6">
              <div className="flex justify-between font-mono text-[10px] tracking-[0.2em] text-fog">
                <span>PROGRESS</span>
                <span>ETA · GRADUATION</span>
              </div>
              <div className="relative mt-2 h-1.5 overflow-hidden bg-holo/10">
                <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber to-transparent" style={{ animation: "sweep-x 2.6s ease-in-out infinite" }} />
              </div>
            </div>

            <div className="mt-7 border-t border-holo/10 pt-5">
              <div className="hud-label mb-3">Hyperparameters</div>
              <dl className="space-y-2 font-mono text-[12.5px]">
                {hyper.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-holo/70">{k}</dt>
                    <dd className="text-right text-ice">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
