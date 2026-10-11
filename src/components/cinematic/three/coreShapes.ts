import { mulberry32 } from "@/lib/random";
import { makeBrain, type BrainData } from "./brainGen";

/*
 * The Core: one particle cloud that re-forms itself for every chapter, the
 * way a model reorganises its weights for each task. Every shape has exactly
 * the same number of points as the brain, so any two can be morphed.
 */

export const CORE_SHAPES = ["brain", "fingerprint", "network", "helix", "lattice", "tensor", "orbits", "handshake", "point"] as const;
export type CoreShape = (typeof CORE_SHAPES)[number];

export type CoreData = {
  brain: BrainData;
  count: number;
  shapes: Record<CoreShape, Float32Array>;
};

type Rand = () => number;

function gauss(r: Rand) {
  // Box-Muller, clamped so outliers don't fly off
  const u = Math.max(1e-6, r());
  const v = r();
  return Math.max(-2.5, Math.min(2.5, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
}

function put(out: Float32Array, i: number, x: number, y: number, z: number) {
  out[i * 3] = x;
  out[i * 3 + 1] = y;
  out[i * 3 + 2] = z;
}

/** Identity: a warped fingerprint, slightly domed toward the viewer. */
function fingerprint(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  const rings = 17;
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  for (let i = 0; i < n; i++) {
    // weight rings by circumference so density stays even
    const k = Math.floor(Math.sqrt(r()) * rings);
    const base = 0.1 + (k / rings) * 0.95;
    const t = r() * Math.PI * 2;
    const warp = 0.05 * Math.sin(3 * t + ph[0] + k * 0.3) + 0.03 * Math.sin(5 * t + ph[1] - k * 0.2) + 0.025 * (k / rings) * Math.sin(2 * t + ph[2]);
    const rr = base + warp;
    const x = Math.cos(t) * rr * 0.92;
    const y = Math.sin(t) * rr * 1.12;
    const z = 0.32 * (1 - Math.min(1, rr * rr)) + (r() - 0.5) * 0.025;
    put(out, i, x, y, z);
  }
  return out;
}

/** Weights: a feed-forward network drawn in particles, nodes plus synapses. */
function network(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  const layers = [4, 6, 7, 6, 3];
  const nodes: [number, number, number][][] = layers.map((count, li) => {
    const x = -1.25 + (li / (layers.length - 1)) * 2.5;
    return Array.from({ length: count }, (_, k) => [x, (k - (count - 1) / 2) * 0.3, (r() - 0.5) * 0.5] as [number, number, number]);
  });
  for (let i = 0; i < n; i++) {
    if (r() < 0.5) {
      const L = nodes[Math.floor(r() * nodes.length)];
      const [x, y, z] = L[Math.floor(r() * L.length)];
      put(out, i, x + gauss(r) * 0.035, y + gauss(r) * 0.035, z + gauss(r) * 0.035);
    } else {
      const li = Math.floor(r() * (nodes.length - 1));
      const a = nodes[li][Math.floor(r() * nodes[li].length)];
      const b = nodes[li + 1][Math.floor(r() * nodes[li + 1].length)];
      const t = r();
      put(out, i, a[0] + (b[0] - a[0]) * t + gauss(r) * 0.004, a[1] + (b[1] - a[1]) * t + gauss(r) * 0.004, a[2] + (b[2] - a[2]) * t + gauss(r) * 0.004);
    }
  }
  return out;
}

/** Deployment: a training helix, two strands, rungs and bright commits. */
function helix(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  const H = 1.85, R = 0.5, turns = 2;
  const at = (y01: number, strand: number): [number, number, number] => {
    const a = y01 * turns * Math.PI * 2 + strand * Math.PI;
    return [Math.cos(a) * R, -H / 2 + y01 * H, Math.sin(a) * R];
  };
  for (let i = 0; i < n; i++) {
    const c = r();
    if (c < 0.62) {
      const [x, y, z] = at(r(), r() < 0.5 ? 0 : 1);
      put(out, i, x + gauss(r) * 0.018, y + gauss(r) * 0.018, z + gauss(r) * 0.018);
    } else if (c < 0.88) {
      const y01 = Math.round(r() * 18) / 18;
      const a = at(y01, 0), b = at(y01, 1);
      const t = r();
      put(out, i, a[0] + (b[0] - a[0]) * t, a[1] + gauss(r) * 0.006, a[2] + (b[2] - a[2]) * t);
    } else {
      const y01 = [0.08, 0.27, 0.44, 0.61, 0.79, 0.95][Math.floor(r() * 6)];
      const [x, y, z] = at(y01, r() < 0.5 ? 0 : 1);
      put(out, i, x + gauss(r) * 0.04, y + gauss(r) * 0.04, z + gauss(r) * 0.04);
    }
  }
  return out;
}

function icosphere(detail: number) {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts: number[][] = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const norm = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  verts = verts.map(norm);
  for (let d = 0; d < detail; d++) {
    const cache = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      verts.push(norm([(verts[a][0] + verts[b][0]) / 2, (verts[a][1] + verts[b][1]) / 2, (verts[a][2] + verts[b][2]) / 2]));
      cache.set(key, verts.length - 1);
      return verts.length - 1;
    };
    faces = faces.flatMap(([a, b, c]) => {
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]];
    });
  }
  const edges = new Set<string>();
  for (const [a, b, c] of faces) for (const [p, q] of [[a, b], [b, c], [c, a]]) edges.add(p < q ? `${p}_${q}` : `${q}_${p}`);
  return { verts, edges: [...edges].map((e) => e.split("_").map(Number) as [number, number]) };
}

