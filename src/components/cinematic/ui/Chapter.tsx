"use client";

import { useScroll } from "motion/react";
import { useEffect, useRef } from "react";
import { sectionMeta, sections, type SectionId } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { getStore } from "@/lib/store";
import { Decoded, smoothstep, useProgress } from "./Decode";

const TOTAL = sections.length - 1;

/**
 * Chapter interlude: a full-screen beat where the Core takes centre stage and
 * re-forms into the next chapter's shape, while the narrator (SV-OS) names
 * it. The words decode with the scroll and dissolve as the chapter begins.
 */
export function Chapter({ id }: { id: SectionId }) {
  const meta = sectionMeta(id);
  const index = sections.findIndex((s) => s.id === id);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useProgress(scrollYProgress, 200);
  const spoke = useRef(false);

  const out = smoothstep(0.76, 0.92, p);
  const label = { inP: smoothstep(0.14, 0.28, p), outP: out };
  const title = { inP: smoothstep(0.18, 0.34, p), outP: out };
  const line = { inP: smoothstep(0.24, 0.44, p), outP: out };

  useEffect(() => {
    if (spoke.current || p < 0.4 || p > 0.8) return;
    spoke.current = true;
    if (getStore().audio) hudAudio.speak(meta.narration);
  }, [p, meta.narration]);

  return (
    <div
      ref={ref}
      id={`chapter-${id}`}
      className="relative z-[2] flex min-h-[92svh] flex-col items-center justify-end overflow-x-clip px-5 pb-[11svh] text-center"
      aria-label={`Chapter ${meta.code}: ${meta.chapter}`}
    >
      <p className="font-mono text-[11px] tracking-[0.35em] text-holo-soft/80">
        <Decoded text={`CHAPTER ${meta.code} / ${String(TOTAL).padStart(2, "0")}`} {...label} />
      </p>

      <h3 className="mt-4 max-w-full font-display text-[clamp(30px,6vw,84px)] font-semibold uppercase tracking-[0.16em] text-amber glow-amber">
        <Decoded text={meta.chapter} {...title} glyphClassName="text-amber/50" />
      </h3>

      <p className="mt-4 min-h-[1.6em] max-w-[620px] font-mono text-[13.5px] leading-relaxed text-ice/85 sm:text-[15px]">
        <span className="text-holo/60" style={{ opacity: line.inP > 0 && line.outP < 1 ? 1 : 0 }}>
          SV-OS ›{" "}
        </span>
        <Decoded text={meta.narration} {...line} />
      </p>

      {/* story progress: one pip per chapter */}
      <div className="mt-6 flex items-center gap-1.5" aria-hidden style={{ opacity: 1 - out }}>
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
    </div>
  );
}
