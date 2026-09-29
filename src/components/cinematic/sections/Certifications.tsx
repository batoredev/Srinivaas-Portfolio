"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { certifications } from "@/data/content";
import { useSeen } from "@/lib/hooks";
import { shortSha } from "@/lib/random";
import { SectionTitle } from "../ui/SectionTitle";

const HEX = "0123456789abcdef";

/** A checksum that resolves character by character, then locks green. */
function Checksum({ seed, active }: { seed: string; active: boolean }) {
  const target = `${shortSha(seed)}${shortSha(seed + "·")}`.slice(0, 12);
  const [out, setOut] = useState("············");
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(
        target
          .split("")
          .map((c, k) => (k < i / 3 ? c : HEX[(Math.random() * 16) | 0]))
          .join(""),
      );
      if (i / 3 >= target.length) {
        clearInterval(id);
        setOk(true);
      }
    }, 30);
    return () => clearInterval(id);
  }, [active, target]);
  return (
    <span className="font-mono text-[11px]">
      <span className="text-fog">sha · </span>
      <span className={ok ? "text-mint" : "text-holo"}>{out}</span>
      {ok && <span className="ml-2 text-mint">✓</span>}
    </span>
  );
}

function Seal() {
  const teeth = 24;
  const d = Array.from({ length: teeth * 2 }, (_, i) => {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 30 : 26;
    return `${i === 0 ? "M" : "L"}${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
  }).join("") + "Z";
  return (
    <svg viewBox="-34 -34 68 68" className="h-16 w-16">
      <g className="animate-spin-slower" style={{ transformOrigin: "0px 0px" }}>
        <path d={d} fill="rgba(255,181,71,0.12)" stroke="#ffb547" strokeWidth="1" />
      </g>
      <circle r="19" fill="none" stroke="rgba(226,251,255,0.5)" strokeDasharray="2 3" />
      <text y="4" textAnchor="middle" fontSize="11" fontFamily="var(--font-chakra)" fontWeight="700" fill="#ffb547">
        SV
      </text>
    </svg>
  );
}

function FoilCard({ c, i }: { c: (typeof certifications)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seenRef, seen] = useSeen<HTMLDivElement>("0px 0px -15% 0px");

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current!;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 20}deg`);
    el.style.setProperty("--foil", "0.75");
  };
  const onLeave = () => {
    const el = ref.current!;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--foil", "0.28");
  };

  return (
    <motion.div
      ref={seenRef}
      initial={{ opacity: 0, y: 50, rotateX: -30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <div ref={ref} className="foil-card relative" onPointerMove={onMove} onPointerLeave={onLeave} data-lock={c.name}>
        <div className="relative z-[1] flex h-full flex-col p-6">
          <div className="flex items-start justify-between">
            <Seal />
            {c.sample && <span className="sample-tag">Sample · replace</span>}
          </div>
          <div className="mt-6 hud-label">{c.issuer}</div>
          <h3 className="mt-2 font-display text-[22px] font-semibold uppercase leading-tight tracking-wide text-ice">{c.name}</h3>
          <div className="mt-auto pt-8">
            <div className="flex items-center justify-between border-t border-holo/15 pt-4">
              <Checksum seed={c.name} active={seen} />
              <span className="font-mono text-[11px] text-fog">{c.year}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Certifications() {
  return (
    <section id="certifications" data-section="certifications" className="section">
      <div className="container-hud">
        <SectionTitle id="certifications" title="Certifications" wordplay="Signed, sealed, verified." effect="stamp" />
        <p className="mt-6 max-w-[640px] text-[16px] leading-relaxed text-ice/70">
          Credentials, verified by checksum. Tilt a card to catch the foil.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {certifications.map((c, i) => (
            <FoilCard key={c.name} c={c} i={i} />
          ))}
        </div>
      </div>
      <style>{`
        .foil-card {
          --mx: 50%; --my: 50%; --rx: 0deg; --ry: 0deg; --foil: 0.28;
          min-height: 300px;
          border: 1px solid rgba(79,227,255,.22);
          background: linear-gradient(160deg, rgba(10,28,42,.9), rgba(4,10,18,.95));
          transform: rotateX(var(--rx)) rotateY(var(--ry));
          transform-style: preserve-3d;
          transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s;
          overflow: hidden;
        }
        .foil-card:hover { box-shadow: 0 30px 80px -30px rgba(79,227,255,.45); }
        .foil-card::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background:
            repeating-linear-gradient(115deg, rgba(79,227,255,0) 0 6%, rgba(79,227,255,.3) 11%, rgba(226,251,255,.35) 16%, rgba(255,181,71,.28) 22%, rgba(79,227,255,0) 30%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 2px, transparent 2px 4px);
          background-size: 300% 300%, auto;
          background-position: var(--mx) var(--my), 0 0;
          mix-blend-mode: color-dodge;
          opacity: var(--foil);
          transition: opacity .35s;
        }
        .foil-card::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.22), transparent 45%);
          mix-blend-mode: overlay;
        }
      `}</style>
    </section>
  );
}
