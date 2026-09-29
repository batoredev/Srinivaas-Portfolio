"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { mulberry32, hashString, usePrefersReducedMotion, useSeen } from "@/lib/hooks";
import { sectionMeta, type SectionId } from "@/data/content";

export type TitleEffect =
  | "decode"
  | "assemble"
  | "type"
  | "flicker"
  | "diff"
  | "fire"
  | "odometer"
  | "stamp"
  | "blueprint"
  | "prompt"
  | "progress"
  | "declassify"
  | "wave"
  | "scan"
  | "lock"
  | "crt";

const GLYPHS = "ΔΣΛΨΞΩ01<>/\\{}[]#$%&*+=?アカサタナハマヤラワ";

const titleClass =
  "font-display font-semibold uppercase leading-[0.92] tracking-[-0.01em] text-[clamp(40px,6.6vw,96px)] text-ice";

/* ───────────────────────── helpers ───────────────────────── */

function Words({
  text,
  render,
}: {
  text: string;
  render: (ch: string, i: number) => ReactNode;
}) {
  let idx = 0;
  const words = text.split(" ");
  return (
    <>
      {words.map((w, wi) => {
        const nodes = w.split("").map((ch) => render(ch, idx++));
        idx++; // account for the space
        return (
          <span key={wi} className="inline-block whitespace-nowrap">
            {nodes}
            {wi < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
          </span>
        );
      })}
    </>
  );
}

export function useScramble(text: string, active: boolean, duration = 1400) {
  const [out, setOut] = useState(() => text.replace(/\S/g, " "));
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    let last = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      if (now - last > 38 || p === 1) {
        last = now;
        const reveal = Math.floor(p * text.length * 1.05);
        setOut(
          text
            .split("")
            .map((c, i) => (c === " " ? " " : i < reveal ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
            .join(""),
        );
      }
      if (p < 1) raf = requestAnimationFrame(step);
      else setOut(text);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, active, duration]);
  return out;
}

/* ───────────────────────── effects ───────────────────────── */

function Decode({ text, seen }: { text: string; seen: boolean }) {
  const out = useScramble(text, seen, 1300);
  return (
    <span className="relative inline-block">
      <span className="invisible">{text}</span>
      <span className="absolute inset-0 glow-text">{out}</span>
    </span>
  );
}

function Assemble({ text, seen }: { text: string; seen: boolean }) {
  const rnd = useMemo(() => {
    const r = mulberry32(hashString(text));
    const q = (n: number) => Math.round(n * 100) / 100;
    return text.split("").map(() => ({ x: q((r() - 0.5) * 260), y: q((r() - 0.5) * 160), rot: q((r() - 0.5) * 90), z: q(r()) }));
  }, [text]);
  return (
    <Words
      text={text}
      render={(ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, x: rnd[i].x, y: rnd[i].y, rotate: rnd[i].rot, filter: "blur(12px)" }}
          animate={seen ? { opacity: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 1.1, delay: 0.02 * i + rnd[i].z * 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {ch}
        </motion.span>
      )}
    />
  );
}

function TypeOn({ text, seen }: { text: string; seen: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 62);
    return () => clearInterval(id);
  }, [seen, text]);
  return (
    <span className="relative inline-block">
      <span className="invisible">{text}▌</span>
      <span className="absolute inset-0">
        {text.slice(0, n)}
        <span className="animate-blink text-amber">▌</span>
      </span>
    </span>
  );
}

