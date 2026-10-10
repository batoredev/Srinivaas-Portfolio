"use client";

import { useEffect, useRef, useState } from "react";
import { stackLayers } from "@/data/content";
import { mulberry32 } from "@/lib/random";
import { SectionTitle } from "../ui/SectionTitle";

type Node = { l: number; i: number; label: string; x: number; y: number };
type Edge = { a: number; b: number; w: number; seed: number };

const LAYER_TAG = ["Input", "Hidden · 1", "Hidden · 2", "Hidden · 3", "Output"];

function NeuralNet() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ label: string; layer: string; x: number; y: number; links: number } | null>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const box = wrap.current!;
    const ctx = cv.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const mono = css.getPropertyValue("--font-jet") || "monospace";
    const display = css.getPropertyValue("--font-chakra") || "sans-serif";
    let W = 0, H = 0, dpr = 1, vertical = false;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let hoverIdx = -1;
    let visible = false;
    let raf = 0;
    const mouse = { x: -999, y: -999 };

    const layout = () => {
      const r = box.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr;
      cv.height = H * dpr;
      vertical = W < 760;
      nodes = [];
      const L = stackLayers.length;
      stackLayers.forEach((layer, l) => {
        const n: number = layer.nodes.length;
        layer.nodes.forEach((label, i) => {
          if (!vertical) {
            const x = 70 + (l * (W - 140)) / (L - 1);
            const span = Math.min(H - 150, n * 92);
            const y = H / 2 + 12 + (n === 1 ? 0 : (i / (n - 1) - 0.5) * span);
            nodes.push({ l, i, label, x, y });
          } else {
            const y = 60 + (l * (H - 110)) / (L - 1);
            const span = W - 70;
            const x = W / 2 + (n === 1 ? 0 : (i / (n - 1) - 0.5) * span);
            nodes.push({ l, i, label, x, y });
          }
        });
      });
      const rnd = mulberry32(42);
      edges = [];
      nodes.forEach((a, ai) =>
        nodes.forEach((b, bi) => {
          if (b.l === a.l + 1) edges.push({ a: ai, b: bi, w: 0.2 + rnd() * 0.8, seed: rnd() });
        }),
      );
    };

    const draw = (t: number) => {
      raf = 0;
      if (!visible) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const L = stackLayers.length;
      const period = 3.6;
      const pass = Math.floor(t / period);
      const wave = ((t % period) / period) * (L + 0.6) - 0.3;

      // hover detection
      hoverIdx = -1;
      let best = 30;
      nodes.forEach((n, i) => {
        const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (d < best) {
          best = d;
          hoverIdx = i;
        }
      });
      const linked = new Set<number>();
      if (hoverIdx >= 0) edges.forEach((e, k) => (e.a === hoverIdx || e.b === hoverIdx) && linked.add(k));

      // layer headers
      ctx.font = `500 10px ${mono}`;
      ctx.textAlign = "center";
      stackLayers.forEach((layer, l) => {
        const first = nodes.find((n) => n.l === l)!;
        ctx.fillStyle = "rgba(158,243,255,0.5)";
        if (!vertical) {
          ctx.fillText(LAYER_TAG[l].toUpperCase(), first.x, 26);
          ctx.fillStyle = "rgba(255,181,71,0.85)";
          ctx.fillText(layer.name.toUpperCase(), first.x, 42);
        } else {
          ctx.textAlign = "left";
          ctx.fillText(`${LAYER_TAG[l].toUpperCase()} · ${layer.name.toUpperCase()}`, 12, first.y - 30);
          ctx.textAlign = "center";
        }
      });

      // edges
      edges.forEach((e, k) => {
        const a = nodes[e.a], b = nodes[e.b];
        const hot = linked.has(k);
        const dim = hoverIdx >= 0 && !hot;
        ctx.strokeStyle = hot ? "rgba(255,181,71,0.75)" : `rgba(79,227,255,${dim ? 0.025 : 0.05 + e.w * 0.1})`;
        ctx.lineWidth = hot ? 1.4 : 0.5 + e.w * 0.9;
        ctx.beginPath();
        if (!vertical) {
          const mx = (a.x + b.x) / 2;
          ctx.moveTo(a.x, a.y);
          ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
        } else {
          const my = (a.y + b.y) / 2;
          ctx.moveTo(a.x, a.y);
          ctx.bezierCurveTo(a.x, my, b.x, my, b.x, b.y);
        }
        ctx.stroke();

        // forward-pass signal
        const fires = ((e.seed * 997 + pass * 0.618) % 1) < e.w * 0.75;
        const u = wave - a.l;
        if ((fires || hot) && u > 0 && u < 1) {
          const tt = u;
          let x, y;
          if (!vertical) {
            const mx = (a.x + b.x) / 2;
            x = Math.pow(1 - tt, 3) * a.x + 3 * Math.pow(1 - tt, 2) * tt * mx + 3 * (1 - tt) * tt * tt * mx + tt ** 3 * b.x;
            y = Math.pow(1 - tt, 3) * a.y + 3 * Math.pow(1 - tt, 2) * tt * a.y + 3 * (1 - tt) * tt * tt * b.y + tt ** 3 * b.y;
          } else {
            const my = (a.y + b.y) / 2;
            x = Math.pow(1 - tt, 3) * a.x + 3 * Math.pow(1 - tt, 2) * tt * a.x + 3 * (1 - tt) * tt * tt * b.x + tt ** 3 * b.x;
            y = Math.pow(1 - tt, 3) * a.y + 3 * Math.pow(1 - tt, 2) * tt * my + 3 * (1 - tt) * tt * tt * my + tt ** 3 * b.y;
          }
          ctx.fillStyle = hot ? "#ffb547" : "#9ef3ff";
          ctx.shadowColor = hot ? "#ffb547" : "#4fe3ff";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, hot ? 2.6 : 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // nodes
      nodes.forEach((n, i) => {
        const act = Math.exp(-Math.pow(wave - n.l, 2) * 10);
        const isHover = i === hoverIdx;
        const isLinked = hoverIdx >= 0 && edges.some((e, k) => linked.has(k) && (e.a === i || e.b === i));
        const r = isHover ? 9 : 6.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + act * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,181,71,${act * 0.18})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHover || isLinked ? "#ffb547" : act > 0.5 ? "#e2fbff" : "#051018";
        ctx.shadowColor = isHover || act > 0.4 ? "#ffb547" : "#4fe3ff";
        ctx.shadowBlur = isHover ? 24 : 8 + act * 16;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = isHover || isLinked ? "#ffb547" : "rgba(79,227,255,0.85)";
        ctx.stroke();

        // label
        ctx.font = `${isHover ? 600 : 500} ${vertical ? 10 : 12.5}px ${display}`;
        const text = n.label;
        const tw = ctx.measureText(text).width;
        const lx = n.x;
        // on narrow screens alternate labels above/below so neighbours never collide
        const ly = vertical ? (n.i % 2 ? n.y - 14 : n.y + 22) : n.y + 24;
        ctx.fillStyle = "rgba(2,4,9,0.82)";
        ctx.fillRect(lx - tw / 2 - 6, ly - 12, tw + 12, 17);
        ctx.fillStyle = isHover ? "#ffb547" : hoverIdx >= 0 && !isLinked ? "rgba(226,251,255,0.35)" : "rgba(226,251,255,0.92)";
        ctx.textAlign = "center";
        ctx.fillText(text, lx, ly);
      });

      raf = requestAnimationFrame((ms) => draw(ms / 1000));
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame((ms) => draw(ms / 1000));
    };

    layout();
    const ro = new ResizeObserver(() => layout());
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(box);

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      // tooltip is React state, so update it only when the target changes
      let idx = -1;
      let best = 30;
      nodes.forEach((n, i) => {
        const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (d < best) {
          best = d;
          idx = i;
        }
      });
      setHover((prev) => {
        if (idx < 0) return null;
        const n = nodes[idx];
        if (prev && prev.label === n.label) return prev;
        const links = edges.filter((ed) => ed.a === idx || ed.b === idx).length;
        return { label: n.label, layer: stackLayers[n.l].name, x: n.x, y: n.y, links };
      });
    };
    const onLeave = () => {
      mouse.x = mouse.y = -999;
      setHover(null);
    };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrap} className="relative h-[760px] w-full md:h-[560px]">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" data-lock="Neural network" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 border border-amber/50 bg-void/90 px-3 py-2 backdrop-blur"
          style={{ left: hover.x, top: hover.y - 74 }}
        >
          <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-amber">{hover.layer}</div>
          <div className="font-display text-[15px] font-semibold text-ice">{hover.label}</div>
          <div className="font-mono text-[10px] text-fog">{hover.links} synapses · activation 0.9{(hover.label.length % 9) + 1}</div>
        </div>
      )}
    </div>
  );
}

export function Stack() {
  const neurons = stackLayers.reduce((s, l) => s + l.nodes.length, 0);
  let weights = 0;
  for (let i = 0; i < stackLayers.length - 1; i++) weights += stackLayers[i].nodes.length * stackLayers[i + 1].nodes.length;
  return (
    <section id="stack" data-section="stack" className="section">
      <div className="container-hud">
        <SectionTitle id="stack" title="Tech Stack" wordplay="One forward pass." effect="fire" />
        <p className="mt-6 max-w-[640px] text-[16px] leading-relaxed text-ice/70">
          Languages go in, products come out. Every tool sits in the layer where it does its work. Hover a neuron to trace its synapses.
        </p>
        <div className="panel mt-12 overflow-hidden px-2 py-4 sm:px-6">
          <NeuralNet />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-holo/10 px-2 pt-4 font-mono text-[11px] tracking-[0.15em] text-fog">
            <span>
              LAYERS <span className="text-ice">{stackLayers.length}</span> · NEURONS <span className="text-ice">{neurons}</span> · WEIGHTS{" "}
              <span className="text-ice">{weights}</span>
            </span>
            <span>
              OPTIMIZER <span className="text-amber">ship → learn → repeat</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
