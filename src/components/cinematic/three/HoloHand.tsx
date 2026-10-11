"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import { Stage } from "./Stage";

/*
 * The other half of the handshake: a synthetic hand drawn the way the Core is
 * drawn, a skin of light over a visible robotic skeleton. It reaches in from
 * the right with the index finger extended. The visitor's cursor plays the
 * human hand: as it nears the fingertip, a stream of particles reaches out
 * to meet it; touch the tip and the hand locks on, warming from cyan to amber.
 *
 * Hand space: fingers point along -x, the back of the hand faces +y, the
 * thumb side is +z. The skin is sampled from a signed distance field built
 * from capsules, each point bound to one bone, then posed on the CPU.
 */

type V3 = [number, number, number];
type Finger = { base: V3; splay: number; len: V3; rad: [number, number, number, number]; rest: V3 };

const FINGERS: Finger[] = [
  // index: the reach
  { base: [0.0, 0.0, 0.25], splay: 0.07, len: [0.46, 0.27, 0.2], rad: [0.078, 0.068, 0.06, 0.047], rest: [0.03, 0.05, 0.04] },
  // the others fall away in a relaxed cascade
  { base: [-0.03, 0.005, 0.08], splay: 0.0, len: [0.5, 0.31, 0.21], rad: [0.082, 0.071, 0.062, 0.049], rest: [0.2, 0.32, 0.22] },
  { base: [0.0, 0.0, -0.085], splay: -0.07, len: [0.47, 0.29, 0.2], rad: [0.078, 0.068, 0.06, 0.047], rest: [0.3, 0.4, 0.26] },
  { base: [0.07, -0.01, -0.235], splay: -0.16, len: [0.37, 0.22, 0.18], rad: [0.068, 0.06, 0.053, 0.043], rest: [0.42, 0.48, 0.3] },
];
// the thumb rests along the side of the palm and moves with it
const THUMB: V3[] = [
  [0.74, -0.08, 0.2],
  [0.44, -0.13, 0.43],
  [0.2, -0.16, 0.56],
  [0.01, -0.16, 0.6],
];
const THUMB_RAD = [0.095, 0.086, 0.074, 0.058];
const WRIST: V3 = [0.82, -0.02, 0.01];
const ELBOW: V3 = [2.8, -0.08, -0.04];
const BONES = 1 + FINGERS.length * 3;

const v = (a: V3) => new THREE.Vector3(...a);

/** Joint positions and bone rotations for given finger curls. */
function solve(curls: number[][], heads: THREE.Vector3[], rots: THREE.Quaternion[], tips: THREE.Vector3[]) {
  heads[0].set(0, 0, 0);
  rots[0].identity();
  const qs = new THREE.Quaternion();
  const qc = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const step = new THREE.Vector3();
  FINGERS.forEach((f, fi) => {
    const head = v(f.base);
    qs.setFromAxisAngle(yAxis, f.splay);
    let angle = 0;
    for (let s = 0; s < 3; s++) {
      angle += curls[fi][s];
      const b = 1 + fi * 3 + s;
      qc.setFromAxisAngle(zAxis, angle);
      rots[b].copy(qs).multiply(qc);
      heads[b].copy(head);
      step.set(-f.len[s], 0, 0).applyQuaternion(rots[b]);
      head.add(step);
    }
    tips[fi].copy(head);
  });
}

// ── signed distance helpers ──
function capsule(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number) {
  const pax = p.x - a.x, pay = p.y - a.y, paz = p.z - a.z;
  const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}