function Flicker({ text, seen }: { text: string; seen: boolean }) {
  return (
    <motion.span
      className="relative inline-block"
      initial={{ opacity: 0 }}
      animate={
        seen
          ? {
              opacity: [0, 0.9, 0.1, 1, 0.35, 1, 0.8, 1],
              x: [0, -6, 4, 0, 3, -2, 0, 0],
              textShadow: [
                "8px 0 rgba(255,77,106,.9), -8px 0 rgba(79,227,255,.9)",
                "-5px 0 rgba(255,77,106,.8), 5px 0 rgba(79,227,255,.8)",
                "3px 0 rgba(255,77,106,.6), -3px 0 rgba(79,227,255,.6)",
                "0 0 24px rgba(79,227,255,.55)",
                "2px 0 rgba(255,77,106,.5), -2px 0 rgba(79,227,255,.5)",
                "0 0 24px rgba(79,227,255,.45)",
                "0 0 22px rgba(79,227,255,.4)",
                "0 0 18px rgba(79,227,255,.35)",
              ],
            }
          : undefined
      }
      transition={{ duration: 1.3, times: [0, 0.1, 0.18, 0.3, 0.42, 0.6, 0.8, 1] }}
    >
      {text}
      {seen && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-[18%] bg-holo/20 mix-blend-screen"
          initial={{ top: "-20%", opacity: 1 }}
          animate={{ top: ["-20%", "110%"], opacity: [1, 1, 0] }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      )}
    </motion.span>
  );
}

function Diff({ text, seen }: { text: string; seen: boolean }) {
  return (
    <span className="block">
      <span className="mb-3 flex items-center gap-3 font-mono text-[13px] tracking-normal normal-case">
        <span className="text-alert">-</span>
        <span className="relative text-alert/80">
          experience: &quot;hardworking team player&quot;
          <motion.span
            className="absolute left-0 top-1/2 h-px w-full origin-left bg-alert"
            initial={{ scaleX: 0 }}
            animate={seen ? { scaleX: 1 } : undefined}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </span>
      </span>
      <span className="relative flex items-baseline gap-4">
        <motion.span
          className="font-mono text-[0.5em] text-mint"
          initial={{ opacity: 0 }}
          animate={seen ? { opacity: 1 } : undefined}
          transition={{ delay: 0.7 }}
        >
          +
        </motion.span>
        <motion.span
          className="relative inline-block"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={seen ? { clipPath: "inset(0 0% 0 0)" } : undefined}
          transition={{ duration: 0.9, delay: 0.8, ease: [0.7, 0, 0.2, 1] }}
        >
          {text}
        </motion.span>
        <motion.span
          aria-hidden
          className="absolute -inset-x-3 inset-y-0 -z-10 bg-mint/[0.06]"
          initial={{ scaleX: 0 }}
          animate={seen ? { scaleX: 1 } : undefined}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.9, delay: 0.75 }}
        />
      </span>
    </span>
  );
}

function Fire({ text, seen }: { text: string; seen: boolean }) {
  return (
    <Words
      text={text}
      render={(ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ color: "rgba(158,243,255,0.14)", textShadow: "0 0 0 rgba(0,0,0,0)" }}
          animate={
            seen
              ? {
                  color: ["rgba(158,243,255,0.14)", "#ffffff", "#ffd89a", "#e2fbff"],
                  textShadow: [
                    "0 0 0 rgba(0,0,0,0)",
                    "0 0 30px rgba(255,181,71,1), 0 0 4px #fff",
                    "0 0 20px rgba(255,181,71,.5)",
                    "0 0 14px rgba(79,227,255,.35)",
                  ],
                }
              : undefined
          }
          transition={{ duration: 0.9, delay: 0.3 + i * 0.07, times: [0, 0.25, 0.55, 1] }}
        >
          {ch}
        </motion.span>
      )}
    />
  );
}

