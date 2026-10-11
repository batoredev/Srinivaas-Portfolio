"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef } from "react";
import { hudAudio } from "@/lib/audio";
import { getStore, setStore } from "@/lib/store";
import { Decoded, smoothstep, useProgress } from "../ui/Decode";

/*
 * The prologue: between the hero and chapter one, the page pins and the story
 * is told in single beats while the Core pulses behind each one. The four
 * verbs are the whole method: talk, model, build, run.
 */

type Beat = { big: string; sub: string; word: boolean };

const BEATS: Beat[] = [
  { big: "Every business runs on a story.", sub: "Most software never hears it.", word: false },
  { big: "Talk", sub: "to the business owner", word: true },
  { big: "Model", sub: "the data", word: true },
  { big: "Build", sub: "the product", word: true },
  { big: "Run", sub: "the servers it lives on", word: true },
  { big: "One person.", sub: "End to end.", word: false },
];

const N = BEATS.length;

function windows(i: number, P: number) {
  const span = 1 / N;
  const c = (i + 0.5) * span;
  const inP = i === 0 ? smoothstep(0, span * 0.4, P) : smoothstep(c - span * 0.55, c - span * 0.1, P);
  const outP = smoothstep(c + span * 0.22, c + span * 0.62, P);
  return { inP, outP };
}

export function Prologue() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const P = useProgress(scrollYProgress, 360);
  const active = Math.min(N - 1, Math.floor(P * N));
  const last = useRef(-1);

  // each new beat makes the Core pulse
  useEffect(() => {
    if (P <= 0 || P >= 1 || active === last.current) return;
    last.current = active;
    setStore({ beat: getStore().beat + 1 });
    hudAudio.tick();
  }, [active, P]);

  return (
    <section id="prologue" ref={ref} aria-label="Prologue" className="relative z-[2]" style={{ height: `${100 + N * 55}svh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        {/* a soft shadow behind the words so they read over the Core */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_50%,rgba(2,4,9,0.62),transparent_75%)]" />
        {BEATS.map((b, i) => {
          const { inP, outP } = windows(i, P);
          if (inP <= 0 || outP >= 1) return null;
          const fade = 1 - smoothstep(0.5, 1, outP);
          return (
            <div key={b.big} className="absolute inset-x-5 flex flex-col items-center text-center" style={{ opacity: fade }}>
              <p
                className={
                  b.word
                    ? "font-display text-[clamp(72px,17vw,250px)] font-bold uppercase leading-none tracking-[0.04em] text-amber glow-amber"
                    : "max-w-[18ch] font-display text-[clamp(34px,5.6vw,84px)] font-semibold leading-[1.05] text-ice glow-text"
                }
              >
                <Decoded text={b.big} inP={inP} outP={outP} glyphClassName={b.word ? "text-amber/60" : "text-holo/60"} />
              </p>
              <p className="mt-6 font-mono text-[clamp(13px,1.4vw,17px)] uppercase tracking-[0.3em] text-ice/90 [text-shadow:0_0_10px_#020409,0_0_22px_#020409]">
                <Decoded text={b.sub} inP={smoothstep(0.35, 1, inP)} outP={outP} />
              </p>
            </div>
          );
        })}

        {/* beat counter */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2" aria-hidden>
          {BEATS.map((b, i) => (
            <span key={b.big} className={`h-[3px] transition-all duration-500 ${i === active && P > 0 && P < 1 ? "w-8 bg-amber shadow-[0_0_8px_#ffb547]" : i < active ? "w-3 bg-holo/70" : "w-3 bg-holo/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
