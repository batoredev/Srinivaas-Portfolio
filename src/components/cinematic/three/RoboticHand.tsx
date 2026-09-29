"use client";

import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage } from "./Stage";

/*
 * A procedural robotic right hand, palm down, index finger extended toward the
 * left ("The Creation of Adam"). The visitor's cursor plays the human hand:
 * bring it to the fingertip and an arc of energy closes the gap.
 */

type FingerSpec = { z: number; x: number; lengths: [number, number, number]; curl: [number, number, number]; spread: number };

const FINGERS: FingerSpec[] = [
  { z: 0.21, x: 0, lengths: [0.3, 0.2, 0.16], curl: [0.1, 0.12, 0.08], spread: -0.1 }, // index: the reach
  { z: 0.07, x: 0.02, lengths: [0.32, 0.21, 0.16], curl: [0.42, 0.5, 0.35], spread: -0.02 }, // middle
  { z: -0.08, x: 0.03, lengths: [0.3, 0.2, 0.15], curl: [0.62, 0.62, 0.42], spread: 0.07 }, // ring
  { z: -0.22, x: 0.07, lengths: [0.24, 0.16, 0.13], curl: [0.8, 0.7, 0.5], spread: 0.16 }, // pinky
];

function useMats() {
  return useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({ color: "#1a2530", metalness: 0.92, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
      plate: new THREE.MeshPhysicalMaterial({ color: "#9fb4c4", metalness: 0.95, roughness: 0.22, clearcoat: 1 }),
      joint: new THREE.MeshStandardMaterial({ color: "#0b1118", metalness: 0.7, roughness: 0.5 }),
      glow: new THREE.MeshBasicMaterial({ color: "#4fe3ff", toneMapped: false }),
      tip: new THREE.MeshBasicMaterial({ color: "#ffb547", toneMapped: false }),
    }),
    [],
  );
}

function Segment({ length, mats, ring = true }: { length: number; mats: ReturnType<typeof useMats>; ring?: boolean }) {
  // a phalanx along -x, starting at its joint
  return (
    <group>
      <mesh material={mats.joint}>
        <sphereGeometry args={[0.052, 20, 20]} />
      </mesh>
      {ring && (
        <mesh material={mats.glow} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.056, 0.006, 8, 32]} />
        </mesh>
      )}
      <mesh material={mats.shell} position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.043, length - 0.06, 6, 16]} />
      </mesh>
      <mesh material={mats.plate} position={[-length / 2, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.55]}>
        <capsuleGeometry args={[0.03, length - 0.1, 4, 12]} />
      </mesh>
    </group>
  );
}

