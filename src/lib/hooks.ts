"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Matches a media query; false during SSR. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMedia("(min-width: 1024px)");
export const useFinePointer = () => useMedia("(pointer: fine)");
export const usePrefersReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");

/** True once the element has come within `margin` of the viewport. */
export function useSeen<T extends Element>(margin = "0px 0px -15% 0px", once = true) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          if (once) io.disconnect();
        } else if (!once) setSeen(false);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, once]);
  return [ref, seen] as const;
}

/** Live clock string for a time zone, updated every second. */
export function useClock(timeZone: string) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return "--:--:--";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

export { mulberry32, hashString, shortSha } from "./random";