function Odometer({ text, seen }: { text: string; seen: boolean }) {
  const cols = useMemo(() => {
    const r = mulberry32(hashString(text) ^ 0x9e37);
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return text.split("").map((c) => {
      const n = 6 + Math.floor(r() * 6);
      return [...Array.from({ length: n }, () => alpha[Math.floor(r() * alpha.length)]), c];
    });
  }, [text]);
  return (
    <Words
      text={text}
      render={(ch, i) => (
        <span key={i} className="relative inline-block overflow-hidden align-bottom" style={{ height: "1em", lineHeight: 1 }}>
          <motion.span
            className="flex flex-col"
            initial={{ y: 0 }}
            animate={seen ? { y: `-${cols[i].length - 1}em` } : undefined}
            transition={{ duration: 1.2 + i * 0.05, delay: i * 0.03, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {cols[i].map((c, j) => (
              <span key={j} className={j === cols[i].length - 1 ? "text-ice" : "text-holo/50"} style={{ height: "1em" }}>
                {c}
              </span>
            ))}
          </motion.span>
        </span>
      )}
    />
  );
}

function Stamp({ text, seen }: { text: string; seen: boolean }) {
  return (
    <motion.span
      className="relative inline-flex flex-wrap items-center gap-x-6 gap-y-3"
      initial={{ opacity: 0, scale: 2.3, rotate: -5 }}
      animate={seen ? { opacity: 1, scale: 1, rotate: 0, x: [0, 0, -7, 6, -3, 0] } : undefined}
      transition={{
        scale: { type: "spring", stiffness: 520, damping: 26 },
        opacity: { duration: 0.2 },
        rotate: { duration: 0.35 },
        x: { duration: 0.5, delay: 0.25 },
      }}
    >
      <span>{text}</span>
      <motion.span
        className="inline-flex items-center gap-2 border-2 border-mint px-3 py-1 font-mono text-[0.18em] tracking-[0.3em] text-mint"
        initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
        animate={seen ? { opacity: 1, scale: 1, rotate: -8 } : undefined}
        transition={{ delay: 0.7, type: "spring", stiffness: 600, damping: 18 }}
      >
        ✓ VERIFIED
      </motion.span>
    </motion.span>
  );
}

function Blueprint({ text, seen }: { text: string; seen: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <span className="relative inline-block pb-9 pl-9">
      <span ref={ref} className="relative inline-block">
        <span className="text-outline">{text}</span>
        <motion.span
          aria-hidden
          className="absolute inset-0 text-ice"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={seen ? { clipPath: "inset(0 0% 0 0)" } : undefined}
          transition={{ duration: 1.1, delay: 1.0, ease: [0.7, 0, 0.2, 1] }}
        >
          {text}
        </motion.span>
      </span>
      {/* horizontal dimension */}
      <motion.span
        className="absolute bottom-2 left-9 right-0 flex items-center"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={seen ? { scaleX: 1, opacity: 1 } : undefined}
        style={{ transformOrigin: "left" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="h-3 w-px bg-holo" />
        <span className="h-px flex-1 bg-holo/60" />
        <span className="mx-2 font-mono text-[11px] tracking-[0.2em] text-holo">W {size.w}PX</span>
        <span className="h-px flex-1 bg-holo/60" />
        <span className="h-3 w-px bg-holo" />
      </motion.span>
      {/* vertical dimension */}
      <motion.span
        className="absolute bottom-9 left-2 top-0 flex flex-col items-center"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={seen ? { scaleY: 1, opacity: 1 } : undefined}
        style={{ transformOrigin: "bottom" }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="h-px w-3 bg-holo" />
        <span className="w-px flex-1 bg-holo/60" />
        <span className="my-1 font-mono text-[9px] tracking-widest text-holo [writing-mode:vertical-rl]">H {size.h}</span>
        <span className="w-px flex-1 bg-holo/60" />
        <span className="h-px w-3 bg-holo" />
      </motion.span>
    </span>
  );
}

function Prompt({ text, seen }: { text: string; seen: boolean }) {
  const cmd = "cat ./github.md";
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!seen) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (i >= cmd.length) {
        clearInterval(id);
        setTimeout(() => setDone(true), 260);
      }
    }, 55);
    return () => clearInterval(id);
  }, [seen]);
  return (
    <span className="block">
      <span className="mb-3 block font-mono text-[14px] normal-case tracking-normal">
        <span className="text-mint">srinivaas@batore</span>
        <span className="text-fog">:</span>
        <span className="text-holo">~</span>
        <span className="text-fog">$ </span>
        <span className="text-ice">{cmd.slice(0, n)}</span>
        {!done && <span className="animate-blink text-amber">▌</span>}
      </span>
      <motion.span
        className="block"
        initial={{ opacity: 0, y: 8 }}
        animate={done ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.4 }}
      >
        <span className="text-holo/50"># </span>
        {text}
        <span className="animate-blink text-amber">_</span>
      </motion.span>
    </span>
  );
}