/** Inference: a geodesic lattice, the projector the work rises out of. */
function lattice(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  const { verts, edges } = icosphere(2);
  const R = 1.0;
  for (let i = 0; i < n; i++) {
    const c = r();
    if (c < 0.66) {
      const [a, b] = edges[Math.floor(r() * edges.length)];
      const t = r();
      const p = [verts[a][0] + (verts[b][0] - verts[a][0]) * t, verts[a][1] + (verts[b][1] - verts[a][1]) * t, verts[a][2] + (verts[b][2] - verts[a][2]) * t];
      const l = Math.hypot(p[0], p[1], p[2]);
      put(out, i, (p[0] / l) * R, (p[1] / l) * R, (p[2] / l) * R);
    } else if (c < 0.86) {
      const v = verts[Math.floor(r() * verts.length)];
      put(out, i, v[0] * R + gauss(r) * 0.022, v[1] * R + gauss(r) * 0.022, v[2] * R + gauss(r) * 0.022);
    } else {
      // a small bright seed at the centre
      put(out, i, gauss(r) * 0.12, gauss(r) * 0.12, gauss(r) * 0.12);
    }
  }
  return out;
}

/** Open weights: a tensor, drawn as a staggered stack of weight matrices. */
function tensor(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  const L = 4, G = 7, S = 1.3;
  const at = (k: number) => -S / 2 + (k / (G - 1)) * S;
  for (let i = 0; i < n; i++) {
    const l = Math.floor(r() * L);
    // each layer sits behind the last, nudged up and to the side
    const ox = (l - (L - 1) / 2) * 0.16, oy = (l - (L - 1) / 2) * 0.1, oz = -(l - (L - 1) / 2) * 0.34;
    const a = Math.floor(r() * G), b = Math.floor(r() * G);
    let x = at(a), y = at(b);
    const c = r();
    if (c < 0.7) {
      // a weight: a bright node, some heavier than others
      const w = 0.012 + (((a * 7 + b * 13 + l * 5) % 5) / 5) * 0.014;
      x += gauss(r) * w;
      y += gauss(r) * w;
    } else if (c < 0.92) {
      // dotted links along the rows and columns
      const t = r() * (S / (G - 1));
      if (r() < 0.5) x = at(Math.min(G - 2, a)) + t;
      else y = at(Math.min(G - 2, b)) + t;
    } else {
      // the frame of each matrix
      const e = Math.floor(r() * 4), t = r() * S - S / 2, m = S / 2 + 0.08;
      [x, y] = e === 0 ? [t, m] : e === 1 ? [t, -m] : e === 2 ? [m, t] : [-m, t];
    }
    put(out, i, x + ox, y + oy, oz + gauss(r) * 0.004);
  }
  return out;
}