function roundBox(p: THREE.Vector3, c: V3, half: V3, r: number) {
  const qx = Math.abs(p.x - c[0]) - half[0], qy = Math.abs(p.y - c[1]) - half[1], qz = Math.abs(p.z - c[2]) - half[2];
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
function ellip(p: THREE.Vector3, c: V3, r: V3) {
  const ax = (p.x - c[0]) / r[0], ay = (p.y - c[1]) / r[1], az = (p.z - c[2]) / r[2];
  const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
  const bx = (p.x - c[0]) / (r[0] * r[0]), by = (p.y - c[1]) / (r[1] * r[1]), bz = (p.z - c[2]) / (r[2] * r[2]);
  return (k0 * (k0 - 1)) / (Math.sqrt(bx * bx + by * by + bz * bz) || 1e-6);
}
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

type HandData = {
  count: number;
  local: Float32Array; // bone-local rest positions
  localN: Float32Array;
  bone: Uint8Array;
  rand: Float32Array;
  fade: Float32Array;
  scatter: Float32Array;
};

/** Samples the skin evenly and binds each point to its nearest bone. */
function buildHand(count: number): HandData {
  const rand = mulberry32(77);
  const heads = Array.from({ length: BONES }, () => new THREE.Vector3());
  const rots = Array.from({ length: BONES }, () => new THREE.Quaternion());
  const tips = FINGERS.map(() => new THREE.Vector3());
  solve(
    FINGERS.map((f) => [...f.rest]),
    heads,
    rots,
    tips,
  );
  const tails = heads.map((h, b) => (b === 0 ? h : b % 3 === 0 ? tips[(b - 3) / 3] : heads[b + 1]));
  const thumb = THUMB.map(v);
  const wrist = v(WRIST), elbow = v(ELBOW);

  // [distance, bone]
  const field = (p: THREE.Vector3): [number, number] => {
    let palm = roundBox(p, [0.43, -0.015, 0.01], [0.38, 0.05, 0.26], 0.05);
    FINGERS.forEach((f) => {
      palm = smin(palm, capsule(p, new THREE.Vector3(0.8, -0.01, f.base[2] * 0.6), v(f.base), 0.07, f.rad[0] + 0.01), 0.08);
    });
    palm = smin(palm, ellip(p, [0.56, -0.1, 0.24], [0.22, 0.08, 0.13]), 0.08);
    for (let i = 0; i < 3; i++) palm = smin(palm, capsule(p, thumb[i], thumb[i + 1], THUMB_RAD[i], THUMB_RAD[i + 1]), 0.05);
    palm = smin(palm, capsule(p, wrist, elbow, 0.2, 0.26), 0.12);
    let d = palm, bone = 0, best = palm;
    for (let b = 1; b < BONES; b++) {
      const f = FINGERS[Math.floor((b - 1) / 3)];
      const s = (b - 1) % 3;
      const db = capsule(p, heads[b], tails[b], f.rad[s], f.rad[s + 1]);
      d = smin(d, db, 0.04);
      if (db < best) {
        best = db;
        bone = b;
      }
    }
    return [d, bone];
  };

  const local: number[] = [];
  const localN: number[] = [];
  const bones: number[] = [];
  const rnd: number[] = [];
  const fade: number[] = [];
  const scatter: number[] = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const q = new THREE.Vector3();
  const inv = new THREE.Quaternion();
  const e = 0.004;
  const R = 0.6 * Math.sqrt(4.2 / count);
  const grid = new Map<number, number[]>();
  const key = (i: number, j: number, k: number) => (i * 73856093) ^ (j * 19349663) ^ (k * 83492791);
  const crowded = (x: number, y: number, z: number) => {
    const ci = Math.floor(x / R), cj = Math.floor(y / R), ck = Math.floor(z / R);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (let c = -1; c <= 1; c++) {
          const cell = grid.get(key(ci + a, cj + b, ck + c));
          if (!cell) continue;
          for (let m = 0; m < cell.length; m += 3) {
            const dx = cell[m] - x, dy = cell[m + 1] - y, dz = cell[m + 2] - z;
            if (dx * dx + dy * dy + dz * dz < R * R) return true;
          }
        }
    return false;
  };

  let guard = 0;
  while (bones.length < count && guard++ < count * 300) {
    p.set(rand() * 3.0 - 1.2, rand() * 0.84 - 0.48, rand() * 1.45 - 0.55);
    // the forearm thins out toward the edge of the frame
    if (p.x > 0.9 && rand() > 1 - 0.85 * smooth(0.9, 1.7, p.x)) continue;
    const [d] = field(p);
    if (Math.abs(d) > 0.014) continue;
    n.set(field(q.set(p.x + e, p.y, p.z))[0] - field(q.set(p.x - e, p.y, p.z))[0], field(q.set(p.x, p.y + e, p.z))[0] - field(q.set(p.x, p.y - e, p.z))[0], field(q.set(p.x, p.y, p.z + e))[0] - field(q.set(p.x, p.y, p.z - e))[0]).normalize();
    p.addScaledVector(n, -d);
    if (crowded(p.x, p.y, p.z)) continue;
    const k = key(Math.floor(p.x / R), Math.floor(p.y / R), Math.floor(p.z / R));
    const cell = grid.get(k);
    if (cell) cell.push(p.x, p.y, p.z);
    else grid.set(k, [p.x, p.y, p.z]);

    const [, bone] = field(p);
    inv.copy(rots[bone]).invert();
    q.copy(p).sub(heads[bone]).applyQuaternion(inv);
    local.push(q.x, q.y, q.z);
    q.copy(n).applyQuaternion(inv);
    localN.push(q.x, q.y, q.z);
    bones.push(bone);
    rnd.push(rand());
    fade.push(1 - smooth(0.85, 1.65, p.x));
    const a = rand() * Math.PI * 2, u = rand() * 2 - 1, r = 0.6 + rand() * 1.4;
    scatter.push(Math.sqrt(1 - u * u) * Math.cos(a) * r, u * r, Math.sqrt(1 - u * u) * Math.sin(a) * r);
  }
  return {
    count: bones.length,
    local: new Float32Array(local),
    localN: new Float32Array(localN),
    bone: new Uint8Array(bones),
    rand: new Float32Array(rnd),
    fade: new Float32Array(fade),
    scatter: new Float32Array(scatter),
  };
}

const skinVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uContact;
  uniform float uReveal;
  uniform float uScanX;
  attribute vec3 aNormal;
  attribute float aRand;
  attribute float aFade;
  attribute vec3 aScatter;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = smoothstep(aRand * 0.5, aRand * 0.5 + 0.5, uReveal);
    vec3 p = position + aScatter * (1.0 - r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vec3 n = normalize(normalMatrix * aNormal);
    float facing = dot(n, normalize(-mv.xyz));
    float fres = pow(1.0 - abs(facing), 1.5);
    float nearSide = 0.12 + 0.88 * smoothstep(-0.2, 0.35, facing);
    float scan = smoothstep(0.07, 0.0, abs(position.x - uScanX));
    float tw = 0.75 + 0.25 * sin(uTime * 1.6 + aRand * 60.0);
    vec3 cool = mix(vec3(0.1, 0.42, 0.72), vec3(0.45, 0.93, 1.0), 0.25 + 0.75 * fres);
    vec3 warm = mix(vec3(0.55, 0.24, 0.05), vec3(1.0, 0.76, 0.36), 0.25 + 0.75 * fres);
    vColor = mix(cool, warm, uContact) + scan * vec3(0.5, 0.85, 1.0);
    vAlpha = ((0.42 + 0.6 * fres) * nearSide * tw + scan * 0.4) * aFade * r;
    gl_PointSize = uSize * (0.6 + aRand * 0.8) * (1.0 + scan * 0.7) * uPixelRatio / -mv.z;
  }
`;
const glowVert = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vColor = aColor;
    vAlpha = aAlpha;
    gl_PointSize = uSize * (0.5 + aAlpha) * uPixelRatio / -mv.z;
  }
`;
const pointFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = pow(smoothstep(0.5, 0.0, d), 1.6);
    gl_FragColor = vec4(vColor * (0.8 + core), core * vAlpha);
  }
