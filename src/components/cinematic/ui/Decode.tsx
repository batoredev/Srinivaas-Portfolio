"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { Fragment, useState } from "react";

/*
 * Token decode: text resolves out of noise as you scroll, left to right, and
 * dissolves back into it on the way out. Tied to scroll, so it runs backwards
 * when the visitor scrolls back.
 */

const GLYPHS = "01<>/{}[]#*+=~ΔΣλΞ";
const BAND = 5;

function glyphFor(i: number, salt: number) {
  const h = Math.abs(Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453) % 1;
  return GLYPHS[Math.floor(h * GLYPHS.length)];
}

/** 0 hidden · 1 noise glyph · 2 resolved */
function charState(i: number, len: number, inP: number, outP: number) {
  const resolved = inP * (len + BAND) - BAND;
  const vanished = outP * (len + BAND);
  if (i < vanished - BAND) return 0;
  if (i < vanished) return 1;
  if (i < resolved) return 2;
  if (i < resolved + BAND) return 1;
  return 0;
}

export function Decoded({
  text,
  inP,
  outP = 0,
  className,
  glyphClassName = "text-holo/70",
}: {
  text: string;
  inP: number;
  outP?: number;
  className?: string;
  glyphClassName?: string;
}) {
  const words = text.split(" ");
  const salt = Math.floor(inP * 40) + Math.floor(outP * 40) * 7;
  let idx = 0;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, wi) => {
          const chars = [...w].map((c) => {
            const i = idx++;
            const st = charState(i, text.length, inP, outP);
            return (
              <span key={i} className="relative inline-block">
                <span className="invisible">{c}</span>
                {st !== 0 && <span className={`absolute inset-0 text-center ${st === 1 ? glyphClassName : ""}`}>{st === 2 ? c : glyphFor(i, salt)}</span>}
              </span>
            );
          });
          idx++; // the space
          return (
            <Fragment key={wi}>
              <span className="inline-block whitespace-nowrap">{chars}</span>
              {wi < words.length - 1 ? " " : null}
            </Fragment>
          );
        })}
      </span>
    </span>
  );
}

/** A motion value as React state, quantised so text re-renders only when it changes. */
export function useProgress(mv: MotionValue<number>, steps = 240) {
  const [p, setP] = useState(() => Math.round(mv.get() * steps) / steps);
  useMotionValueEvent(mv, "change", (v) => {
    const q = Math.round(Math.min(1, Math.max(0, v)) * steps) / steps;
    setP((prev) => (prev === q ? prev : q));
  });
  return p;
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
