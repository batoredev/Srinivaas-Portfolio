import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "@/lib/random";

/*
 * Procedural brain, sampled as a point cloud from a signed distance field:
 * two hemispheres with temporal lobes, sulci carved by ridged noise, a
 * striated cerebellum and a brain stem. Rays are marched inward from outside
 * so every sample lands on the outermost surface. Runs in a Web Worker.
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
function capsule(px: number, py: number, pz: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number) {
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
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

export function makeBrain(count: number): BrainData {
  const rand = mulberry32(1337);
  const noise = new SimplexNoise({ random: rand });

  // returns [distance, groove 0..1]
  const cerebrum = (x: number, y: number, z: number): [number, number] => {
    // flatten the underside a little
    const yy = y < -0.1 ? y * 1.18 : y;
    const hl = ellip(x + 0.34, yy - 0.05, z, 0.42, 0.56, 0.96);
    const hr = ellip(x - 0.34, yy - 0.05, z, 0.42, 0.56, 0.96);
    const tl = ellip(x + 0.46, y + 0.24, z - 0.14, 0.27, 0.26, 0.55);
    const tr = ellip(x - 0.46, y + 0.24, z - 0.14, 0.27, 0.26, 0.55);
    let d = smin(smin(hl, tl, 0.1), smin(hr, tr, 0.1), 0.05);
    // domain-warped ridged noise → gyri and sulci
    const wx = x + 0.18 * noise.noise3d(x * 1.6, y * 1.6, z * 1.6);
    const wy = y + 0.18 * noise.noise3d(x * 1.6 + 7.1, y * 1.6, z * 1.6);
    const n = noise.noise3d(wx * 3.4, wy * 3.4, z * 3.4) + 0.4 * noise.noise3d(wx * 7.0 + 11.3, wy * 7.0, z * 7.0);
    const g = Math.max(0, 1 - Math.abs(n) / 0.2);
    d += 0.055 * g * g;
    // longitudinal fissure (top) and lateral sulcus (between temporal and frontal/parietal)
    d += 0.1 * Math.max(0, 1 - Math.abs(x) / 0.05) * smooth(-0.2, 0.3, y);
    const sylvian = Math.max(0, 1 - Math.abs(y + 0.06 - z * 0.28) / 0.05) * smooth(0.25, 0.5, Math.abs(x)) * smooth(-0.6, 0.1, z);
    d += 0.05 * sylvian;
    return [d, Math.min(1, g * g + sylvian)];
  };
  const cerebellum = (x: number, y: number, z: number): [number, number] => {
    let d = ellip(x, y + 0.42, z + 0.62, 0.5, 0.23, 0.29);
    const s = Math.max(0, 1 - Math.abs(Math.sin((y + z * 0.45) * 62)) / 0.4);
    d += 0.012 * s;
    return [d, s * 0.7];
  };
  const stem = (x: number, y: number, z: number) => capsule(x, y, z, 0, -0.34, -0.26, 0, -1.02, -0.4, 0.1);

  const sdf = (x: number, y: number, z: number): [number, number, number] => {
    const [a, ga] = cerebrum(x, y, z);
    const [b, gb] = cerebellum(x, y, z);
    const c = stem(x, y, z);
    let d = smin(a, b, 0.03);
    d = smin(d, c, 0.09);
    if (a <= b && a <= c) return [d, 0, ga];
    if (b <= c) return [d, 1, gb];
    return [d, 2, 0];
  };

  const pos: number[] = [];
  const nor: number[] = [];
  const rnd: number[] = [];
  const reg: number[] = [];
  const grv: number[] = [];
  const ox = 0, oy = -0.08, oz = -0.05;
  let tries = 0;
  while (pos.length / 3 < count && tries < count * 3) {
    tries++;
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const dx = s * Math.cos(th), dy = u, dz = s * Math.sin(th);
    let t = 1.7;
    let hit = -1;
    while (t > 0.02) {
      const d = sdf(ox + dx * t, oy + dy * t, oz + dz * t)[0];
      if (d < 0) {
        hit = t;
        break;
      }
      t -= Math.max(0.016, Math.min(d * 0.9, 0.08));
    }
    if (hit < 0) continue;
    let lo = hit, hi = hit + 0.08;
    for (let k = 0; k < 10; k++) {
      const m = (lo + hi) / 2;
      if (sdf(ox + dx * m, oy + dy * m, oz + dz * m)[0] < 0) lo = m;
      else hi = m;
    }
    const px = ox + dx * lo, py = oy + dy * lo, pz = oz + dz * lo;
    const [, region, groove] = sdf(px, py, pz);
    const e = 0.012;
    let nx = sdf(px + e, py, pz)[0] - sdf(px - e, py, pz)[0];
    let ny = sdf(px, py + e, pz)[0] - sdf(px, py - e, pz)[0];
    let nz = sdf(px, py, pz + e)[0] - sdf(px, py, pz - e)[0];
    const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    pos.push(px, py, pz);
    nor.push(nx, ny, nz);
    rnd.push(rand());
    reg.push(region);
    grv.push(groove);
  }
  const surfaceCount = pos.length / 3;

  // interior neurons: sparse, drifting, dim
  const interior = Math.floor(count * 0.05);
  let added = 0;
  let guard = 0;
  while (added < interior && guard++ < interior * 40) {
    const x = (rand() * 2 - 1) * 0.75, y = (rand() * 2 - 1) * 0.6, z = (rand() * 2 - 1) * 0.9;
    if (sdf(x, y, z)[0] < -0.08) {
      pos.push(x, y, z);
      nor.push(0, 1, 0);
      rnd.push(rand());
      reg.push(3);
      grv.push(0);
      added++;
    }
  }

  // synapses: short links between nearby surface points (spatial hash)
  const cell = 0.16;
  const grid = new Map<string, number[]>();
  for (let i = 0; i < surfaceCount; i++) {
    const k = `${Math.floor(pos[i * 3] / cell)},${Math.floor(pos[i * 3 + 1] / cell)},${Math.floor(pos[i * 3 + 2] / cell)}`;
    const arr = grid.get(k);
    if (arr) arr.push(i);
    else grid.set(k, [i]);
  }
  const links: number[] = [];
  const seeds: number[] = [];
  const ends: number[] = [];
  const linkCount = Math.floor(count * 0.1);
  for (let n = 0; n < linkCount * 4 && links.length / 6 < linkCount; n++) {
    const i = Math.floor(rand() * surfaceCount);
    const cx = Math.floor(pos[i * 3] / cell), cy = Math.floor(pos[i * 3 + 1] / cell), cz = Math.floor(pos[i * 3 + 2] / cell);
    const cand = grid.get(`${cx + Math.round(rand() * 2 - 1)},${cy + Math.round(rand() * 2 - 1)},${cz + Math.round(rand() * 2 - 1)}`);
    if (!cand) continue;
    const j = cand[Math.floor(rand() * cand.length)];
    if (j === i) continue;
    const ddx = pos[i * 3] - pos[j * 3], ddy = pos[i * 3 + 1] - pos[j * 3 + 1], ddz = pos[i * 3 + 2] - pos[j * 3 + 2];
    const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
    if (dist < 0.06 || dist > 0.2) continue;
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
