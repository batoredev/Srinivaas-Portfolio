"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Project } from "@/data/content";
import { mulberry32 } from "@/lib/random";
import { ProjectorBase } from "./holo";

const AMBER = new THREE.Color("#ffb547");
const DIM = new THREE.Color("#0f3a4a");

function edgeLines(geo: THREE.BufferGeometry) {
  return new THREE.EdgesGeometry(geo);
}

const lineMat = (color = "#4fe3ff", opacity = 0.7) =>
  new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

/** Scales a model up out of the projector (and back down when inactive). */
function Materialize({ active, children }: { active: boolean; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const p = useRef(active ? 1 : 0);
  useFrame((_, d) => {
    const target = active ? 1 : 0;
    p.current += (target - p.current) * Math.min(1, d * (active ? 2.4 : 5));
    const e = 1 - Math.pow(1 - p.current, 3);
    if (!g.current) return;
    g.current.visible = p.current > 0.01;
    g.current.scale.set(0.85 + 0.15 * e, Math.max(0.001, e), 0.85 + 0.15 * e);
  });
  return (
    <group ref={g} position={[0, -1.02, 0]}>
      {children}
    </group>
  );
}

/* ───────────── Perfect Study Space: branches as floors, desks as check-ins ───────────── */
function StudyModel() {
  const floors = [0.18, 0.72, 1.26];
  const cols = 6, rows = 3;
  const count = floors.length * cols * rows;
  const inst = useRef<THREE.InstancedMesh>(null);
  const lit = useRef<boolean[]>(Array.from({ length: count }, (_, i) => i % 3 === 0));
  const acc = useRef(0);
  const slab = useMemo(() => new THREE.BoxGeometry(1.8, 0.035, 1.05), []);
  const slabEdges = useMemo(() => edgeLines(slab), [slab]);
  const desk = useMemo(() => new THREE.BoxGeometry(0.16, 0.07, 0.12), []);
  const mats = useMemo(() => ({ edge: lineMat("#4fe3ff", 0.8), fill: new THREE.MeshBasicMaterial({ color: "#4fe3ff", transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }) }), []);
  const deskMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const beams = useMemo(() => {
    const pts: number[] = [];
    for (const [x, z] of [[-0.9, -0.52], [0.9, -0.52], [-0.9, 0.52], [0.9, 0.52]]) pts.push(x, 0.05, z, x, 1.5, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, d) => {
    const mesh = inst.current;
    if (!mesh) return;
    acc.current += d;
    if (acc.current > 0.18) {
      acc.current = 0;
      const i = Math.floor(Math.random() * count);
      lit.current[i] = !lit.current[i];
    }
    let k = 0;
    for (const y of floors)
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++) {
          m.makeTranslation(-0.65 + c * 0.26, y + 0.055, -0.3 + r * 0.3);
          mesh.setMatrixAt(k, m);
          mesh.setColorAt(k, lit.current[k] ? AMBER : DIM);
          k++;
        }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {floors.map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh geometry={slab} material={mats.fill} />
          <lineSegments geometry={slabEdges} material={mats.edge} />
        </group>
      ))}
      <lineSegments geometry={beams} material={lineMat("#9ef3ff", 0.35)} />
      <instancedMesh ref={inst} args={[desk, deskMat, count]} />
    </group>
  );
}

