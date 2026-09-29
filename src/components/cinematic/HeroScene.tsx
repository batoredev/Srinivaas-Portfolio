"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import { Color, Vector3 } from "three";

function NeuralCore() {
  const group = useRef<Group>(null);
  const nodes = useMemo(() => {
    const pts: Vector3[] = [];
    const count = 72;
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      pts.push(new Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).multiplyScalar(1.35));
    }
    return pts;
  }, []);

  const links = useMemo(() => {
    const pairs: [Vector3, Vector3][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 0.72) {
          pairs.push([nodes[i], nodes[j]]);
        }
      }
    }
    return pairs;
  }, [nodes]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      group.current.rotation.x = Math.sin(Date.now() * 0.0004) * 0.12;
    }
  });

  return (
    <group ref={group}>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial
            color={i % 7 === 0 ? "#ffb86b" : "#7dffd4"}
            emissive={i % 7 === 0 ? "#ffb86b" : "#1affe0"}
            emissiveIntensity={1.4}
          />
        </mesh>
      ))}
      {links.map((seg, i) => (
        <Line
          key={i}
          points={seg}
          color="#7dffd4"
          lineWidth={0.6}
          transparent
          opacity={0.35}
        />
      ))}
      <mesh>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial
          color="#041410"
          emissive="#1affe0"
          emissiveIntensity={0.4}
          wireframe
        />
      </mesh>
    </group>
  );
}

function RoboticHand() {
  const arm = useRef<Group>(null);
  const finger = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (arm.current) {
      arm.current.rotation.z = -0.4 + Math.sin(t * 0.7) * 0.12;
      arm.current.rotation.y = Math.sin(t * 0.35) * 0.2;
    }
    if (finger.current) {
      finger.current.rotation.x = 0.4 + Math.sin(t * 2.1) * 0.25;
    }
  });

  const metal = {
    color: new Color("#8aa8a2"),
    metalness: 0.85,
    roughness: 0.25,
    emissive: new Color("#12332c"),
    emissiveIntensity: 0.4,
  };

  return (
    <group ref={arm} position={[2.1, -0.55, 0.4]} rotation={[0.2, -0.6, -0.3]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1.2, 8]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.55, 0.18, 0.32]} />
        <meshStandardMaterial {...metal} color="#6f8f88" />
      </mesh>
      {[ -0.2, -0.07, 0.07, 0.2 ].map((x, i) => (
        <group key={i} position={[x, -0.12, 0.02]}>
          <mesh>
            <boxGeometry args={[0.07, 0.28, 0.08]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh ref={i === 1 ? finger : undefined} position={[0, -0.26, 0.02]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.06, 0.22, 0.07]} />
            <meshStandardMaterial
              color="#7dffd4"
              emissive="#1affe0"
              emissiveIntensity={0.8}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HoloRings() {
  const ref = useRef<Group>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.z += d * 0.25;
  });
  return (
    <group ref={ref} rotation={[Math.PI / 2.4, 0.2, 0]}>
      <mesh>
        <torusGeometry args={[1.85, 0.012, 8, 80]} />
        <meshBasicMaterial color="#7dffd4" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[0.4, 0.2, 0.6]}>
        <torusGeometry args={[2.15, 0.008, 8, 90]} />
        <meshBasicMaterial color="#ffb86b" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5.2], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#03060a"]} />
      <fog attach="fog" args={["#03060a", 6, 12]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[2, 2, 3]} intensity={18} color="#7dffd4" />
      <pointLight position={[-3, -1, 2]} intensity={8} color="#4d7cff" />
      <NeuralCore />
      <HoloRings />
      <RoboticHand />
    </Canvas>
  );
}
