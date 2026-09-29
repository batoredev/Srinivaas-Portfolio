"use client";

import { motion } from "motion/react";
import { commits, experience, type Commit } from "@/data/content";
import { shortSha } from "@/lib/random";
import { SectionTitle } from "../ui/SectionTitle";

const LANE_X = [14, 38, 62];
const LANE_COLOR = ["#4fe3ff", "#ffb547", "#5dffb5"];
const LANE_NAME = ["main", "pss", "cue-court"];

const KIND_STYLE: Record<Commit["kind"], string> = {
  init: "text-ice border-ice/40",
  feat: "text-holo border-holo/40",
  fix: "text-alert border-alert/40",
  chore: "text-fog border-fog/40",
  refactor: "text-holo-soft border-holo-soft/40",
  merge: "text-mint border-mint/40",
  wip: "text-amber border-amber/50",
};

// alive ranges for side lanes: [first row, merge row]
const ranges: Record<number, [number, number]> = {};
for (const L of [1, 2]) {
  const start = commits.findIndex((c) => c.lane === L);
  const end = commits.findIndex((c) => c.kind === "merge" && c.mergeFrom === L);
  ranges[L] = [start, end];
}

function rowPaths(i: number) {
  const c = commits[i];
  const n = commits.length;
  const paths: { d: string; color: string }[] = [];
  const x0 = LANE_X[0];
  // main line
  if (i > 0) paths.push({ d: `M${x0},0 L${x0},50`, color: LANE_COLOR[0] });
  if (i < n - 1) paths.push({ d: `M${x0},50 L${x0},100`, color: LANE_COLOR[0] });
  for (const L of [1, 2]) {
    const [start, end] = ranges[L];
    const xl = LANE_X[L];
    if (i === start) {
      paths.push({ d: `M${x0},0 C${x0},30 ${xl},20 ${xl},50`, color: LANE_COLOR[L] });
      paths.push({ d: `M${xl},50 L${xl},100`, color: LANE_COLOR[L] });
    } else if (i > start && i < end) {
      paths.push({ d: `M${xl},0 L${xl},100`, color: LANE_COLOR[L] });
    } else if (i === end && c.mergeFrom === L) {
      paths.push({ d: `M${xl},0 C${xl},30 ${x0},20 ${x0},50`, color: LANE_COLOR[L] });
    }
  }
  return paths;
}

function CommitRow({ c, i }: { c: Commit; i: number }) {
  const sha = shortSha(`${c.scope ?? ""}${c.message}`);
  return (
    <motion.li
      className="relative grid grid-cols-[76px_1fr] gap-2"
      initial="off"
      whileInView="on"
      viewport={{ once: true, margin: "0px 0px -18% 0px" }}
    >
      <div className="relative">
        <svg viewBox="0 0 76 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          {rowPaths(i).map((p, k) => (
            <motion.path
              key={k}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              style={{ filter: `drop-shadow(0 0 4px ${p.color})` }}
              variants={{ off: { pathLength: 0, opacity: 0.2 }, on: { pathLength: 1, opacity: 0.9 } }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          ))}
        </svg>
        <motion.span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-void"
          style={{ left: `${(LANE_X[c.lane] / 76) * 100}%`, borderColor: LANE_COLOR[c.lane], boxShadow: `0 0 14px ${LANE_COLOR[c.lane]}` }}
          variants={{ off: { scale: 0 }, on: { scale: 1 } }}
          transition={{ delay: 0.35, type: "spring", stiffness: 500, damping: 20 }}
        >
          {c.kind === "wip" && <span className="absolute inset-0.5 rounded-full bg-amber animate-pulse-dot" />}
          {c.kind === "merge" && <span className="absolute inset-[3px] rounded-full bg-mint" />}
        </motion.span>
      </div>

      <motion.div
        className="py-5 pr-2"
        variants={{ off: { opacity: 0, x: 24 }, on: { opacity: 1, x: 0 } }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-mono text-[12px] text-amber">{sha}</span>
          <span className={`border px-1.5 py-px font-mono text-[10.5px] uppercase ${KIND_STYLE[c.kind]}`}>{c.kind}</span>
          {c.scope && <span className="font-mono text-[12px] text-holo-soft/70">({c.scope})</span>}
          {c.tag && (
            <span className="bg-amber/15 px-2 py-px font-mono text-[10.5px] text-amber">
              {c.tag === "HEAD" ? "HEAD → main" : `tag: ${c.tag}`}
            </span>
          )}
        </div>
        <p className="mt-1.5 font-display text-[18px] font-medium leading-snug text-ice sm:text-[19px]">{c.message}</p>
        <p className="mt-1 text-[13.5px] text-fog">{c.detail}</p>
      </motion.div>
    </motion.li>
  );
}

export function Experience() {
  return (
    <section id="experience" data-section="experience" className="section">
      <div className="container-hud">
        <SectionTitle id="experience" title="Experience" wordplay="Commit history. No force-pushes." effect="diff" />

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-5 lg:col-span-5">
            {experience.map((job, i) => (
              <motion.article
                key={job.org}
                className="panel p-6 sm:p-7"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-ice">{job.org}</h3>
                    <p className="mt-1 text-[14px] text-holo-soft">{job.title}</p>
                  </div>
                  <span className={`shrink-0 border px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.15em] ${job.period === "Present" ? "border-mint/50 text-mint" : "border-holo/30 text-holo-soft"}`}>
                    {job.period}
                  </span>
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-ice/70">{job.summary}</p>
                <ul className="mt-4 space-y-2.5">
                  {job.points.map((pt) => (
                    <li key={pt} className="flex gap-3 text-[13.5px] leading-relaxed text-ice/80">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-amber" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>

          <div className="lg:col-span-7">
            <div className="panel p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-holo/10 pb-4">
                <code className="font-mono text-[12.5px] text-ice/85">
                  <span className="text-mint">$</span> git log --graph --oneline career
                </code>
                <div className="flex gap-4">
                  {LANE_NAME.map((n, i) => (
                    <span key={n} className="flex items-center gap-1.5 font-mono text-[10.5px] text-fog">
                      <span className="h-2 w-2 rounded-full" style={{ background: LANE_COLOR[i] }} />
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <ol className="mt-2">
                {commits.map((c, i) => (
                  <CommitRow key={i} c={c} i={i} />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
