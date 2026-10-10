"use client";

import { useEffect, useRef, useState } from "react";
import { profile, sections } from "@/data/content";
import { useClock } from "@/lib/hooks";
import { setStore, useStore } from "@/lib/store";
import { scrollToSection } from "../scroll";
import { SectionTitle } from "../ui/SectionTitle";

function useUptime() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setS(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Wordmark() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="relative select-none"
      onPointerMove={(e) => {
        const b = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--fx", `${e.clientX - b.left}px`);
        ref.current!.style.setProperty("--fy", `${e.clientY - b.top}px`);
        ref.current!.style.setProperty("--fr", "220px");
      }}
      onPointerLeave={() => ref.current!.style.setProperty("--fr", "0px")}
      data-lock={profile.name}
      aria-hidden
    >
      <div className="text-outline whitespace-nowrap font-display text-[clamp(44px,11.5vw,188px)] font-bold uppercase leading-[0.9] tracking-[-0.02em] opacity-50">
        {profile.firstName}
      </div>
      <div className="text-outline whitespace-nowrap font-display text-[clamp(44px,11.5vw,188px)] font-bold uppercase leading-[0.9] tracking-[-0.02em] opacity-50">
        {profile.lastName}
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber via-ice to-holo bg-clip-text text-transparent"
        style={{
          maskImage: "radial-gradient(circle var(--fr, 0px) at var(--fx, 50%) var(--fy, 50%), #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(circle var(--fr, 0px) at var(--fx, 50%) var(--fy, 50%), #000 30%, transparent 100%)",
        }}
      >
        <div className="whitespace-nowrap font-display text-[clamp(44px,11.5vw,188px)] font-bold uppercase leading-[0.9] tracking-[-0.02em]">{profile.firstName}</div>
        <div className="whitespace-nowrap font-display text-[clamp(44px,11.5vw,188px)] font-bold uppercase leading-[0.9] tracking-[-0.02em]">{profile.lastName}</div>
      </div>
    </div>
  );
}

export function Footer() {
  const uptime = useUptime();
  const clock = useClock(profile.timezone);
  const synapses = useStore((s) => s.synapses);
  const visited = useStore((s) => s.visited);
  const total = sections.length;

  const stats: [string, string][] = [
    ["Session uptime", uptime],
    ["Synapses fired", synapses.toLocaleString("en-IN")],
    ["Chapters completed", `${Math.max(0, Math.min(visited - 1, total - 1))}/${total - 1}`],
    ["Coimbatore", `${clock} IST`],
  ];

  return (
    <footer id="footer" data-section="footer" className="relative z-[2] overflow-hidden border-t border-holo/10 pb-10 pt-24">
      <div className="container-hud">
        <SectionTitle id="footer" title="End of line." wordplay="Shutting down gracefully." effect="crt" />

        <div className="mt-12 grid grid-cols-2 gap-6 border-y border-holo/10 py-6 md:grid-cols-4">
          {stats.map(([k, v]) => (
            <div key={k}>
              <div className="hud-label">{k}</div>
              <div className="mt-1 font-display text-2xl font-semibold text-ice">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <Wordmark />
        </div>

        <div className="mt-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <nav className="flex flex-wrap gap-x-7 gap-y-3 font-mono text-[12px] tracking-[0.15em]">
            <button type="button" onClick={() => scrollToSection("hero")} className="text-ice/80 hover:text-amber" data-lock="Replay the story">
              ↺ REPLAY THE STORY
            </button>
            <button type="button" onClick={() => setStore({ handoff: true })} className="text-amber hover:text-ice" data-lock="Professional mode">
              PROFESSIONAL MODE ↗
            </button>
            <a href={`mailto:${profile.email}`} className="text-ice/80 hover:text-amber">
              EMAIL
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-ice/80 hover:text-amber">
              LINKEDIN
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer" className="text-ice/80 hover:text-amber">
              GITHUB
            </a>
          </nav>
          <div className="text-right font-mono text-[11px] leading-relaxed text-fog">
            <div>
              © {new Date().getFullYear()} {profile.name} · {profile.studio}, {profile.city}
            </div>
            <div>Built with Next.js, three.js, GLSL and a lot of chai.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
