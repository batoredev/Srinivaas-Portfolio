"use client";

import { useEffect, useRef } from "react";
import { hudAudio } from "@/lib/audio";

const INTERACTIVE = "a, button, [data-lock], input, textarea, select, label[for]";

/**
 * Targeting reticle. Follows the pointer with a lag; when it passes over an
 * interactive element, four brackets snap to the element's bounds and a
 * readout names the target ("lock-on").
 */
export function Reticle() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const coords = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-reticle");

    const m = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = { x: m.x, y: m.y };
    const f = { x: m.x - 18, y: m.y - 18, w: 36, h: 36 };
    let target: Element | null = null;
    let visible = false;
    let raf = 0;
    let down = false;

    const onMove = (e: PointerEvent) => {
      m.x = e.clientX;
      m.y = e.clientY;
      if (!visible) {
        visible = true;
        [dot, ring, frame].forEach((el) => el.current && (el.current.style.opacity = "1"));
      }
      const t = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
      if (t !== target) {
        target = t;
        if (t) {
          hudAudio.lock();
          const name =
            t.getAttribute("data-lock") ||
            t.getAttribute("aria-label") ||
            (t as HTMLElement).innerText?.trim().split("\n")[0] ||
            (t as HTMLInputElement).placeholder ||
            "target";
          if (label.current) label.current.textContent = `LOCK ▸ ${name.slice(0, 32).toUpperCase()}`;
          frame.current?.classList.add("locked");
        } else {
          frame.current?.classList.remove("locked");
        }
      }
    };
    const onLeave = () => {
      visible = false;
      [dot, ring, frame].forEach((el) => el.current && (el.current.style.opacity = "0"));
    };
    const onDown = () => {
      down = true;
    };
    const onUp = () => {
      down = false;
    };

    const loop = () => {
      r.x += (m.x - r.x) * 0.22;
      r.y += (m.y - r.y) * 0.22;
      let tx = r.x - 18, ty = r.y - 18, tw = 36, th = 36;
      if (target && target.isConnected) {
        const b = target.getBoundingClientRect();
        const pad = 7;
        tx = b.left - pad;
        ty = b.top - pad;
        tw = b.width + pad * 2;
        th = b.height + pad * 2;
      } else if (target) {
        target = null;
        frame.current?.classList.remove("locked");
      }
      const k = target ? 0.3 : 0.25;
      f.x += (tx - f.x) * k;
      f.y += (ty - f.y) * k;
      f.w += (tw - f.w) * k;
      f.h += (th - f.h) * k;
      if (dot.current) dot.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) scale(${down ? 0.6 : 1})`;
      if (ring.current) ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0) scale(${target ? 0 : down ? 0.7 : 1})`;
      if (frame.current) {
        frame.current.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
        frame.current.style.width = `${f.w}px`;
        frame.current.style.height = `${f.h}px`;
      }
      if (coords.current)
        coords.current.textContent = `X${String(Math.round(m.x)).padStart(4, "0")} Y${String(Math.round(m.y)).padStart(4, "0")}`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-reticle");
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] hidden [@media(pointer:fine)]:block">
      <div ref={dot} className="absolute left-0 top-0 -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-amber opacity-0 shadow-[0_0_10px_#ffb547]" />
      <div ref={ring} className="absolute left-0 top-0 -ml-[15px] -mt-[15px] h-[30px] w-[30px] opacity-0 transition-[scale] duration-200">
        <svg viewBox="0 0 30 30" className="h-full w-full animate-spin-slow">
          <circle cx="15" cy="15" r="13" fill="none" stroke="rgba(79,227,255,.7)" strokeWidth="1" strokeDasharray="6 4.2" />
        </svg>
      </div>
      <div ref={frame} className="reticle-frame absolute left-0 top-0 opacity-0">
        <span className="brackets absolute inset-0" />
        <span ref={label} className="reticle-label absolute -top-5 left-0 whitespace-nowrap font-mono text-[9.5px] tracking-[0.2em] text-amber" />
        <span ref={coords} className="reticle-coords absolute -bottom-4 right-0 whitespace-nowrap font-mono text-[9px] tracking-[0.15em] text-holo/60" />
      </div>
      <style>{`
        .reticle-frame .brackets{ --bc: rgba(79,227,255,.55); --bl: 7px; transition: --bc .2s; }
        .reticle-frame .reticle-label{ opacity:0; transform: translateY(4px); transition: opacity .2s, transform .2s; }
        .reticle-frame .reticle-coords{ opacity:.9; transition: opacity .2s; }
        .reticle-frame.locked .brackets{ --bc: rgba(255,181,71,.95); --bl: 10px; }
        .reticle-frame.locked .reticle-label{ opacity:1; transform:none; }
        .reticle-frame.locked .reticle-coords{ opacity:0; }
      `}</style>
    </div>
  );
}
