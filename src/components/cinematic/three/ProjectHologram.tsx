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

/* ───────────── Cue Court Coffee: court, rally, revenue, coffee ───────────── */
function CourtModel() {
  const ball = useRef<THREE.Mesh>(null);
  const bars = useRef<THREE.Group>(null);
  const steam = useRef<THREE.Points>(null);
  const court = useMemo(() => {
    const W = 1.9, D = 1.0, pts: number[] = [];
    const rect = (x0: number, z0: number, x1: number, z1: number) => pts.push(x0, 0, z0, x1, 0, z0, x1, 0, z0, x1, 0, z1, x1, 0, z1, x0, 0, z1, x0, 0, z1, x0, 0, z0);
    rect(-W / 2, -D / 2, W / 2, D / 2);
    rect(-W / 2 + 0.1, -D / 2 + 0.1, W / 2 - 0.1, D / 2 - 0.1);
    pts.push(-0.45, 0, -D / 2 + 0.1, -0.45, 0, D / 2 - 0.1, 0.45, 0, -D / 2 + 0.1, 0.45, 0, D / 2 - 0.1);
    pts.push(-W / 2 + 0.1, 0, 0, -0.45, 0, 0, 0.45, 0, 0, W / 2 - 0.1, 0, 0);
    // net
    for (let i = 0; i <= 8; i++) {
      const z = -D / 2 + (i / 8) * D;
      pts.push(0, 0, z, 0, 0.26, z);
    }
    pts.push(0, 0.26, -D / 2, 0, 0.26, D / 2, 0, 0.13, -D / 2, 0, 0.13, D / 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const cup = useMemo(() => {
    const prof = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.09, 0), new THREE.Vector2(0.11, 0.02), new THREE.Vector2(0.13, 0.2), new THREE.Vector2(0.135, 0.22)];
    return new THREE.WireframeGeometry(new THREE.LatheGeometry(prof, 14));
  }, []);
  const steamGeo = useMemo(() => {
    const arr = new Float32Array(40 * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  const barGeo = useMemo(() => new THREE.BoxGeometry(0.12, 1, 0.12), []);
  const barEdges = useMemo(() => edgeLines(barGeo), [barGeo]);
  const values = useMemo(() => [0.35, 0.5, 0.42, 0.62, 0.55, 0.88, 0.96], []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ball.current) {
      const p = (t * 0.55) % 1;
      const dir = Math.floor(t * 0.55) % 2 === 0 ? 1 : -1;
      const x = dir * (-0.75 + p * 1.5);
      ball.current.position.set(x, 0.05 + Math.sin(p * Math.PI) * 0.62, Math.sin(t * 0.9) * 0.28);
    }
    if (bars.current)
      bars.current.children.forEach((c, i) => {
        const h = values[i] * (0.75 + 0.25 * Math.sin(t * 0.8 + i));
        c.scale.y = h;
        c.position.y = h / 2;
      });
    if (steam.current) {
      const a = steam.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) {
        const life = (t * 0.35 + i / a.count) % 1;
        a.setXYZ(i, Math.sin(life * 9 + i) * 0.04, 0.24 + life * 0.45, Math.cos(life * 7 + i) * 0.04);
      }
      a.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0.25, 0]} rotation={[0, 0.2, 0]}>
      <lineSegments geometry={court} material={lineMat("#4fe3ff", 0.8)} />
      <mesh ref={ball}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#ffb547" />
      </mesh>
      <group ref={bars} position={[-0.72, 0, -0.78]}>
        {values.map((_, i) => (
          <group key={i} position={[i * 0.24, 0, 0]}>
            <lineSegments geometry={barEdges} material={lineMat(i === values.length - 1 ? "#ffb547" : "#4fe3ff", 0.75)} />
          </group>
        ))}
      </group>
      <group position={[0.82, 0, 0.62]}>
        <lineSegments geometry={cup} material={lineMat("#ffb547", 0.55)} />
        <points ref={steam} geometry={steamGeo}>
          <pointsMaterial size={0.02} color="#e2fbff" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
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
        <Materialize active={active === "cuecourt"}>
          <CourtModel />
        </Materialize>
      </Rig>
      <ProjectorBase scale={0.95} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.75} luminanceThreshold={0.12} luminanceSmoothing={0.4} mipmapBlur radius={0.55} />
      </EffectComposer>
    </>
  );
}

