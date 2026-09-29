"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import { education, profile } from "@/data/content";
import { hashString, mulberry32 } from "@/lib/random";
import { SectionTitle } from "../ui/SectionTitle";

const STATEMENT = "I talk to the business owner, model the data, build the product, and run the servers it lives on.";
const VERBS = new Set(["talk", "model", "build", "run"]);

function ScrubWord({ word, i, n, progress }: { word: string; i: number; n: number; progress: MotionValue<number> }) {
  const start = i / n;
  const end = start + 1.6 / n;
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const y = useTransform(progress, [start, end], [6, 0]);
  const clean = word.replace(/[^a-z]/gi, "").toLowerCase();
  const verb = VERBS.has(clean);
  return (
    <motion.span style={{ opacity, y }} className={`mr-[0.28em] inline-block ${verb ? "text-amber glow-amber" : ""}`}>
      {word}
    </motion.span>
  );
}

/** Concentric, noise-warped rings seeded by the name: a "neural fingerprint". */
function Fingerprint() {
  const paths = useMemo(() => {
    const r = mulberry32(hashString(profile.name));
    const phases = Array.from({ length: 5 }, () => r() * Math.PI * 2);
    const out: string[] = [];
    for (let k = 0; k < 13; k++) {
      const base = 12 + k * 6.2;
      let d = "";
      for (let j = 0; j <= 96; j++) {
        const t = (j / 96) * Math.PI * 2;
        const w =
          Math.sin(t * 3 + phases[0] + k * 0.3) * 2.6 +
          Math.sin(t * 5 + phases[1] - k * 0.2) * 1.6 +
          Math.sin(t * 2 + phases[2]) * (k * 0.35);
        const rr = base + w;
        const x = 100 + Math.cos(t) * rr;
        const y = 100 + Math.sin(t) * rr * 1.08;
        d += `${j === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }
      out.push(d + "Z");
    }
    return out;
  }, []);
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <g className="animate-spin-slower" style={{ transformOrigin: "100px 100px" }}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={i % 4 === 0 ? "#ffb547" : "#4fe3ff"} strokeOpacity={0.25 + (i / paths.length) * 0.55} strokeWidth={i % 4 === 0 ? 1.1 : 0.8} />
        ))}
      </g>
      <circle cx="100" cy="100" r="5" fill="#ffb547" />
      <circle cx="100" cy="100" r="9" fill="none" stroke="#ffb547" strokeOpacity="0.5" />
    </svg>
  );
}

function IdHologram() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 14 });
  const glareX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);

  const fields: [string, string][] = [
    ["Role", profile.role],
    ["Studio", `${profile.studio} · ${profile.city}`],
    ["Education", `Integrated M.Tech · ${education[0].short}`],
    ["Mode", "End to end"],
  ];

  return (
    <div className="relative mx-auto w-full max-w-[440px] pb-24" style={{ perspective: 1100 }}>
      {/* emitter + light cone */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[110%] w-[120%] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_100%,transparent_150deg,rgba(79,227,255,0.14)_170deg,rgba(79,227,255,0.22)_180deg,rgba(79,227,255,0.14)_190deg,transparent_210deg)] [mask-image:linear-gradient(to_top,#000,transparent_85%)]" />
      <div className="absolute bottom-3 left-1/2 h-9 w-[70%] -translate-x-1/2 rounded-[50%] border border-holo/50 bg-holo/10 shadow-[0_0_60px_rgba(79,227,255,0.5)]" />
      <div className="absolute bottom-5 left-1/2 h-4 w-[40%] -translate-x-1/2 rounded-[50%] bg-holo/60 blur-md" />

      <motion.div
        ref={ref}
        className="animate-float relative"
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          const b = ref.current!.getBoundingClientRect();
          mx.set((e.clientX - b.left) / b.width - 0.5);
          my.set((e.clientY - b.top) / b.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        data-lock="Identity hologram"
      >
        <div className="panel overflow-hidden p-6">
          {/* scanline sweep + glare */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-holo/10 to-transparent" style={{ animation: "sweep-y 4.5s linear infinite" }} />
            <motion.div className="absolute -inset-y-10 w-32 -skew-x-12 bg-white/[0.04] blur-xl" style={{ left: glareX }} />
          </div>

          <div className="flex items-center justify-between">
            <span className="hud-label">Identity · verified</span>
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-mint">
              <span className="live-dot" /> LIVE
            </span>
          </div>

          <div className="mt-5 flex items-center gap-5" style={{ transform: "translateZ(40px)" }}>
            <div className="relative h-28 w-28 shrink-0 border border-holo/25 bg-void/60 p-1">
              <Fingerprint />
              <span className="brackets absolute inset-0" />
            </div>
            <div className="min-w-0">
              <div className="hud-label">Name</div>
              <div className="mt-1 font-display text-2xl font-semibold uppercase leading-tight tracking-wide text-ice">{profile.name}</div>
              <div className="mt-2 font-mono text-[11px] text-amber">ID · SV-01-CJB</div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3" style={{ transform: "translateZ(24px)" }}>
            {fields.map(([k, v]) => (
              <div key={k} className="min-w-0 border-l border-holo/20 pl-3">
                <dt className="hud-label !text-[9px]">{k}</dt>
                <dd className="mt-0.5 text-[13px] leading-snug text-ice/90">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="flex h-8 items-end gap-[2px]">
              {Array.from({ length: 34 }, (_, i) => (
                <span key={i} className="bg-holo/70" style={{ width: (i * 7) % 3 === 0 ? 3 : 1, height: `${55 + ((i * 37) % 45)}%` }} />
              ))}
            </div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-holo/60">{profile.location.toUpperCase()}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Loop() {
  return (
    <div className="relative mt-12">
      <div className="hud-label mb-5">The loop · every project, end to end</div>
      <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="pointer-events-none absolute left-[12%] right-[12%] top-[26px] hidden h-px bg-holo/20 sm:block">
          <span className="absolute top-1/2 h-[3px] w-16 -translate-y-1/2 bg-gradient-to-r from-transparent via-amber to-transparent" style={{ animation: "loop-run 4s linear infinite" }} />
        </div>
        {profile.loop.map((s, i) => (
          <div key={s.verb} className="relative flex flex-col items-center text-center">
            <span
              className="relative z-10 flex h-[52px] w-[52px] items-center justify-center border border-holo/40 bg-void font-display text-lg font-bold text-ice"
              style={{ animation: `loop-node 4s ease-in-out ${i}s infinite`, clipPath: "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mt-3 font-display text-[17px] font-semibold uppercase tracking-[0.16em] text-ice">{s.verb}</span>
            <span className="mt-1 text-[13px] text-fog">{s.detail}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes loop-run { from { left: -10% } to { left: 100% } }
        @keyframes loop-node { 0%, 20%, 100% { background: #020409; color: #e2fbff; box-shadow: none } 8% { background: #ffb547; color: #020409; box-shadow: 0 0 30px #ffb547 } }
      `}</style>
    </div>
  );
}

export function About() {
  const statementRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: statementRef, offset: ["start 0.85", "end 0.45"] });
  const words = STATEMENT.split(" ");

  const blocks = [
    { k: "Shipped", body: profile.about[1] },
    { k: "Building", body: profile.about[2] },
    { k: "Owning the stack", body: profile.about[3] },
  ];

  return (
    <section id="about" data-section="about" className="section">
      <div className="container-hud">
        <SectionTitle id="about" title="About Me" wordplay="Full stack. Full stop." effect="assemble" />

        <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <IdHologram />
            </div>
          </div>

          <div className="lg:col-span-7">
            <p ref={statementRef} className="font-display text-[clamp(28px,3.4vw,46px)] font-medium leading-[1.18] text-ice">
              {words.map((w, i) => (
                <ScrubWord key={i} word={w} i={i} n={words.length} progress={scrollYProgress} />
              ))}
            </p>

            <Loop />

            <motion.p
              className="mt-14 text-[17px] leading-[1.75] text-ice/85"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8 }}
            >
              {profile.about[0]}
            </motion.p>

            <div className="mt-10 space-y-4">
              {blocks.map((b, i) => (
                <motion.div
                  key={b.k}
                  className="panel p-6"
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="font-mono text-[11px] text-amber">0{i + 1}</span>
                    <span className="hud-label">{b.k}</span>
                  </div>
                  <p className="text-[15px] leading-[1.75] text-ice/75">{b.body}</p>
                </motion.div>
              ))}
              <p className="pt-2 font-mono text-[12.5px] text-holo-soft/70">
                <span className="text-amber">&gt;</span> {profile.about[4]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
