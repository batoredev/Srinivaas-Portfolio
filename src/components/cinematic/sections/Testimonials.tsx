"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { testimonials } from "@/data/content";
import { hudAudio } from "@/lib/audio";
import { useSeen } from "@/lib/hooks";
import { SectionTitle } from "../ui/SectionTitle";

function Voiceprint({ speaking }: { speaking: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const level = useRef(0);
  const speakingRef = useRef(speaking);
  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
    io.observe(cv);
    const BARS = 96;
    function draw(ms: number) {
      raf = 0;
      if (!visible) return;
      const t = ms / 1000;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const size = cv.clientWidth;
      if (cv.width !== size * dpr) {
        cv.width = size * dpr;
        cv.height = size * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      level.current += ((speakingRef.current ? 1 : 0.12) - level.current) * 0.06;
      const c = size / 2;
      const R = size * 0.27;
      // core
      const g = ctx.createRadialGradient(c, c, 0, c, c, R);
      g.addColorStop(0, `rgba(255,181,71,${0.3 + level.current * 0.35})`);
      g.addColorStop(0.6, "rgba(255,122,26,0.08)");
      g.addColorStop(1, "rgba(255,122,26,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.fill();
      // bars
      for (let i = 0; i < BARS; i++) {
        const a = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        const n =
          Math.abs(Math.sin(t * 6 + i * 0.35)) * 0.5 +
          Math.abs(Math.sin(t * 9.3 + i * 0.9)) * 0.3 +
          Math.abs(Math.sin(t * 2.1 + i * 0.13)) * 0.2;
        const len = 4 + n * size * 0.16 * level.current;
        const x0 = c + Math.cos(a) * (R + 6), y0 = c + Math.sin(a) * (R + 6);
        const x1 = c + Math.cos(a) * (R + 6 + len), y1 = c + Math.sin(a) * (R + 6 + len);
        ctx.strokeStyle = i % 8 === 0 ? "rgba(255,181,71,0.95)" : `rgba(79,227,255,${0.35 + n * 0.6})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      // rings
      ctx.strokeStyle = "rgba(79,227,255,0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(c, c, size * 0.46, t * 0.2, t * 0.2 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(c, c, R - 10, 0, Math.PI * 2);
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    }
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvas} className="aspect-square w-full" aria-hidden />;
}

export function Testimonials() {
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -20% 0px", false);
  const t = testimonials[idx];
  const words = t.quote.split(" ");
  const speaking = seen && count < words.length;

  // stream the transcript word by word, then advance
  useEffect(() => {
    if (!seen) return;
    if (count < words.length) {
      const id = setTimeout(() => setCount((c) => c + 1), 85 + Math.random() * 90);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setIdx((i) => (i + 1) % testimonials.length);
      setCount(0);
    }, 4200);
    return () => clearTimeout(id);
  }, [seen, count, words.length]);

  const go = (i: number) => {
    hudAudio.tick();
    setIdx((i + testimonials.length) % testimonials.length);
    setCount(0);
  };

  return (
    <section id="testimonials" data-section="testimonials" className="section">
      <div className="container-hud">
        <SectionTitle id="testimonials" title="Testimonials" wordplay="Signal, not noise." effect="wave" />

        <div ref={ref} className="mt-14 grid items-center gap-10 lg:grid-cols-12">
          <div className="relative mx-auto w-full max-w-[420px] lg:col-span-5">
            <Voiceprint speaking={speaking} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] tracking-[0.3em] text-amber">{speaking ? "RECEIVING" : "IDLE"}</span>
              <span className="mt-1 font-display text-lg font-semibold uppercase tracking-widest text-ice">
                CH-{String(idx + 1).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="hud-label">Incoming transmission</span>
              {t.sample && <span className="sample-tag">Sample · replace with real quotes</span>}
            </div>
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 0.4 }}
                className="mt-5 min-h-[180px] font-display text-[clamp(22px,2.5vw,32px)] font-medium leading-snug text-ice"
              >
                <span className="text-amber">“</span>
                {words.map((w, i) => (
                  <span
                    key={i}
                    className="transition-[opacity,filter] duration-300"
                    style={{
                      opacity: i < count ? 1 : 0.06,
                      filter: i < count ? "none" : "blur(4px)",
                      textDecoration: i === count - 1 && speaking ? "underline dotted rgba(255,181,71,0.8)" : "none",
                      textUnderlineOffset: 6,
                    }}
                  >
                    {w}{" "}
                  </span>
                ))}
                <span className="text-amber" style={{ opacity: count >= words.length ? 1 : 0.1 }}>
                  ”
                </span>
              </motion.blockquote>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-holo/10 pt-6">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center border border-holo/40 font-display font-bold text-holo">
                  {t.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-mint">● VOICEPRINT MATCHED</div>
                  <div className="font-display text-[17px] font-semibold text-ice">{t.name}</div>
                  <div className="text-[13px] text-fog">{t.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => go(idx - 1)} className="btn-ghost !px-4 !py-2" aria-label="Previous testimonial" data-lock="Previous">
                  ◀
                </button>
                <div className="flex gap-1.5">
                  {testimonials.map((_, i) => (
                    <span key={i} className={`h-1 transition-all ${i === idx ? "w-6 bg-amber" : "w-2 bg-holo/30"}`} />
                  ))}
                </div>
                <button type="button" onClick={() => go(idx + 1)} className="btn-ghost !px-4 !py-2" aria-label="Next testimonial" data-lock="Next">
                  ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