/* ───────────── Harmony Living: 12 floors × 6 units = 72 ───────────── */
function TowerModel() {
  const floors = 12, perRow = 3, depth = 2;
  const count = floors * perRow * depth;
  const inst = useRef<THREE.InstancedMesh>(null);
  const lit = useRef<boolean[]>(Array.from({ length: count }, (_, i) => (i * 7) % 5 < 2));
  const acc = useRef(0);
  const unit = useMemo(() => new THREE.BoxGeometry(0.19, 0.12, 0.19), []);
  const unitMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const shell = useMemo(() => edgeLines(new THREE.BoxGeometry(0.78, 1.98, 0.54)), []);
  const floorLines = useMemo(() => {
    const pts: number[] = [];
    for (let f = 0; f <= floors; f++) {
      const y = 0.06 + f * 0.155;
      pts.push(-0.39, y, -0.27, 0.39, y, -0.27, 0.39, y, -0.27, 0.39, y, 0.27, 0.39, y, 0.27, -0.39, y, 0.27, -0.39, y, 0.27, -0.39, y, -0.27);
    }
    pts.push(0, 2.05, 0, 0, 2.45, 0);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const beacon = useRef<THREE.Mesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame((s, d) => {
    const mesh = inst.current;
    if (!mesh) return;
    acc.current += d;
    if (acc.current > 0.12) {
      acc.current = 0;
      const i = Math.floor(Math.random() * count);
      lit.current[i] = !lit.current[i];
    }
    let k = 0;
    for (let f = 0; f < floors; f++)
      for (let x = 0; x < perRow; x++)
        for (let z = 0; z < depth; z++) {
          m.makeTranslation(-0.24 + x * 0.24, 0.135 + f * 0.155, -0.12 + z * 0.24);
          mesh.setMatrixAt(k, m);
          mesh.setColorAt(k, lit.current[k] ? AMBER : DIM);
          k++;
        }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (beacon.current) (beacon.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.6 * (Math.sin(s.clock.elapsedTime * 4) > 0 ? 1 : 0);
  });
  return (
    <group>
      <lineSegments geometry={shell} material={lineMat("#4fe3ff", 0.5)} position={[0, 1.05, 0]} />
      <lineSegments geometry={floorLines} material={lineMat("#4fe3ff", 0.35)} />
      <instancedMesh ref={inst} args={[unit, unitMat, count]} />
      <mesh ref={beacon} position={[0, 2.47, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#ffb547" transparent />
      </mesh>
    </group>
  );
}

/* ───────────── Alpenglow Global: leads flying in from the world ───────────── */
function latLon(lat: number, lon: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

const arcVert = /* glsl */ `
  attribute float aT;
  attribute float aSeed;
  varying float vT;
  varying float vSeed;
  void main() { vT = aT; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const arcFrag = /* glsl */ `
  uniform float uTime;
  varying float vT;
  varying float vSeed;
  void main() {
    float head = fract(uTime * 0.28 + vSeed);
    float d = head - vT;
    float trail = d > 0.0 ? smoothstep(0.35, 0.0, d) : 0.0;
    vec3 col = mix(vec3(0.31, 0.89, 1.0), vec3(1.0, 0.71, 0.28), trail);
    gl_FragColor = vec4(col, 0.12 + trail * 0.9);
  }
`;

function GlobeModel() {
  const R = 0.78;
  const globe = useRef<THREE.Group>(null);
  const wire = useMemo(() => {
    const pts: number[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let i = 0; i < 64; i++) {
        const a = latLon(lat, (i / 64) * 360 - 180, R), b = latLon(lat, ((i + 1) / 64) * 360 - 180, R);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let i = 0; i < 48; i++) {
        const a = latLon((i / 48) * 180 - 90, lon, R), b = latLon(((i + 1) / 48) * 180 - 90, lon, R);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const dots = useMemo(() => {
    // a sparse dot sphere for texture
    const r = mulberry32(7);
    const arr: number[] = [];
    for (let i = 0; i < 900; i++) {
      const v = latLon(Math.asin(r() * 2 - 1) * (180 / Math.PI), r() * 360 - 180, R * 1.002);
      arr.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    return g;
  }, []);
  const home = useMemo(() => latLon(11.0, 76.96, R), []);
  const arcs = useMemo(() => {
    const dest: [number, number][] = [[25.2, 55.3], [48.86, 2.35], [1.35, 103.8], [47.37, 8.54], [35.68, 139.7], [-33.87, 151.2], [40.71, -74.0], [51.5, -0.12]];
    const pos: number[] = [], t: number[] = [], seed: number[] = [];
    dest.forEach(([la, lo], k) => {
      const a = latLon(la, lo, R), b = home;
      const segs = 48;
      for (let i = 0; i < segs; i++) {
        for (const j of [i, i + 1]) {
          const u = j / segs;
          const p = a.clone().lerp(b, u).normalize().multiplyScalar(R + Math.sin(u * Math.PI) * 0.28);
          pos.push(p.x, p.y, p.z);
          t.push(u);
          seed.push(k / dest.length);
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.Float32BufferAttribute(t, 1));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    return g;
  }, [home]);
  const arcMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: arcVert, fragmentShader: arcFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 } } }),
    [],
  );
  useFrame((s, d) => {
    arcMat.uniforms.uTime.value = s.clock.elapsedTime;
    if (globe.current) globe.current.rotation.y += d * 0.12;
  });
  return (
    <group position={[0, 1.05, 0]}>
      <group ref={globe} rotation={[0.35, -1.6, 0]}>
        <lineSegments geometry={wire} material={lineMat("#4fe3ff", 0.22)} />
        <points geometry={dots}>
          <pointsMaterial size={0.012} color="#9ef3ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
        <lineSegments geometry={arcs} material={arcMat} />
        <mesh position={home}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color="#ffb547" />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────── Bites by Batore: a city grid, pins awaiting human review ───────────── */
function BitesModel() {
  const PINS = 16;
  const pins = useMemo(() => {
    const r = mulberry32(42);
    return Array.from({ length: PINS }, () => {
      const a = r() * Math.PI * 2;
      const d = 0.18 + Math.sqrt(r()) * 0.86;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d * 0.8, h: 0.22 + r() * 0.32 };
    });
  }, []);
  const ground = useMemo(() => {
    const pts: number[] = [];
    const W = 1.15, step = 0.23;
    for (let v = -W; v <= W + 1e-6; v += step) pts.push(-W, 0, v, W, 0, v, v, 0, -W, v, 0, W);
    // a couple of arterial roads
    pts.push(-W, 0.002, -0.62, W, 0.002, 0.48, -0.4, 0.002, -W, 0.22, 0.002, W);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const stems = useMemo(() => {
    const pts: number[] = [];
    for (const p of pins) pts.push(p.x, 0, p.z, p.x, p.h, p.z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [pins]);
  const ring = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 96; i++) {
      const a0 = (i / 96) * Math.PI * 2, a1 = ((i + 1) / 96) * Math.PI * 2;
      pts.push(Math.cos(a0), 0, Math.sin(a0), Math.cos(a1), 0, Math.sin(a1));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const head = useMemo(() => new THREE.OctahedronGeometry(0.045, 0), []);
  const headMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const ringMat = useMemo(() => lineMat("#ffb547", 0.6), []);
  const inst = useRef<THREE.InstancedMesh>(null);
  const scan = useRef<THREE.LineSegments>(null);
  const radius = useRef<THREE.LineSegments>(null);
  const beam = useRef<THREE.Mesh>(null);
  const approved = useRef<boolean[]>(pins.map((_, i) => i % 4 === 0));
  const reviewing = useRef(1);
  const acc = useRef(0);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const PENDING = useMemo(() => new THREE.Color("#2a8fa8"), []);

  useFrame((s, d) => {
    const t = s.clock.elapsedTime;
    acc.current += d;
    if (acc.current > 0.7) {
      // a reviewer approves the current place, then moves to the next pending one
      acc.current = 0;
      approved.current[reviewing.current] = true;
      const next = approved.current.findIndex((a, i) => !a && i !== reviewing.current);
      if (next === -1) approved.current = pins.map((_, i) => i % 4 === 0);
      reviewing.current = next === -1 ? 1 : next;
    }
    const mesh = inst.current;
    if (mesh) {
      pins.forEach((p, i) => {
        const bob = i === reviewing.current ? Math.sin(t * 8) * 0.02 : 0;
        q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, t * 1.4 + i);
        m.compose(pos.set(p.x, p.h + 0.045 + bob, p.z), q, one);
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, approved.current[i] ? AMBER : PENDING);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    const p = pins[reviewing.current];
    if (beam.current) {
      beam.current.position.set(p.x, 0.5, p.z);
      (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin(t * 10);
    }
    if (scan.current) {
      const k = (t * 0.4) % 1;
      scan.current.scale.setScalar(0.1 + k * 1.05);
      (scan.current.material as THREE.LineBasicMaterial).opacity = 0.7 * (1 - k);
    }
    if (radius.current) radius.current.rotation.y = t * 0.15;
  });

  return (
    <group position={[0, 0.35, 0]} rotation={[0.18, 0, 0]}>
      <lineSegments geometry={ground} material={lineMat("#4fe3ff", 0.18)} />
      {/* "within 2 km" search radius and a sonar sweep */}
      <lineSegments ref={radius} geometry={ring} material={ringMat} scale={[0.72, 1, 0.72]} />
      <lineSegments ref={scan} geometry={ring} material={lineMat("#9ef3ff", 0.6)} />
      <lineSegments geometry={stems} material={lineMat("#9ef3ff", 0.45)} />
      <instancedMesh ref={inst} args={[head, headMat, PINS]} />
      {/* the place under human review */}
      <mesh ref={beam}>
        <cylinderGeometry args={[0.012, 0.012, 1, 6, 1, true]} />
        <meshBasicMaterial color="#ffb547" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* you are here */}
      <mesh position={[0, 0.06, 0]}>
        <coneGeometry args={[0.05, 0.12, 4]} />
        <meshBasicMaterial color="#ffb547" />
      </mesh>
    </group>
  );
}

/* ───────────── OurGlass: loose conversation falls through, structure collects ───────────── */
const NECK_Y = 1.05;
const GLASS_H = 2.1;
const glassRadius = (y: number) => {
  const u = Math.min(1, Math.abs(y - NECK_Y) / NECK_Y);
  return 0.05 + 0.55 * Math.pow(Math.sin((u * Math.PI) / 2), 0.9);
};

function HourglassModel() {
  const SAND = 700;
  const glass = useMemo(() => {
    const pts: number[] = [];
    const steps = 40;
    // meridians
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      for (let i = 0; i < steps; i++) {
        const y0 = (i / steps) * GLASS_H, y1 = ((i + 1) / steps) * GLASS_H;
        const r0 = glassRadius(y0), r1 = glassRadius(y1);
        pts.push(Math.cos(a) * r0, y0, Math.sin(a) * r0, Math.cos(a) * r1, y1, Math.sin(a) * r1);
      }
    }
    // rings
    for (const y of [0.12, 0.4, 0.75, 1.35, 1.7, 1.98]) {
      const r = glassRadius(y);
      for (let i = 0; i < 48; i++) {
        const a0 = (i / 48) * Math.PI * 2, a1 = ((i + 1) / 48) * Math.PI * 2;
        pts.push(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const frame = useMemo(() => {
    const pts: number[] = [];
    for (const y of [-0.04, GLASS_H + 0.04])
      for (let i = 0; i < 64; i++) {
        const a0 = (i / 64) * Math.PI * 2, a1 = ((i + 1) / 64) * Math.PI * 2;
        pts.push(Math.cos(a0) * 0.74, y, Math.sin(a0) * 0.74, Math.cos(a1) * 0.74, y, Math.sin(a1) * 0.74);
      }
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5;
      pts.push(Math.cos(a) * 0.74, -0.04, Math.sin(a) * 0.74, Math.cos(a) * 0.74, GLASS_H + 0.04, Math.sin(a) * 0.74);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const sand = useMemo(() => {
    const r = mulberry32(5);
    const seeds = Array.from({ length: SAND }, () => [r(), r(), r()] as const);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SAND * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(SAND * 3), 3));
    return { g, seeds };
  }, []);
  const cards = useRef<THREE.Group>(null);
  const card = useMemo(() => edgeLines(new THREE.PlaneGeometry(0.3, 0.18)), []);
  const CYAN = useMemo(() => new THREE.Color("#4fe3ff"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const pa = sand.g.attributes.position as THREE.BufferAttribute;
    const ca = sand.g.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < SAND; i++) {
      const [a, b, c] = sand.seeds[i];
      const ph = (t * 0.07 + a) % 1;
      const ang = b * Math.PI * 2 + t * 0.2;
      let x, y, z, mix;
      if (ph < 0.5) {
        // drifting loosely in the top bulb, funnelling toward the neck
        const k = ph / 0.5;
        y = 1.95 - (1.95 - NECK_Y - 0.05) * Math.pow(k, 1.6) - c * 0.25 * (1 - k);
        const rr = glassRadius(y) * 0.85 * Math.sqrt(c) * (1 - k * 0.8);
        x = Math.cos(ang) * rr;
        z = Math.sin(ang) * rr;
        mix = 0;
      } else if (ph < 0.58) {
        // the stream through the neck
        const k = (ph - 0.5) / 0.08;
        y = NECK_Y - k * 0.8;
        x = (c - 0.5) * 0.03;
        z = (b - 0.5) * 0.03;
        mix = k;
      } else {
        // settled into an ordered pile at the bottom
        const k = (ph - 0.58) / 0.42;
        const ring = Math.floor(c * 5);
        y = 0.04 + (4 - ring) * 0.055 + (1 - k) * 0.02;
        const rr = (ring + 0.5) * 0.09;
        const step = Math.round(b * 24) / 24;
        x = Math.cos(step * Math.PI * 2) * rr;
        z = Math.sin(step * Math.PI * 2) * rr;
        mix = 1;
      }
      pa.setXYZ(i, x, y, z);
      tmp.copy(CYAN).lerp(AMBER, mix);
      ca.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    pa.needsUpdate = true;
    ca.needsUpdate = true;
    if (cards.current)
      cards.current.children.forEach((c, i) => {
        const a = t * 0.35 + (i / 4) * Math.PI * 2;
        c.position.set(Math.cos(a) * 1.05, 0.45 + i * 0.32 + Math.sin(t * 1.3 + i) * 0.05, Math.sin(a) * 1.05);
        c.lookAt(0, c.position.y, 0);
      });
  });

  return (
    <group position={[0, 0.12, 0]}>
      <lineSegments geometry={glass} material={lineMat("#4fe3ff", 0.32)} />
      <lineSegments geometry={frame} material={lineMat("#9ef3ff", 0.5)} />
      <points geometry={sand.g}>
        <pointsMaterial size={0.022} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      {/* commitments, people, projects, reminders: the structure it extracts */}
      <group ref={cards}>
        {[0, 1, 2, 3].map((i) => (
          <lineSegments key={i} geometry={card} material={lineMat(i % 2 ? "#ffb547" : "#4fe3ff", 0.75)} />
        ))}
      </group>
    </group>
  );
}

function Rig({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    g.current.rotation.y = s.clock.elapsedTime * 0.18 + s.pointer.x * 0.35;
    g.current.rotation.x = -s.pointer.y * 0.06;
  });
  return <group ref={g}>{children}</group>;
}

export function ProjectHologramScene({ active }: { active: Project["id"] }) {
  return (
    <>
      <color attach="background" args={["#03070d"]} />
      <fog attach="fog" args={["#03070d", 4.5, 9]} />
      <Rig>
        <Materialize active={active === "pss"}>
          <StudyModel />
        </Materialize>
        <Materialize active={active === "harmony"}>
          <TowerModel />
        </Materialize>
        <Materialize active={active === "alpenglow"}>
          <GlobeModel />
        </Materialize>
        <Materialize active={active === "bites"}>
          <BitesModel />
        </Materialize>
        <Materialize active={active === "ourglass"}>
          <HourglassModel />
        </Materialize>
      </Rig>
      <ProjectorBase scale={0.95} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.75} luminanceThreshold={0.12} luminanceSmoothing={0.4} mipmapBlur radius={0.55} />
      </EffectComposer>
    </>
  );
}

