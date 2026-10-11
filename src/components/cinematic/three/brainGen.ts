import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "@/lib/random";

/*
 * Procedural brain, sampled as a point cloud from a signed distance field.
 *
 * Axes: x across (left/right hemispheres), y up, z forward (+z is the
 * frontal pole). Each hemisphere is built from frontal, parietal, occipital
 * and temporal masses with a flat medial face, so the longitudinal fissure
 * shows as a clean gap. Gyri follow their real directions: front to back in
 * the frontal and temporal lobes, top to bottom around the central sulcus.
 * The lateral (Sylvian) and central sulci are carved explicitly. Below sit a
 * two-lobed cerebellum with fine folia, the pons and the medulla.
 *
 * Points are spread evenly over the outer surface only (inner faces that
 * other tissue hides are dropped), and sulci are thinned out so the folds
 * read as dark lines between bright gyri.
 */

function ellip(px: number, py: number, pz: number, rx: number, ry: number, rz: number) {
  const ax = px / rx, ay = py / ry, az = pz / rz;
  const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
  const bx = px / (rx * rx), by = py / (ry * ry), bz = pz / (rz * rz);
  const k1 = Math.sqrt(bx * bx + by * by + bz * bz) || 1e-6;
  return (k0 * (k0 - 1)) / k1;
}
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);
function capsule(px: number, py: number, pz: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number, ra: number, rb: number) {
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export type BrainData = {
  pos: Float32Array;
  nor: Float32Array;
  rnd: Float32Array;
  reg: Float32Array;
  groove: Float32Array;
  surfaceCount: number;
  links: Float32Array;
  seeds: Float32Array;
  ends: Float32Array;
};

/** Regions written to `reg`. */
export const BRAIN_REGION = { cerebrum: 0, cerebellum: 1, stem: 2, interior: 3 } as const;

// ── shape (no folds): cheap, used for sampling bounds and visibility ──

function cerebrumShape(x: number, y: number, z: number) {
  const ax = Math.abs(x);
  const dome = ellip(ax - 0.36, y - 0.15, z + 0.08, 0.37, 0.48, 0.86);
  const frontal = ellip(ax - 0.33, y - 0.06, z - 0.42, 0.35, 0.4, 0.5);
  const occipital = ellip(ax - 0.29, y - 0.02, z + 0.66, 0.28, 0.32, 0.33);
  const temporal = ellip(ax - 0.44, y + 0.27, z + 0.1, 0.25, 0.19, 0.56);
  let upper = smin(dome, frontal, 0.16);
  upper = smin(upper, occipital, 0.16);
  // the frontal and parietal lobes have a flatter underside; the temporal
  // lobe hangs below it, its pole tucked under the frontal lobe
  // (only toward the front: further back the two merge)
  const cut = smax(upper, -(y + 0.2 - Math.max(0, z - 0.2) * 0.3), 0.06);
  const w = smooth(-0.3, 0.05, z);
  upper = upper + (cut - upper) * w;
  const d = smin(upper, temporal, 0.05 + 0.12 * (1 - w));
  // flat medial faces: the longitudinal fissure
  return smax(d, 0.016 - ax, 0.03);
}
function cerebellumShape(x: number, y: number, z: number) {
  const l = ellip(x - 0.17, y + 0.37, z + 0.6, 0.25, 0.165, 0.22);
  const r = ellip(x + 0.17, y + 0.37, z + 0.6, 0.25, 0.165, 0.22);
  return smin(l, r, 0.08);
}
function stemShape(x: number, y: number, z: number) {
  const pons = ellip(x, y + 0.4, z + 0.18, 0.12, 0.12, 0.11);
  const medulla = capsule(x, y, z, 0, -0.45, -0.24, 0, -0.72, -0.3, 0.08, 0.06);
  return smin(pons, medulla, 0.07);
}
function shape(x: number, y: number, z: number) {
  return Math.min(cerebrumShape(x, y, z), smin(cerebellumShape(x, y, z), stemShape(x, y, z), 0.05));
}

export function makeBrain(count: number): BrainData {
  const rand = mulberry32(1337);
  const noise = new SimplexNoise({ random: rand });

  // folds on the cerebrum: returns groove 0 (gyrus crest) .. 1 (sulcus)
  const cerebrumGroove = (x: number, y: number, z: number) => {
    const ax = Math.abs(x);
    // the lateral (Sylvian) sulcus rises from the temporal pole toward the back
    const ys = -0.1 - 0.3 * (z - 0.05);
    const sylvian = (1 - smooth(0.01, 0.05, Math.abs(y - ys))) * smooth(0.26, 0.42, ax) * smooth(0.56, 0.36, z) * smooth(-0.4, -0.18, z);
    // the central sulcus runs from the top down and forward to the Sylvian
    const zc = -0.15 + (0.62 - y) * 0.36;
    const central = (1 - smooth(0.006, 0.036, Math.abs(z - zc))) * smooth(ys + 0.05, ys + 0.14, y) * smooth(0.02, 0.06, ax);
    // gyri: direction follows the lobe
    const front = smooth(0.14, 0.42, z) * smooth(ys - 0.02, ys + 0.08, y);
    const temporal = 1 - smooth(ys - 0.08, ys + 0.02, y);
    const cent = Math.exp(-(((z - zc) / 0.2) ** 2)) * smooth(ys, ys + 0.12, y);
    const along = Math.min(1, front + temporal);
    const sy = (1 + 0.8 * along) * (1 - 0.45 * cent);
    const sz = (1 - 0.45 * along) * (1 + 0.8 * cent);
    const wx = 0.09 * noise.noise3d(x * 1.4 + 3.1, y * 1.4, z * 1.4);
    const wy = 0.09 * noise.noise3d(x * 1.4, y * 1.4 + 5.3, z * 1.4);
    const wz = 0.09 * noise.noise3d(x * 1.4, y * 1.4, z * 1.4 + 9.7);
    const F = 5.6;
    const px = (ax + wx) * F, py = (y + wy) * F * sy, pz = (z + wz) * F * sz;
    const n = noise.noise3d(px, py, pz) + 0.32 * noise.noise3d(px * 2.1 + 17.3, py * 2.1, pz * 2.1);
    const gyri = 1 - smooth(0.1, 0.4, Math.abs(n));
    return [Math.max(gyri, sylvian, central), sylvian] as const;
  };
  const cerebellumGroove = (x: number, y: number, z: number) => {
    // folia: fine curved stripes around a point above and in front
    const rr = Math.sqrt(x * x * 0.35 + (y + 0.3) ** 2 + (z + 0.45) ** 2);
    const s = Math.abs(Math.sin(rr * 82));
    const vermis = 1 - smooth(0, 0.035, Math.abs(x));
    return Math.max(1 - smooth(0.05, 0.4, s), vermis * 0.8);
  };

  // full field with folds carved in: [distance, region, groove]
  const sdf = (x: number, y: number, z: number): [number, number, number] => {
    const a = cerebrumShape(x, y, z);
    const b = cerebellumShape(x, y, z);
    const c = stemShape(x, y, z);
    if (a <= b && a <= c) {
      const [g, sylvian] = a < 0.1 ? cerebrumGroove(x, y, z) : [0, 0];
      return [Math.min(a + 0.03 * g * g + 0.06 * sylvian, smin(b, c, 0.05)), 0, g];
    }
    if (b <= c) {
      const g = b < 0.04 ? cerebellumGroove(x, y, z) : 0;
      return [Math.min(b + 0.01 * g, a, c), 1, g];
    }
    return [Math.min(c, a, b), 2, 0];
  };

  const pos: number[] = [];
  const nor: number[] = [];
  const rnd: number[] = [];
  const reg: number[] = [];
  const grv: number[] = [];

  // sample a thin shell around the surface uniformly, project onto it, then
  // keep only points that face outward with nothing in front of them
  const H = 0.022;
  const e = 0.006;
  // blue-noise spacing: no two points closer than R, so the folds read cleanly
  const R = 0.62 * Math.sqrt(5.2 / count);
  const taken = new Map<number, number[]>();
  const key = (i: number, j: number, k: number) => (i * 73856093) ^ (j * 19349663) ^ (k * 83492791);
  const crowded = (x: number, y: number, z: number) => {
    const ci = Math.floor(x / R), cj = Math.floor(y / R), ck = Math.floor(z / R);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (let c = -1; c <= 1; c++) {
          const cell = taken.get(key(ci + a, cj + b, ck + c));
          if (!cell) continue;
          for (let m = 0; m < cell.length; m += 3) {
            const dx = cell[m] - x, dy = cell[m + 1] - y, dz = cell[m + 2] - z;
            if (dx * dx + dy * dy + dz * dz < R * R) return true;
          }
        }
    return false;
  };
  const take = (x: number, y: number, z: number) => {
    const k = key(Math.floor(x / R), Math.floor(y / R), Math.floor(z / R));
    const cell = taken.get(k);
    if (cell) cell.push(x, y, z);
    else taken.set(k, [x, y, z]);
  };
  let guard = 0;
  while (pos.length / 3 < count && guard++ < count * 400) {
    let x = rand() * 1.6 - 0.8, y = rand() * 1.55 - 0.88, z = rand() * 2.0 - 1.0;
    if (Math.abs(shape(x, y, z)) > H + 0.05) continue;
    let [d, region, groove] = sdf(x, y, z);
    if (Math.abs(d) > H) continue;
    let nx = sdf(x + e, y, z)[0] - sdf(x - e, y, z)[0];
    let ny = sdf(x, y + e, z)[0] - sdf(x, y - e, z)[0];
    let nz = sdf(x, y, z + e)[0] - sdf(x, y, z - e)[0];
    const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    x -= nx * d;
    y -= ny * d;
    z -= nz * d;
    // hidden faces: anything solid just outside along the normal
    let hidden = false;
    // (start past the depth of a sulcus so its own walls don't count)
    for (let t = 0.07; t < 0.7; ) {
      const s = shape(x + nx * t, y + ny * t, z + nz * t);
      if (s < -0.004) {
        hidden = true;
        break;
      }
      t += Math.max(0.012, s * 0.9);
    }
    if (hidden) continue;
    [d, region, groove] = sdf(x, y, z);
    // sulci stay dark: most points that land in one are dropped
    if (groove > 0.42 && rand() > 0.06) continue;
    if (crowded(x, y, z)) continue;
    take(x, y, z);
    pos.push(x, y, z);
    nor.push(nx, ny, nz);
    rnd.push(rand());
    reg.push(region);
    grv.push(groove);
  }
  const surfaceCount = pos.length / 3;

  // interior neurons: sparse, drifting, dim
  const interior = Math.floor(count * 0.025);
  let added = 0;
  guard = 0;
  while (added < interior && guard++ < interior * 60) {
    const x = (rand() * 2 - 1) * 0.7, y = rand() * 1.0 - 0.35, z = (rand() * 2 - 1) * 0.9;
    if (cerebrumShape(x, y, z) < -0.1) {
      pos.push(x, y, z);
      nor.push(0, 1, 0);
      rnd.push(rand());
      reg.push(BRAIN_REGION.interior);
      grv.push(0);
      added++;
    }
  }

  // synapses: short links between nearby points on gyrus crests
  const cell = 0.14;
  const grid = new Map<string, number[]>();
  for (let i = 0; i < surfaceCount; i++) {
    if (grv[i] > 0.3) continue;
    const k = `${Math.floor(pos[i * 3] / cell)},${Math.floor(pos[i * 3 + 1] / cell)},${Math.floor(pos[i * 3 + 2] / cell)}`;
    const arr = grid.get(k);
    if (arr) arr.push(i);
    else grid.set(k, [i]);
  }
  const links: number[] = [];
  const seeds: number[] = [];
  const ends: number[] = [];
  const linkCount = Math.floor(count * 0.05);
  for (let n = 0; n < linkCount * 6 && links.length / 6 < linkCount; n++) {
    const i = Math.floor(rand() * surfaceCount);
    if (grv[i] > 0.3) continue;
    const cand = grid.get(`${Math.floor(pos[i * 3] / cell)},${Math.floor(pos[i * 3 + 1] / cell)},${Math.floor(pos[i * 3 + 2] / cell)}`);
    if (!cand) continue;
    const j = cand[Math.floor(rand() * cand.length)];
    if (j === i) continue;
    const ddx = pos[i * 3] - pos[j * 3], ddy = pos[i * 3 + 1] - pos[j * 3 + 1], ddz = pos[i * 3 + 2] - pos[j * 3 + 2];
    const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
    if (dist < 0.05 || dist > 0.14) continue;
    links.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
    const s = rand();
    seeds.push(s, s);
    ends.push(0, 1);
  }

  return {
    pos: new Float32Array(pos),
    nor: new Float32Array(nor),
    rnd: new Float32Array(rnd),
    reg: new Float32Array(reg),
    groove: new Float32Array(grv),
    surfaceCount,
    links: new Float32Array(links),
    seeds: new Float32Array(seeds),
    ends: new Float32Array(ends),
  };
}