/** Next epoch: three live processes orbiting a core. */
function orbits(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  const rings = [
    { R: 0.55, tilt: 0.35, yaw: 0.0 },
    { R: 0.82, tilt: -0.5, yaw: 1.1 },
    { R: 1.08, tilt: 0.2, yaw: 2.3 },
  ];
  const ringPoint = (k: number, a: number): [number, number, number] => {
    const { R, tilt, yaw } = rings[k];
    const x0 = Math.cos(a) * R, z0 = Math.sin(a) * R;
    const y1 = -z0 * Math.sin(tilt), z1 = z0 * Math.cos(tilt);
    return [x0 * Math.cos(yaw) - z1 * Math.sin(yaw), y1, x0 * Math.sin(yaw) + z1 * Math.cos(yaw)];
  };
  for (let i = 0; i < n; i++) {
    const c = r();
    if (c < 0.16) {
      put(out, i, gauss(r) * 0.08, gauss(r) * 0.08, gauss(r) * 0.08);
    } else if (c < 0.62) {
      const [x, y, z] = ringPoint(Math.floor(r() * 3), r() * Math.PI * 2);
      put(out, i, x + gauss(r) * 0.006, y + gauss(r) * 0.006, z + gauss(r) * 0.006);
    } else {
      // a process on each ring, with a short comet trail behind it
      const k = Math.floor(r() * 3);
      const head = 0.8 + k * 2.1;
      const trail = r() < 0.55 ? 0 : r() * 0.9;
      const [x, y, z] = ringPoint(k, head - trail);
      const s = trail === 0 ? 0.075 : 0.02 * (1 - trail);
      put(out, i, x + gauss(r) * s, y + gauss(r) * s, z + gauss(r) * s);
    }
  }
  return out;
}

/** Handshake: two signals reaching across and meeting in a spark. */
function handshake(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  const stream = (side: number, t: number): [number, number, number] => {
    // mirrored arcs that rise in from either side and meet in the middle
    const p0 = [side * 1.5, -0.32, 0.12];
    const p1 = [side * 0.7, 0.38, -0.18];
    const p2 = [0, 0, 0];
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1], u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2]];
  };
  for (let i = 0; i < n; i++) {
    const c = r();
    if (c < 0.84) {
      const side = r() < 0.5 ? -1 : 1;
      const t = Math.pow(r(), 0.8);
      const [x, y, z] = stream(side, t);
      const w = 0.11 * (1 - t) + 0.012;
      put(out, i, x + gauss(r) * w, y + gauss(r) * w, z + gauss(r) * w);
    } else if (c < 0.94) {
      put(out, i, gauss(r) * 0.05, gauss(r) * 0.05, gauss(r) * 0.05);
    } else {
      const a = r() * Math.PI * 2, b = Math.acos(2 * r() - 1), rr = 0.12 + r() * 0.3;
      put(out, i, Math.sin(b) * Math.cos(a) * rr, Math.cos(b) * rr, Math.sin(b) * Math.sin(a) * rr);
    }
  }
  return out;
}

/** Shutdown: everything collapses into one point of light. */
function point(n: number, r: Rand) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    if (r() < 0.86) {
      put(out, i, gauss(r) * 0.035, gauss(r) * 0.035, gauss(r) * 0.035);
    } else {
      const a = r() * Math.PI * 2, R = 0.42 + gauss(r) * 0.01;
      put(out, i, Math.cos(a) * R, Math.sin(a) * R * 0.18, Math.sin(a) * R);
    }
  }
  return out;
}

export function makeCore(count: number): CoreData {
  const brain = makeBrain(count);
  const n = brain.pos.length / 3;
  const r = mulberry32(2026);
  return {
    brain,
    count: n,
    shapes: {
      brain: brain.pos,
      fingerprint: fingerprint(n, r),
      network: network(n, r),
      helix: helix(n, r),
      lattice: lattice(n, r),
      tensor: tensor(n, r),
      orbits: orbits(n, r),
      handshake: handshake(n, r),
      point: point(n, r),
    },
  };
}
