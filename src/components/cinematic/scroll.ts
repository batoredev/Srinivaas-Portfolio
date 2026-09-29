"use client";

import type Lenis from "lenis";

let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

/** Scroll to a section without touching the URL hash (keeps history clean). */
export function scrollToSection(id: string) {
  // land on the chapter card when a section has one, so the narrator speaks first
  const el = document.getElementById(`chapter-${id}`) ?? document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: "smooth" });
}
