"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import { Stage } from "./Stage";

export const WEEKS = 26;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Illustrative activity pattern: busier weekdays, a few sprint weeks. */
export function skylineData() {
  const r = mulberry32(2026);
  const out: number[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const sprint = r() < 0.25 ? 1.6 : 1;
    for (let d = 0; d < 7; d++) {
      const weekday = d > 0 && d < 6 ? 1 : 0.45;
      const v = Math.max(0, Math.round((r() * 9 - 1.5) * weekday * sprint));
      out.push(Math.min(12, v));
    }
  }
  return out;
}

function Bars({ onHover }: { onHover: (label: string | null) => void }) {
  const data = useMemo(() => skylineData(), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const grow = useRef(0);
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.1, 1, 0.1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.92 }), []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const c = useMemo(() => new THREE.Color(), []);
  const low = useMemo(() => new THREE.Color("#0c3446"), []);
  const mid = useMemo(() => new THREE.Color("#4fe3ff"), []);
  const high = useMemo(() => new THREE.Color("#ffb547"), []);
  const plate = useMemo(() => {
    const pts: number[] = [];
    const w = WEEKS * 0.13, d = 7 * 0.13;
    for (let i = 0; i <= WEEKS; i++) pts.push(-w / 2 + i * 0.13 - 0.065, 0, -d / 2 - 0.065, -w / 2 + i * 0.13 - 0.065, 0, d / 2 - 0.065);
    for (let j = 0; j <= 7; j++) pts.push(-w / 2 - 0.065, 0, -d / 2 + j * 0.13 - 0.065, w / 2 - 0.065, 0, -d / 2 + j * 0.13 - 0.065);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useFrame((s, dt) => {
    grow.current = Math.min(1, grow.current + dt * 0.7);
    const e = 1 - Math.pow(1 - grow.current, 3);
    const mm = mesh.current;
    if (mm) {
      for (let w = 0; w < WEEKS; w++)
        for (let d = 0; d < 7; d++) {
          const i = w * 7 + d;
          const v = data[i];
          const delay = w / WEEKS;
          const k = Math.max(0, Math.min(1, (e - delay * 0.6) / 0.4));
          const h = 0.015 + v * 0.075 * k;
          m.makeScale(1, h, 1);
          m.setPosition(-((WEEKS - 1) * 0.13) / 2 + w * 0.13, 0, -(6 * 0.13) / 2 + d * 0.13);
          mm.setMatrixAt(i, m);
          const t = v / 12;
          if (t < 0.5) c.copy(low).lerp(mid, t * 2);
          else c.copy(mid).lerp(high, (t - 0.5) * 2);
          mm.setColorAt(i, c);
        }
      mm.instanceMatrix.needsUpdate = true;
      if (mm.instanceColor) mm.instanceColor.needsUpdate = true;
    }
    if (group.current) {
      group.current.rotation.y = -0.55 + Math.sin(s.clock.elapsedTime * 0.15) * 0.25 + s.pointer.x * 0.3;
      group.current.rotation.x = 0.1 - s.pointer.y * 0.08;
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={plate}>
        <lineBasicMaterial color="#4fe3ff" transparent opacity={0.18} />
      </lineSegments>
      <instancedMesh
        ref={mesh}
        args={[geo, mat, WEEKS * 7]}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          const i = e.instanceId;
          if (i == null) return;
          const w = Math.floor(i / 7), d = i % 7;
          onHover(`Week ${w + 1} · ${DAYS[d]} · ${data[i]} contribution${data[i] === 1 ? "" : "s"}`);
        }}
        onPointerOut={() => onHover(null)}
      />
    </group>
  );
}

export default function SkylineCanvas({ onHover }: { onHover: (label: string | null) => void }) {
  return (
    <Stage className="absolute inset-0" camera={{ position: [0, 2.3, 4.3], fov: 40 }} dpr={[1, 1.5]}>
      <Bars onHover={onHover} />
    </Stage>
  );
}