`;

const STREAM = 220;
const SIGNALS = 5;
const CYAN = new THREE.Color("#4fe3ff");
const AMBER = new THREE.Color("#ffb547");

type Tap = { x: number; y: number; at: number };
const WHITE_HOT = new THREE.Color("#fff1d6");
const WRIST_V = v(WRIST);
const THUMB_V = THUMB.map(v);
const RADIUS: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(0.84, -0.02, 0.1), new THREE.Vector3(1.5, -0.04, 0.09)];
const ULNA: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(0.84, -0.02, -0.08), new THREE.Vector3(1.5, -0.04, -0.1)];

function Hand({ onContact, hover, tapAt }: { onContact: () => void; hover: React.RefObject<boolean>; tapAt: React.RefObject<Tap | null> }) {
  const data = useMemo(() => buildHand(7200), []);
  const { camera, pointer, size, gl } = useThree();
  const coarse = useMemo(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches, []);

  const heads = useMemo(() => Array.from({ length: BONES }, () => new THREE.Vector3()), []);
  const rots = useMemo(() => Array.from({ length: BONES }, () => new THREE.Quaternion()), []);
  const tips = useMemo(() => FINGERS.map(() => new THREE.Vector3()), []);
  const curls = useMemo(() => FINGERS.map((f) => [...f.rest]), []);

  const skin = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(data.count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aNormal", new THREE.BufferAttribute(new Float32Array(data.count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aRand", new THREE.BufferAttribute(data.rand, 1));
    g.setAttribute("aFade", new THREE.BufferAttribute(data.fade, 1));
    g.setAttribute("aScatter", new THREE.BufferAttribute(data.scatter, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0.6, 0, 0), 3);
    return g;
  }, [data]);
  const skinMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skinVert,
        fragmentShader: pointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: 24 },
          uContact: { value: 0 },
          uReveal: { value: 0 },
          uScanX: { value: 9 },
        },
      }),
    [],
  );

  // skeleton: bones as lines, joints and travelling signals as glowing nodes
  const boneLines = useMemo(() => {
    const segs = 4 + FINGERS.length * 4 + 3 + 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs * 6), 3).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.LineBasicMaterial({ color: CYAN.clone(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const l = new THREE.LineSegments(g, m);
    l.frustumCulled = false;
    return l;
  }, []);
  const JOINTS = 1 + FINGERS.length * 4 + THUMB.length;
  const nodes = useMemo(() => {
    const n = JOINTS + SIGNALS;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0.6, 0, 0), 3);
    return g;
  }, [JOINTS]);
  const nodeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: pointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPixelRatio: { value: 1 }, uSize: { value: 70 } },
      }),
    [],
  );
  // the stream that reaches for the cursor (in world space, outside the hand group)
  const stream = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(STREAM * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(STREAM), 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(STREAM * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
    return g;
  }, []);
  const streamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: pointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPixelRatio: { value: 1 }, uSize: { value: 26 } },
      }),
    [],
  );
  const ring = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  useEffect(() => {
    const pr = gl.getPixelRatio();
    skinMat.uniforms.uPixelRatio.value = pr;
    nodeMat.uniforms.uPixelRatio.value = pr;
    streamMat.uniforms.uPixelRatio.value = pr;
  }, [gl, size, skinMat, nodeMat, streamMat]);

  const st = useRef({ reveal: 0, near: 0, contact: 0, contacted: false, ring: 0, scanAt: 1.2 });
  const tipWorld = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const streamU = useMemo(() => Float32Array.from({ length: STREAM }, (_, i) => i / STREAM), []);

  useFrame((state, dt) => {
    const s = st.current;
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    dt = Math.min(dt, 0.05);

    // frame the hand to the canvas: fingertip toward the left third
    const aspect = size.width / Math.max(1, size.height);
    const sc = THREE.MathUtils.clamp(aspect / 1.15, 0.66, 1);
    g.scale.setScalar(sc);

    // where the fingertip is on screen, and how close the cursor is
    tipWorld.copy(tips[0]).applyMatrix4(g.matrixWorld);
    ndc.copy(tipWorld).project(camera);
    let px = pointer.x, py = pointer.y;
    let active = !!hover.current;
    const tap = tapAt.current;
    const tapped = !!tap && performance.now() - tap.at < 220;
    if (coarse) {
      // touch: a virtual hand drifts toward the tip; a tap near it makes contact
      const k = 0.5 + 0.5 * Math.sin(t * 0.7);
      px = ndc.x - 0.55 + k * 0.32;
      py = ndc.y + 0.06 * Math.sin(t * 1.1);
      active = true;
      if (tapped && tap) {
        px = tap.x;
        py = tap.y;
      }
    }
    const dx = (px - ndc.x) * (size.width / 2);
    const dy = (py - ndc.y) * (size.height / 2);
    const dist = Math.hypot(dx, dy);
    const nearT = active ? 1 - smooth(60, 340, dist) : 0;
    s.near += (nearT - s.near) * Math.min(1, dt * 4);
    const touching = active && (coarse ? tapped && dist < 90 : dist < 46);
    if (touching && !s.contacted) {
      s.contacted = true;
      s.ring = 1;
      onContact();
    }
    s.contact += ((s.contacted ? 1 : 0) - s.contact) * Math.min(1, dt * 1.6);

    // pose: a slow breath; the index straightens and the others close as the cursor nears
    for (let f = 0; f < FINGERS.length; f++) {
      const rest = FINGERS[f].rest;
      const breath = Math.sin(t * 0.9 + f * 0.7) * 0.025;
      for (let k = 0; k < 3; k++) curls[f][k] = rest[k] + breath + (f === 0 ? -0.04 * s.near : 0.12 * s.near * (k === 0 ? 0.6 : 1));
    }
    solve(curls, heads, rots, tips);

    g.position.set(0.3 - s.near * 0.1, 0.16 + Math.sin(t * 0.6) * 0.03, 0);
    g.rotation.set(0.78 + Math.sin(t * 0.4) * 0.03, 0.3 + Math.sin(t * 0.5) * 0.03, -0.1 + (py - ndc.y) * 0.18 * s.near);

    // skin the points
    const pos = skin.attributes.position as THREE.BufferAttribute;
    const nor = skin.attributes.aNormal as THREE.BufferAttribute;
    const pa = pos.array as Float32Array, na = nor.array as Float32Array;
    const L = data.local, N = data.localN, B = data.bone;
    for (let i = 0; i < data.count; i++) {
      const q = rots[B[i]], h = heads[B[i]];
      tmp.set(L[i * 3], L[i * 3 + 1], L[i * 3 + 2]).applyQuaternion(q);
      pa[i * 3] = tmp.x + h.x;
      pa[i * 3 + 1] = tmp.y + h.y;
      pa[i * 3 + 2] = tmp.z + h.z;
      tmp.set(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]).applyQuaternion(q);
      na[i * 3] = tmp.x;
      na[i * 3 + 1] = tmp.y;
      na[i * 3 + 2] = tmp.z;
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;

    s.reveal = Math.min(1, s.reveal + dt * 0.55);
    if (t > s.scanAt) {
      skinMat.uniforms.uScanX.value -= dt * 1.4;
      if (skinMat.uniforms.uScanX.value < -1.3) {
        skinMat.uniforms.uScanX.value = 2.2;
        s.scanAt = t + 4.5;
      }
    }
    skinMat.uniforms.uTime.value = t;
    skinMat.uniforms.uReveal.value = s.reveal;
    skinMat.uniforms.uContact.value = s.contact;
    col.copy(CYAN).lerp(AMBER, s.contact);
    (boneLines.material as THREE.LineBasicMaterial).color.copy(col);
    (boneLines.material as THREE.LineBasicMaterial).opacity = 0.5 * s.reveal;

    // skeleton lines
    const lp = boneLines.geometry.attributes.position as THREE.BufferAttribute;
    let li = 0;
    const seg = (a: THREE.Vector3, b: THREE.Vector3) => {
      lp.setXYZ(li++, a.x, a.y, a.z);
      lp.setXYZ(li++, b.x, b.y, b.z);
    };
    const wrist = WRIST_V;
    FINGERS.forEach((f, fi) => {
      seg(wrist, heads[1 + fi * 3]);
      for (let k = 0; k < 3; k++) seg(heads[1 + fi * 3 + k], k < 2 ? heads[2 + fi * 3 + k] : tips[fi]);
    });
    for (let k = 0; k < 3; k++) seg(THUMB_V[k], THUMB_V[k + 1]);
    seg(wrist, THUMB_V[0]);
    // radius and ulna, running off into the forearm
    seg(RADIUS[0], RADIUS[1]);
    seg(ULNA[0], ULNA[1]);
    lp.needsUpdate = true;

    // joint nodes and signals running wrist → index fingertip
    const np = nodes.attributes.position as THREE.BufferAttribute;
    const nal = nodes.attributes.aAlpha as THREE.BufferAttribute;
    const nc = nodes.attributes.aColor as THREE.BufferAttribute;
    let ni = 0;
    const node = (p: THREE.Vector3, a: number, c: THREE.Color) => {
      np.setXYZ(ni, p.x, p.y, p.z);
      nal.setX(ni, a * s.reveal);
      nc.setXYZ(ni, c.r, c.g, c.b);
      ni++;
    };
    node(wrist, 0.5, col);
    FINGERS.forEach((_, fi) => {
      for (let k = 0; k < 3; k++) node(heads[1 + fi * 3 + k], 0.42, col);
      node(tips[fi], fi === 0 ? 0.9 + s.near * 0.6 + Math.sin(t * 5) * 0.08 : 0.3, fi === 0 ? AMBER : col);
    });
    THUMB_V.forEach((j) => node(j, 0.32, col));
    const path = [wrist, heads[1], heads[2], heads[3], tips[0]];
    const speed = 0.35 + s.near * 0.6 + s.contact * 0.3;
    for (let k = 0; k < SIGNALS; k++) {
      const u = (t * speed + k / SIGNALS) % 1;
      const fpos = u * (path.length - 1);
      const i0 = Math.floor(fpos);
      tmp.copy(path[i0]).lerp(path[Math.min(path.length - 1, i0 + 1)], fpos - i0);
      node(tmp, 0.75 * Math.sin(u * Math.PI), AMBER);
    }
    np.needsUpdate = nal.needsUpdate = nc.needsUpdate = true;

    // the stream: from the fingertip to the cursor, at the fingertip's depth
    tipWorld.copy(tips[0]).applyMatrix4(g.matrixWorld);
    ndc.copy(tipWorld).project(camera);
    target.set(px, py, ndc.z).unproject(camera);
    const sp = stream.attributes.position as THREE.BufferAttribute;
    const sa = stream.attributes.aAlpha as THREE.BufferAttribute;
    const scl = stream.attributes.aColor as THREE.BufferAttribute;
    const show = Math.max(s.near, s.contact * 0.55) * s.reveal;
    const flow = 0.25 + s.near * 0.5;
    const len = tipWorld.distanceTo(target);
    for (let i = 0; i < STREAM; i++) {
      streamU[i] = (streamU[i] + dt * flow * (0.6 + ((i * 37) % 11) / 11)) % 1;
      // the stream only reaches as far as the cursor is close
      const u = streamU[i] * (0.35 + 0.65 * s.near);
      const wob = Math.sin(u * Math.PI) * (0.05 + 0.06 * (1 - s.near)) * Math.min(1, len);
      const ph = i * 2.39996 + t * 2.2;
      tmp.copy(tipWorld).lerp(target, u);
      tmp.x += Math.cos(ph) * wob;
      tmp.y += Math.sin(ph) * wob + Math.sin(u * Math.PI) * 0.06;
      tmp.z += Math.sin(ph * 0.7) * wob;
      sp.setXYZ(i, tmp.x, tmp.y, tmp.z);
      sa.setX(i, show * Math.sin(streamU[i] * Math.PI) * 0.9);
      scl.setXYZ(i, AMBER.r + (WHITE_HOT.r - AMBER.r) * u, AMBER.g + (WHITE_HOT.g - AMBER.g) * u, AMBER.b + (WHITE_HOT.b - AMBER.b) * u);
    }
    sp.needsUpdate = sa.needsUpdate = scl.needsUpdate = true;

    // contact pulse ring
    if (ring.current) {
      s.ring = Math.max(0, s.ring - dt * 0.7);
      ring.current.position.copy(tipWorld);
      ring.current.quaternion.copy(camera.quaternion);
      const k = 1 - s.ring;
      ring.current.scale.setScalar(0.04 + k * 0.42);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = s.ring * 0.9;
    }
  });

  return (
    <>
      <group ref={group}>
        <points geometry={skin} material={skinMat} frustumCulled={false} />
        <primitive object={boneLines} />
        <points geometry={nodes} material={nodeMat} frustumCulled={false} />
      </group>
      <points geometry={stream} material={streamMat} frustumCulled={false} />
      <mesh ref={ring}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial color="#ffb547" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}

export default function HoloHandCanvas({ onContact }: { onContact: () => void }) {
  const hover = useRef(false);
  const tapAt = useRef<Tap | null>(null);
  return (
    <div
      className="absolute inset-0"
      onPointerEnter={() => (hover.current = true)}
      onPointerLeave={() => (hover.current = false)}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        const b = e.currentTarget.getBoundingClientRect();
        tapAt.current = { x: ((e.clientX - b.left) / b.width) * 2 - 1, y: -((e.clientY - b.top) / b.height) * 2 + 1, at: performance.now() };
      }}
    >
      <Stage className="absolute inset-0" camera={{ position: [0, 0.15, 2.95], fov: 36 }} dpr={[1, 1.75]}>
        <Hand onContact={onContact} hover={hover} tapAt={tapAt} />
      </Stage>
    </div>
  );
}
