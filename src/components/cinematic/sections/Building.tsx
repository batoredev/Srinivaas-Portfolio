"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { currentlyBuilding, type Building as B } from "@/data/content";
import { hashString } from "@/lib/random";
import { useSeen } from "@/lib/hooks";
import { SectionTitle } from "../ui/SectionTitle";

/** Streams log lines character by character, then loops. */
function useLogStream(lines: string[], active: boolean) {
  const [shown, setShown] = useState<string[]>([]);
  useEffect(() => {
    if (!active) return;
    let line = 0;
    let ch = 0;
    let cur: string[] = [];
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (line >= lines.length) {
        timer = setTimeout(() => {
          line = 0;
          ch = 0;
          cur = [];
          setShown([]);
          timer = setTimeout(step, 400);
        }, 3200);
        return;
      }
      ch += 2;
      const text = lines[line].slice(0, ch);
      cur = [...cur.slice(0, line), text];
      setShown(cur);
      if (ch >= lines[line].length) {
        line++;
        ch = 0;
        timer = setTimeout(step, 260 + Math.random() * 380);
      } else timer = setTimeout(step, 16);
    };
    timer = setTimeout(step, 300);
    return () => clearTimeout(timer);
  }, [lines, active]);
  return shown;
}

function ProcessWindow({ item, index, wide }: { item: B; index: number; wide: boolean }) {
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -10% 0px", false);
  const log = useLogStream(item.log, seen);
  const pid = 1000 + (hashString(item.name) % 8999);
  const tiltY = wide ? 0 : index % 2 === 0 ? 7 : -7;
  const statusColor = item.status === "Experimental" ? "bg-amber" : "bg-mint";

  return (
    <motion.div
      ref={ref}
      className={`group min-w-0 [perspective:1400px] ${wide ? "lg:col-span-2" : ""}`}
      initial={{ opacity: 0, y: 60, rotateX: 18 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, delay: (index % 2) * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="panel flex h-full flex-col transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:[transform:rotateY(0deg)_rotateX(0deg)_translateZ(20px)] max-lg:![transform:none]"
        style={{ transform: `rotateY(${tiltY}deg) rotateX(4deg)` }}
      >
        {/* title bar */}
        <div className="flex items-center justify-between border-b border-holo/15 px-5 py-3">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-holo/50">PID {pid}</span>
            <span className="text-ice/90">{item.name.toLowerCase().replace(/\s+/g, "-")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor} animate-pulse-dot`} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ice/70">{item.status}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-ice">{item.name}</h3>
          {item.name === "Bites by Batore" && (
            <p className="mt-1 font-mono text-[11px] text-amber">bites ≈ bytes · hyperlocal, human-reviewed</p>
          )}
          <p className="mt-3 text-[14.5px] leading-relaxed text-ice/75">{item.summary}</p>

          <div className="mt-5 min-h-[138px] flex-1 border border-holo/10 bg-black/40 p-4 font-mono text-[11.5px] leading-[1.7]">
            {log.map((l, i) => (
              <div key={i} className="truncate">
                <span className="text-holo/40">$ </span>
                <span className={l.includes("disabled") || l.includes("not yet") ? "text-amber" : "text-mint/85"}>{l}</span>
                {i === log.length - 1 && <span className="animate-blink text-amber">▌</span>}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {item.stack.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-holo/60">
              <span>BUILD</span>
              <span>{item.status === "Experimental" ? "EVALUATING" : "IN PROGRESS"}</span>
            </div>
            <div className="relative mt-2 h-[3px] overflow-hidden bg-holo/10">
              <div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber to-transparent"
                style={{ animation: `sweep-x ${2.2 + index * 0.35}s ease-in-out infinite` }}
              />
            </div>
          </div>
          {item.note && <p className="mt-4 text-[12.5px] italic text-fog">{item.note}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function Building() {
  return (
    <section id="building" data-section="building" className="section">
      <div className="container-hud">
        <SectionTitle id="building" title="Currently Building" wordplay="Work in progress." effect="type" />
        <p className="mt-6 max-w-[620px] text-[16px] leading-relaxed text-ice/70">
          Three processes are running right now: an infrastructure migration and two tools for AI-assisted engineering.
        </p>
        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {currentlyBuilding.map((b, i) => (
            <ProcessWindow key={b.name} item={b} index={i} wide={currentlyBuilding.length % 2 === 1 && i === currentlyBuilding.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