function Progress({ text, seen }: { text: string; seen: boolean }) {
  const p = useMotionValue(0);
  const clip = useTransform(p, (v) => `inset(0 ${100 - v * 100}% 0 0)`);
  const left = useTransform(p, (v) => `${v * 100}%`);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const c = animate(p, [0, 0.18, 0.21, 0.52, 0.58, 0.9, 1], {
      duration: 2.8,
      times: [0, 0.2, 0.3, 0.55, 0.65, 0.88, 1],
      ease: "easeInOut",
    });
    const unsub = p.on("change", (v) => setPct(Math.round(v * 100)));
    return () => {
      c.stop();
      unsub();
    };
  }, [seen, p]);
  return (
    <span className="relative inline-block pb-7">
      <span className="text-ice/10">{text}</span>
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-holo via-ice to-amber bg-clip-text text-transparent"
        style={{ clipPath: clip }}
      >
        {text}
      </motion.span>
      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-holo/10">
        <motion.span className="absolute inset-y-0 left-0 bg-gradient-to-r from-holo to-amber" style={{ width: left }} />
      </span>
      <motion.span
        className="absolute -bottom-5 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] tracking-[0.2em] text-amber"
        style={{ left }}
      >
        {pct}%
      </motion.span>
    </span>
  );
}

function Declassify({ text, seen }: { text: string; seen: boolean }) {
  const words = text.split(" ");
  return (
    <span className="relative inline-block">
      {words.map((w, i) => (
        <span key={i} className="relative mr-[0.28em] inline-block">
          {w}
          <motion.span
            aria-hidden
            className="fx-redact"
            initial={{ scaleX: 1 }}
            animate={seen ? { scaleX: 0 } : undefined}
            transition={{ duration: 0.55, delay: 0.5 + i * 0.28, ease: [0.7, 0, 0.2, 1] }}
          />
        </span>
      ))}
      <motion.span
        className="absolute -top-6 right-0 font-mono text-[11px] tracking-[0.3em]"
        initial={{ color: "#ff4d6a" }}
        animate={seen ? { color: "#5dffb5" } : undefined}
        transition={{ delay: 0.6 + words.length * 0.28 }}
      >
        {seen ? "[ DECLASSIFIED ]" : "[ REDACTED ]"}
      </motion.span>
    </span>
  );
}

function Wave({ text, seen }: { text: string; seen: boolean }) {
  return (
    <span className="relative inline-block">
      <Words
        text={text}
        render={(ch, i) => {
          const a = 0.55;
          const s = Math.round(Math.sin(i * 0.9) * 1000) / 1000;
          return (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: `${s * a}em`, opacity: 0, scaleY: 0.3 }}
              animate={
                seen
                  ? { y: [`${s * a}em`, `${-s * a * 0.6}em`, `${s * a * 0.25}em`, "0em"], opacity: 1, scaleY: [0.3, 1.2, 0.95, 1] }
                  : undefined
              }
              transition={{ duration: 1.6, delay: i * 0.035, ease: "easeOut" }}
            >
              {ch}
            </motion.span>
          );
        }}
      />
    </span>
  );
}

function Scan({ text, seen }: { text: string; seen: boolean }) {
  const p = useMotionValue(0);
  const clip = useTransform(p, (v) => `inset(0 0 ${100 - v * 100}% 0)`);
  const top = useTransform(p, (v) => `${v * 100}%`);
  const barOpacity = useTransform(p, [0, 0.02, 0.96, 1], [0, 1, 1, 0]);
  useEffect(() => {
    if (!seen) return;
    const c = animate(p, 1, { duration: 1.6, ease: [0.45, 0, 0.2, 1] });
    return () => c.stop();
  }, [seen, p]);
  return (
    <span className="relative inline-block">
      <span className="invisible">{text}</span>
      <motion.span aria-hidden className="absolute inset-0" style={{ clipPath: clip }}>
        {text}
      </motion.span>
      <motion.span aria-hidden className="fx-scanbar" style={{ top, opacity: barOpacity }} />
    </span>
  );
}

