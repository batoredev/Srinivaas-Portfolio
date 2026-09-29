"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { writing } from "@/data/content";
import { hashString } from "@/lib/random";
import { SectionTitle } from "../ui/SectionTitle";

const STOP = new Set(
  "a an the of and or to in on at by for with from is are was be it its this that how why what so as into onto every each still has have had can not no".split(" "),
);

type Arc = { from: number; to: number; w: number; d: string };

/** Pseudo self-attention: keyword affinity + shared stems + locality. */
function attention(words: string[], i: number, keywords: Set<string>) {
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const wi = norm(words[i]);
  const scores = words.map((w, j) => {
    const wj = norm(w);
    if (j === i || !wj || STOP.has(wj)) return 0;
    let s = ((hashString(`${wi}|${wj}`) % 1000) / 1000) * 0.35;
    if (keywords.has(wi) && keywords.has(wj)) s += 0.55;
    if (wi.length > 3 && wj.slice(0, 4) === wi.slice(0, 4)) s += 0.45;
    s += Math.exp(-Math.abs(i - j) / 10) * 0.3;
    return s;
  });
  const top = scores
    .map((s, j) => [s, j] as const)
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 6);
  const max = top[0]?.[0] || 1;
  return top.map(([s, j]) => ({ j, w: s / max }));
}

function Abstract({ text, tags }: { text: string; tags: string[] }) {
  const words = useMemo(() => text.split(" "), [text]);
  const keywords = useMemo(() => {
    const k = new Set<string>();
    tags.forEach((t) => t.split(/\s+/).forEach((x) => k.add(x.toLowerCase().replace(/[^a-z0-9]/g, ""))));
    words.forEach((w) => {
      const c = w.replace(/[^A-Za-z0-9]/g, "");
      if (c.length > 6 || /^[A-Z]/.test(c)) k.add(c.toLowerCase());
    });
    return k;
  }, [tags, words]);
  const box = useRef<HTMLDivElement>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const [focus, setFocus] = useState<number | null>(null);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [weights, setWeights] = useState<Map<number, number>>(new Map());

  const onEnter = (i: number) => {
    const b = box.current?.getBoundingClientRect();
    const from = spans.current[i]?.getBoundingClientRect();
    if (!b || !from) return;
    const att = attention(words, i, keywords);
    const fx = from.left + from.width / 2 - b.left;
    const fy = from.top - b.top + 2;
    setArcs(
      att.map(({ j, w }) => {
        const r = spans.current[j]!.getBoundingClientRect();
        const tx = r.left + r.width / 2 - b.left;
        const ty = r.top - b.top + 2;
        const lift = 18 + Math.abs(tx - fx) * 0.18 + Math.abs(ty - fy) * 0.3;
        const cx = (fx + tx) / 2;
        const cy = Math.min(fy, ty) - lift;
        return { from: i, to: j, w, d: `M${fx},${fy} Q${cx},${cy} ${tx},${ty}` };
      }),
    );
    setWeights(new Map(att.map(({ j, w }) => [j, w])));
    setFocus(i);
  };

  return (
    <div ref={box} className="relative" onPointerLeave={() => { setFocus(null); setArcs([]); setWeights(new Map()); }}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {arcs.map((a, k) => (
          <motion.path
            key={`${a.from}-${a.to}`}
            d={a.d}
            fill="none"
            stroke="#ffb547"
            strokeWidth={0.8 + a.w * 2.2}
            strokeOpacity={0.25 + a.w * 0.7}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: k * 0.03 }}
          />
        ))}
      </svg>
      <p className="relative text-[15.5px] leading-[2.05] text-ice/80">
        {words.map((w, i) => {
          const wt = weights.get(i) ?? 0;
          const isFocus = focus === i;
          return (
            <span key={i}>
              <span
                ref={(el) => {
                  spans.current[i] = el;
                }}
                onPointerEnter={() => onEnter(i)}
                className="cursor-default rounded-sm px-[2px] transition-colors duration-150"
                style={{
                  background: isFocus ? "rgba(79,227,255,0.35)" : wt ? `rgba(255,181,71,${0.12 + wt * 0.45})` : "transparent",
                  color: isFocus || wt > 0.5 ? "#fff" : undefined,
                }}
              >
                {w}
              </span>{" "}
            </span>
          );
        })}
      </p>
    </div>
  );
}

export function Writing() {
  return (
    <section id="writing" data-section="writing" className="section">
      <div className="container-hud">
        <SectionTitle id="writing" title="Research & Writing" wordplay="Attention is all you need." effect="declassify" />
        <p className="mt-6 max-w-[660px] text-[16px] leading-relaxed text-ice/70">
          Notes from the work, written up. Hover any word in an abstract to see where its attention goes.
        </p>

        <div className="mt-12 space-y-6">
          {writing.map((w, i) => (
            <motion.article
              key={w.title}
              className="panel grid gap-6 p-6 sm:p-8 lg:grid-cols-12"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, delay: i * 0.06 }}
            >
              <div className="lg:col-span-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] text-amber">SV:{String(2601 + i)}.{String(i + 1).padStart(4, "0")}</span>
                  {w.sample && <span className="sample-tag">Draft · sample</span>}
                </div>
                <h3 className="mt-3 font-display text-[22px] font-semibold uppercase leading-tight tracking-wide text-ice">{w.title}</h3>
                <p className="mt-2 hud-label">{w.kind}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {w.tags.map((t) => (
                    <span key={t} className="chip">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-8">
                <div className="hud-label mb-2">Abstract</div>
                <Abstract text={w.abstract} tags={w.tags} />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
