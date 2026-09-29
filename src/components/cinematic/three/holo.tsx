"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

export function RingLines({ radius, ticks, y = 0, opacity = 0.4, color = "#4fe3ff", dashed = false }: { radius: number; ticks: number; y?: number; opacity?: number; color?: string; dashed?: boolean }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const seg = 180;
    for (let i = 0; i < seg; i++) {
      if (dashed && i % 6 > 3) continue;
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      pts.push(Math.cos(a0) * radius, y, Math.sin(a0) * radius, Math.cos(a1) * radius, y, Math.sin(a1) * radius);
    }
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      const len = i % 5 === 0 ? 0.09 : 0.04;
      pts.push(Math.cos(a) * radius, y, Math.sin(a) * radius, Math.cos(a) * (radius + len), y, Math.sin(a) * (radius + len));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [radius, ticks, y, dashed]);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

export function ProjectorBase({ scale = 1 }: { scale?: number }) {
  const beam = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; varying vec2 vUv;
          void main(){
            float fade = pow(1.0 - vUv.y, 2.2);
            float streak = 0.55 + 0.45 * sin(vUv.x * 120.0 + uTime * 0.6);
            gl_FragColor = vec4(vec3(0.31,0.89,1.0), fade * 0.10 * streak);
          }`,
      }),
    [],
  );
  const disc = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; varying vec2 vUv;
          void main(){
            float r = length(vUv - 0.5) * 2.0;
            float rings = smoothstep(0.03, 0.0, abs(fract(r * 6.0 - uTime * 0.25) - 0.5) - 0.46);
            float glow = pow(1.0 - r, 2.5);
            float a = (glow * 0.35 + rings * 0.18 * (1.0 - r)) * step(r, 1.0);
            gl_FragColor = vec4(vec3(0.31,0.89,1.0), a);
          }`,
      }),
    [],
  );
  useFrame((s) => {
    beam.uniforms.uTime.value = s.clock.elapsedTime;
    disc.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <group position={[0, -1.12 * scale, 0]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={disc}>
        <planeGeometry args={[3.4, 3.4]} />
      </mesh>
      <mesh position={[0, 1.1, 0]} material={beam}>
        <cylinderGeometry args={[1.25, 0.72, 2.2, 64, 1, true]} />
      </mesh>
      <RingLines radius={0.78} ticks={72} opacity={0.55} />
      <RingLines radius={1.32} ticks={120} opacity={0.25} dashed />
    </group>
  );
}