function Finger({ spec, mats, curlRef, index }: { spec: FingerSpec; mats: ReturnType<typeof useMats>; curlRef: React.RefObject<number[]>; index: number }) {
  const j0 = useRef<THREE.Group>(null);
  const j1 = useRef<THREE.Group>(null);
  const j2 = useRef<THREE.Group>(null);
  useFrame((s) => {
    const extra = curlRef.current?.[index] ?? 0;
    const t = s.clock.elapsedTime;
    [j0.current, j1.current, j2.current].forEach((g, k) => {
      if (!g) return;
      const base = spec.curl[k] + extra * (k === 0 ? 0.6 : 1);
      g.rotation.z = base + Math.sin(t * 1.3 + index + k) * 0.025;
    });
  });
  const [l0, l1, l2] = spec.lengths;
  return (
    <group position={[spec.x, 0, spec.z]} rotation={[0, spec.spread, 0]}>
      <group ref={j0}>
        <Segment length={l0} mats={mats} />
        <group ref={j1} position={[-l0, 0, 0]}>
          <Segment length={l1} mats={mats} />
          <group ref={j2} position={[-l1, 0, 0]}>
            <Segment length={l2} mats={mats} ring={false} />
            {index === 0 && (
              <mesh material={mats.tip} position={[-l2 + 0.005, 0, 0]} name="fingertip">
                <sphereGeometry args={[0.03, 16, 16]} />
              </mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

const glowSpriteMat = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,220,160,1)");
  grad.addColorStop(0.25, "rgba(255,181,71,0.65)");
  grad.addColorStop(1, "rgba(255,122,26,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
};

function Hand({ onContact, hover }: { onContact: () => void; hover: React.RefObject<boolean> }) {
  const mats = useMats();
  const root = useRef<THREE.Group>(null);
  const tipWorld = useMemo(() => new THREE.Vector3(), []);
  const curl = useRef<number[]>([0, 0, 0, 0]);
  const glow = useRef<THREE.Sprite>(null);
  const contacted = useRef(false);
  const { camera, pointer, size, scene } = useThree();
  const spriteMat = useMemo(() => glowSpriteMat(), []);
  const arcGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    return g;
  }, []);
  const arcMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#fff1d6", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  const arcLine = useMemo(() => new THREE.Line(arcGeo, arcMat), [arcGeo, arcMat]);
  const cursor = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const tip = scene.getObjectByName("fingertip");
    if (!root.current || !tip) return;
    tip.getWorldPosition(tipWorld);

    // cursor in world space at the fingertip's depth
    ndc.copy(tipWorld).project(camera);
    cursor.set(pointer.x, pointer.y, ndc.z).unproject(camera);
    const dx = (pointer.x - ndc.x) * (size.width / 2);
    const dy = (pointer.y - ndc.y) * (size.height / 2);
    const dist = Math.hypot(dx, dy);
    const near = hover.current ? Math.max(0, 1 - dist / 260) : 0;

    // the hand leans toward the visitor, the other fingers tighten
    root.current.position.y = Math.sin(t * 0.8) * 0.04 + pointer.y * 0.12 * near;
    root.current.rotation.z = 0.16 + Math.sin(t * 0.6) * 0.02 - (pointer.y - ndc.y) * 0.25 * near;
    root.current.rotation.y = -0.35 + Math.sin(t * 0.5) * 0.03;
    root.current.rotation.x = -0.45 + Math.sin(t * 0.4) * 0.03;
    root.current.position.x = 0.35 - near * 0.18;
    curl.current = [-near * 0.05, near * 0.25, near * 0.25, near * 0.2];

    if (glow.current) {
      glow.current.position.copy(tipWorld);
      const sc = 0.14 + near * 0.3 + Math.sin(t * 4) * 0.015;
      glow.current.scale.set(sc, sc, sc);
    }

    // arc of energy when close
    const a = arcLine.geometry.attributes.position as THREE.BufferAttribute;
    const on = near > 0.72;
    arcMat.opacity += ((on ? 0.95 : 0) - arcMat.opacity) * 0.3;
    if (arcMat.opacity > 0.01) {
      for (let i = 0; i < a.count; i++) {
        const u = i / (a.count - 1);
        const jitter = Math.sin(u * Math.PI) * 0.06;
        a.setXYZ(
          i,
          THREE.MathUtils.lerp(tipWorld.x, cursor.x, u) + (Math.random() - 0.5) * jitter,
          THREE.MathUtils.lerp(tipWorld.y, cursor.y, u) + (Math.random() - 0.5) * jitter,
          THREE.MathUtils.lerp(tipWorld.z, cursor.z, u) + (Math.random() - 0.5) * jitter,
        );
      }
      a.needsUpdate = true;
    }
    if (on && !contacted.current) {
      contacted.current = true;
      onContact();
    }
  });

  return (
    <group>
      <group ref={root} position={[0.35, 0, 0]} rotation={[-0.45, -0.35, 0.16]}>
        {/* forearm */}
        <group position={[1.62, 0.02, 0]}>
          <mesh material={mats.shell} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.17, 1.5, 32]} />
          </mesh>
          {[-0.55, -0.2, 0.15, 0.5].map((x) => (
            <mesh key={x} material={x === -0.55 ? mats.glow : mats.plate} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.19, x === -0.55 ? 0.008 : 0.018, 10, 40]} />
            </mesh>
          ))}
          {[0.12, -0.12].map((z) => (
            <mesh key={z} material={mats.plate} position={[0, 0.17, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, 1.3, 10]} />
            </mesh>
          ))}
        </group>
        {/* wrist */}
        <mesh material={mats.joint} position={[0.9, 0, 0]}>
          <sphereGeometry args={[0.17, 28, 28]} />
        </mesh>
        <mesh material={mats.glow} position={[0.9, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.175, 0.007, 8, 48]} />
        </mesh>
        {/* palm */}
        <RoundedBox args={[0.62, 0.17, 0.6]} radius={0.06} smoothness={4} position={[0.47, 0, 0]} material={mats.shell} />
        <RoundedBox args={[0.46, 0.03, 0.44]} radius={0.012} smoothness={3} position={[0.47, 0.095, 0]} material={mats.plate} />
        <mesh material={mats.glow} position={[0.47, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.07, 0.085, 6]} />
        </mesh>
        {/* fingers from the knuckle line */}
        <group position={[0.15, 0, 0]}>
          {FINGERS.map((f, i) => (
            <Finger key={i} spec={f} mats={mats} curlRef={curl} index={i} />
          ))}
        </group>
        {/* thumb, tucked beneath */}
        <group position={[0.5, -0.07, 0.3]} rotation={[0.9, 0.9, 0.35]}>
          <Segment length={0.22} mats={mats} />
          <group position={[-0.22, 0, 0]} rotation={[0, 0, 0.45]}>
            <Segment length={0.17} mats={mats} ring={false} />
          </group>
        </group>
      </group>
      <sprite ref={glow} material={spriteMat} />
      <primitive object={arcLine} />
    </group>
  );
}

export default function RoboticHandCanvas({ onContact }: { onContact: () => void }) {
  const hover = useRef(false);
  return (
    <div className="absolute inset-0" onPointerEnter={() => (hover.current = true)} onPointerLeave={() => (hover.current = false)}>
    <Stage className="absolute inset-0" camera={{ position: [0, 0.25, 3.1], fov: 38 }} dpr={[1, 1.75]}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[2, 3, 3]} intensity={1.6} color="#dff8ff" />
      <directionalLight position={[-3, -1, -2]} intensity={1.2} color="#ffb547" />
      <pointLight position={[-1.2, 0.2, 1]} intensity={4} distance={4} color="#4fe3ff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#4fe3ff" position={[0, 3, 2]} scale={[6, 1, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[3, 0, 3]} scale={[1, 4, 1]} />
        <Lightformer form="ring" intensity={3} color="#ffb547" position={[-3, 1, -2]} scale={2} />
        <Lightformer form="rect" intensity={1} color="#1a4a66" position={[0, -3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
      </Environment>
      <Hand onContact={onContact} hover={hover} />
    </Stage>
    </div>
  );
}