function Lock({ text, seen }: { text: string; seen: boolean }) {
  const [jit, setJit] = useState(true);
  const [off, setOff] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const id = setInterval(() => setOff((Math.random() - 0.5) * 14), 50);
    const t = setTimeout(() => {
      clearInterval(id);
      setOff(0);
      setJit(false);
    }, 1300);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [seen]);
  return (
    <span className="relative inline-block px-4 py-2">
      <motion.span
        aria-hidden
        className="brackets brackets-amber absolute"
        initial={{ top: -36, right: -36, bottom: -36, left: -36 }}
        animate={
          seen
            ? jit
              ? { top: -22, right: -22, bottom: -22, left: -22 }
              : { top: 0, right: 0, bottom: 0, left: 0 }
            : undefined
        }
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="relative inline-block">
        <span aria-hidden className="absolute inset-0 text-alert/70" style={{ transform: `translateX(${off}px)`, opacity: jit ? 1 : 0 }}>
          {text}
        </span>
        <span aria-hidden className="absolute inset-0 text-holo/70" style={{ transform: `translateX(${-off}px)`, opacity: jit ? 1 : 0 }}>
          {text}
        </span>
        <span className="relative" style={{ opacity: seen ? 1 : 0 }}>
          {text}
        </span>
      </span>
      <motion.span
        className="absolute -top-7 right-0 whitespace-nowrap font-mono text-[11px] tracking-[0.3em] text-amber"
        initial={{ opacity: 0 }}
        animate={!jit ? { opacity: 1 } : undefined}
      >
        ◉ SIGNAL LOCKED
      </motion.span>
    </span>
  );
}

function Crt({ text, seen }: { text: string; seen: boolean }) {
  return (
    <motion.span
      className="inline-block"
      initial={{ scaleX: 0, scaleY: 0.02, opacity: 0, filter: "brightness(4)" }}
      animate={seen ? { scaleX: [0, 1, 1], scaleY: [0.02, 0.02, 1], opacity: 1, filter: ["brightness(4)", "brightness(3)", "brightness(1)"] } : undefined}
      transition={{ duration: 0.9, times: [0, 0.45, 1], ease: "easeOut" }}
    >
      {text}
    </motion.span>
  );
}

const EFFECTS: Record<TitleEffect, (p: { text: string; seen: boolean }) => ReactNode> = {
  decode: Decode,
  assemble: Assemble,
  type: TypeOn,
  flicker: Flicker,
  diff: Diff,
  fire: Fire,
  odometer: Odometer,
  stamp: Stamp,
  blueprint: Blueprint,
  prompt: Prompt,
  progress: Progress,
  declassify: Declassify,
  wave: Wave,
  scan: Scan,
  lock: Lock,
  crt: Crt,
};

export function SectionTitle({
  id,
  title,
  wordplay,
  effect,
  align = "left",
  className = "",
}: {
  id: SectionId;
  title: string;
  wordplay: string;
  effect: TitleEffect;
  align?: "left" | "center";
  className?: string;
}) {
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -12% 0px");
  const reduced = usePrefersReducedMotion();
  const Effect = EFFECTS[effect];
  const code = sectionMeta(id).code;
  return (
    <div ref={ref} className={`relative ${align === "center" ? "text-center" : ""} ${className}`}>
      <motion.div
        className={`mb-6 flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}
        initial={{ opacity: 0, x: -12 }}
        animate={seen ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.6 }}
      >
        <span className="font-mono text-[12px] tracking-[0.2em] text-amber">{code}</span>
        <motion.span
          className="h-px w-12 origin-left bg-gradient-to-r from-amber to-holo/40"
          initial={{ scaleX: 0 }}
          animate={seen ? { scaleX: 1 } : undefined}
          transition={{ duration: 0.7, delay: 0.1 }}
        />
        <span className="font-mono text-[12px] tracking-[0.14em] text-holo-soft/80">{wordplay}</span>
      </motion.div>
      <h2 className={titleClass} aria-label={title}>
        <span aria-hidden>{reduced ? title : <Effect text={title} seen={seen} />}</span>
      </h2>
    </div>
  );
}
