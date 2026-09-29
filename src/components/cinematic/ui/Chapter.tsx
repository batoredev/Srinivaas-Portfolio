"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { sectionMeta, sections, type SectionId } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { useSeen } from "@/lib/hooks";
import { getStore } from "@/lib/store";

const TOTAL = sections.length - 1;

/**
 * Chapter card between sections: the narrator (SV-OS) introduces what comes
 * next. A signal line threads each card to the chapters around it, so the
 * page reads as one continuous story rather than a stack of sections.
 */
export function Chapter({ id }: { id: SectionId }) {
  const meta = sectionMeta(id);
  const index = sections.findIndex((s) => s.id === id);
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -28% 0px");
  const [typed, setTyped] = useState("");
  const spoke = useRef(false);

  useEffect(() => {
    if (!seen) return;
    if (!spoke.current && getStore().audio) {
      spoke.current = true;
      hudAudio.speak(meta.narration);
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(meta.narration.slice(0, i));
      if (i >= meta.narration.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [seen, meta.narration]);

  return (
    <div ref={ref} id={`chapter-${id}`} className="relative z-[2] flex flex-col items-center px-5 pb-6 pt-10 text-center" aria-label={`Chapter ${meta.code}: ${meta.chapter}`}>
      {/* signal thread in */}
      <span className="relative block h-24 w-px overflow-hidden bg-gradient-to-b from-transparent to-holo/40">
        <span className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-amber to-transparent" style={{ animation: "sweep-y 2.4s linear infinite" }} />
      </span>

      <motion.div
        className="mt-6 flex items-center gap-4"
        initial={{ opacity: 0 }}
        animate={seen ? { opacity: 1 } : undefined}
        transition={{ duration: 0.6 }}
      >
        <span className="h-px w-10 bg-holo/40 sm:w-20" />
        <span className="font-mono text-[11px] tracking-[0.35em] text-holo-soft/70">
          CHAPTER {meta.code} / {String(TOTAL).padStart(2, "0")}
        </span>
        <span className="h-px w-10 bg-holo/40 sm:w-20" />
      </motion.div>

      <motion.h3
        className="mt-4 max-w-full font-display text-[clamp(21px,4.2vw,56px)] font-semibold uppercase text-amber glow-amber"
        initial={{ opacity: 0, letterSpacing: "0.9em", filter: "blur(10px)" }}
        animate={seen ? { opacity: 1, letterSpacing: "0.18em", filter: "blur(0px)" } : undefined}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {meta.chapter}
      </motion.h3>

      <p className="mt-5 min-h-[3.4em] max-w-[620px] font-mono text-[13.5px] leading-relaxed text-ice/80 sm:text-[15px]">
        <span className="text-holo/60">SV-OS › </span>
        {typed}
        {seen && <span className="animate-blink text-amber">▌</span>}
      </p>

      {/* story progress: one pip per chapter */}
      <div className="mt-5 flex items-center gap-1.5" aria-hidden>
        {sections.slice(1).map((s, i) => {
          const done = i + 1 < index;
          const now = i + 1 === index;
          return (
            <span
              key={s.id}
              className={`h-1 transition-all duration-700 ${now ? "w-6 bg-amber shadow-[0_0_8px_#ffb547]" : done ? "w-2.5 bg-holo/70" : "w-2.5 bg-holo/15"}`}
            />
          );
        })}
      </div>

      {/* signal thread out */}
      <span className="mt-8 block h-16 w-px bg-gradient-to-b from-holo/40 to-transparent" />
    </div>
  );
}
