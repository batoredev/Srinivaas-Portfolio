"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { profile, sections } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { useClock } from "@/lib/hooks";
import { setStore, useStore } from "@/lib/store";
import { scrollToSection } from "../scroll";
import { useScramble } from "../ui/SectionTitle";

export function Monogram({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="rgba(79,227,255,0.06)" stroke="rgba(79,227,255,0.7)" strokeWidth="1.2" />
      <polygon points="20,7 31.5,13.5 31.5,26.5 20,33 8.5,26.5 8.5,13.5" fill="none" stroke="rgba(255,181,71,0.5)" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="20" y="24.5" textAnchor="middle" fontFamily="var(--font-chakra)" fontWeight="700" fontSize="12" fill="#e2fbff" letterSpacing="0.5">
        SV
      </text>
    </svg>
  );
}

function ActiveSection() {
  const active = useStore((s) => s.active);
  const sec = sections.find((s) => s.id === active) ?? sections[0];
  const text = `CH.${sec.code} · ${sec.chapter.toUpperCase()}`;
  return (
    <span className="font-mono text-[11px] tracking-[0.22em] text-holo-soft">
      <Scrambled key={text} text={text} />
      <span className="ml-3 text-ice/40">{sec.label.toUpperCase()}</span>
    </span>
  );
}

/** Keyed by its text, so each change remounts and re-runs the decode. */
function Scrambled({ text }: { text: string }) {
  const out = useScramble(text, true, 520);
  return <>{out}</>;
}

function SoundToggle({ compact = false }: { compact?: boolean }) {
  const audio = useStore((s) => s.audio);
  return (
    <button
      type="button"
      data-lock={audio ? "Sound off" : "Sound on"}
      aria-label={audio ? "Turn sound off" : "Turn sound on"}
      aria-pressed={audio}
      onClick={() => {
        const next = !audio;
        hudAudio.setEnabled(next);
        setStore({ audio: next });
      }}
      className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.2em] text-holo-soft/80 hover:text-ice"
    >
      <span className="flex h-3.5 items-end gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-[2px] bg-holo"
            style={{
              height: audio ? undefined : 3,
              animation: audio ? `eq 0.${7 + i}s ease-in-out ${i * 0.1}s infinite alternate` : "none",
            }}
          />
        ))}
      </span>
      {!compact && <span>{audio ? "SOUND ON" : "SOUND OFF"}</span>}
      <style>{`@keyframes eq { from { height: 3px } to { height: 14px } }`}</style>
    </button>
  );
}

export function Hud() {
  const clock = useClock(profile.timezone);
  const engaged = useStore((s) => s.engaged);
  const sync = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (sync.current) sync.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {engaged && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          {/* viewport frame corners */}
          <div className="brackets absolute inset-2.5 hidden opacity-60 lg:block" style={{ ["--bl" as string]: "22px" }} />

          {/* top bar, with a fade so content never collides with it */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-void via-void/75 to-transparent" />
          <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
            <button
              type="button"
              data-lock="Back to top"
              onClick={() => scrollToSection("hero")}
              className="flex items-center gap-3 text-left"
            >
              <Monogram />
              <span className="hidden sm:block">
                <span className="block font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-ice">{profile.name}</span>
                <span className="block font-mono text-[9.5px] tracking-[0.25em] text-holo/60">NEURAL INTERFACE · CINEMATIC</span>
              </span>
            </button>

            <div className="hidden items-center gap-3 border border-holo/15 bg-void/50 px-4 py-2 backdrop-blur-md md:flex">
              <span className="live-dot" />
              <ActiveSection />
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <span className="hidden font-mono text-[10.5px] tracking-[0.2em] text-holo-soft/70 xl:inline">
                CJB <span className="text-ice">{clock}</span> IST
              </span>
              <SoundToggle compact />
              <button
                type="button"
                data-lock="Professional mode"
                onClick={() => setStore({ handoff: true })}
                className="border border-amber/50 bg-amber/10 px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-amber transition-colors hover:bg-amber hover:text-void sm:px-4"
              >
                <span className="hidden sm:inline">Professional </span>
                <span className="sm:hidden">Pro </span>↗
              </button>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 hidden h-16 bg-gradient-to-t from-void/80 to-transparent lg:block" />
          {/* bottom readouts */}
          <div className="absolute bottom-5 left-8 hidden items-center gap-3 lg:flex">
            <span className="hud-label">Sync</span>
            <span className="font-mono text-[11px] text-ice">
              <span ref={sync}>000</span>%
            </span>
            <span className="relative block h-px w-24 bg-holo/15">
              <span ref={bar} className="absolute inset-0 origin-left bg-amber" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
          <div className="absolute bottom-5 right-8 hidden items-center gap-4 lg:flex">
            <span className="hud-label">11.0168°N · 76.9558°E</span>
            <span className="flex items-center gap-2 hud-label">
              <span className="live-dot" /> Uplink stable
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SectionRail() {
  const active = useStore((s) => s.active);
  const engaged = useStore((s) => s.engaged);
  if (!engaged) return null;
  return (
    <motion.nav
      aria-label="Sections"
      className="fixed left-6 top-1/2 z-[71] hidden -translate-y-1/2 flex-col gap-[9px] lg:flex"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
    >
      {sections.map((s) => {
        const on = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            data-lock={s.label}
            aria-label={s.label}
            aria-current={on ? "true" : undefined}
            onClick={() => {
              hudAudio.tick();
              scrollToSection(s.id);
            }}
            className="group flex h-[10px] items-center gap-3"
          >
            <span
              className={`block h-px transition-all duration-500 ${on ? "w-9 bg-amber shadow-[0_0_8px_#ffb547]" : "w-3.5 bg-holo/35 group-hover:w-6 group-hover:bg-holo"}`}
            />
            <span
              className={`whitespace-nowrap font-mono text-[9.5px] tracking-[0.2em] transition-all duration-300 ${on ? "text-amber opacity-0 group-hover:opacity-100" : "text-holo-soft opacity-0 group-hover:opacity-100"}`}
            >
              {s.code} {s.chapter.toUpperCase()} <span className="text-ice/40">· {s.label}</span>
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}

export { SoundToggle };
