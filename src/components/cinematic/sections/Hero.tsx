"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/content";
import { useIsDesktop } from "@/lib/hooks";
import { useStore, setStore } from "@/lib/store";
import { BRAIN_LABELS } from "../three/NeuralBrain";
import { useScramble } from "../ui/SectionTitle";
import { scrollToSection } from "../scroll";

const HeroCanvas = dynamic(() => import("../three/HeroCanvas"), { ssr: false });

const ROTATING = ["run on.", "count on.", "grow on.", "bank on."];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ROTATING.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-flex h-[1.25em] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={ROTATING[i]}
          className="inline-block whitespace-nowrap text-amber glow-amber"
          initial={{ y: "100%", opacity: 0, rotateX: -80 }}
          animate={{ y: "0%", opacity: 1, rotateX: 0 }}
          exit={{ y: "-100%", opacity: 0, rotateX: 80 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {ROTATING[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function NameLine({ text, outline, active, delay }: { text: string; outline?: boolean; active: boolean; delay: number }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  const out = useScramble(text, go, 1500);
  return (
    <span className="relative block">
      <span className="invisible">{text}</span>
      <span className={`absolute inset-0 ${outline ? "text-outline" : "text-ice glow-text"}`}>{out}</span>
    </span>
  );
}

export function Hero() {
  const desktop = useIsDesktop();
  const engaged = useStore((s) => s.engaged);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <section id="hero" data-section="hero" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      <HeroCanvas labelRefs={labelRefs} mobile={!desktop} />

      {/* grid + horizon glow layered over the canvas */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(79,227,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(79,227,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_60%_50%,transparent_20%,#000_75%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent" />

      {/* brain region callouts, positioned every frame by the scene */}
      {desktop && (
        <div className="pointer-events-none absolute inset-0">
          {BRAIN_LABELS.map((l, i) => (
            <div
              key={l.name}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className="group absolute left-0 top-0 opacity-0"
              data-side="right"
            >
              <div className="flex -translate-y-1/2 items-center gap-2 group-data-[side=left]:-translate-x-full group-data-[side=left]:flex-row-reverse">
                <span className="h-2 w-2 rounded-full border border-amber bg-amber/40 shadow-[0_0_10px_#ffb547]" />
                <span className="h-px w-12 bg-gradient-to-r from-amber/80 to-holo/30 group-data-[side=left]:bg-gradient-to-l" />
                <span className="whitespace-nowrap border border-holo/20 bg-void/60 px-2 py-1 backdrop-blur-sm">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.25em] text-holo-soft/70">{l.name}</span>
                  <span className="block font-display text-[12px] tracking-wide text-ice">{l.note}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="container-hud relative flex h-full flex-col justify-end pb-24 pt-28 lg:justify-center lg:pb-0">
        <div className="max-w-[640px]">
          <motion.div
            className="mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={engaged ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="live-dot" />
            <span className="hud-label">Subject file · SV-01 · {profile.city}, IN</span>
          </motion.div>

          <h1 className="font-display text-[clamp(50px,8.4vw,128px)] font-bold uppercase leading-[0.86] tracking-[-0.02em]" aria-label={profile.name}>
            <NameLine text={profile.firstName} active={engaged} delay={500} />
            <NameLine text={profile.lastName} outline active={engaged} delay={900} />
          </h1>

          <motion.p
            className="mt-6 font-display text-[clamp(17px,1.6vw,22px)] font-medium uppercase tracking-[0.14em] text-holo-soft"
            initial={{ opacity: 0 }}
            animate={engaged ? { opacity: 1 } : undefined}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            {profile.role} <span className="text-amber">·</span> {profile.studio}
          </motion.p>

          <motion.p
            className="mt-4 max-w-[620px] text-[clamp(16px,1.35vw,19px)] leading-relaxed text-ice/80"
            initial={{ opacity: 0, y: 12 }}
            animate={engaged ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 1.9, duration: 0.8 }}
          >
            I build software that local businesses actually <RotatingWord />
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={engaged ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 2.2, duration: 0.8 }}
          >
            <button type="button" className="btn-holo" data-lock="Chapter 01" onClick={() => scrollToSection("about")}>
              Begin the story <span aria-hidden>↓</span>
            </button>
            <button type="button" className="btn-ghost" data-lock="Professional mode" onClick={() => setStore({ handoff: true })}>
              Professional mode <span aria-hidden>↗</span>
            </button>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        initial={{ opacity: 0 }}
        animate={engaged ? { opacity: 1 } : undefined}
        transition={{ delay: 3 }}
      >
        <span className="hud-label">Scroll · chapter 01 begins</span>
        <span className="relative h-10 w-px overflow-hidden bg-holo/15">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-holo" style={{ animation: "sweep-y 1.6s ease-in-out infinite" }} />
        </span>
      </motion.div>

      <motion.div
        className="absolute bottom-16 right-8 hidden gap-8 text-right lg:flex"
        initial={{ opacity: 0 }}
        animate={engaged ? { opacity: 1 } : undefined}
        transition={{ delay: 2.6 }}
      >
        {[
          ["~2,000", "students on one platform"],
          ["25+", "tables, one schema"],
          ["31", "agents, one workflow"],
        ].map(([v, l]) => (
          <div key={l}>
            <div className="font-display text-2xl font-semibold text-ice">{v}</div>
            <div className="hud-label !text-[9.5px]">{l}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
