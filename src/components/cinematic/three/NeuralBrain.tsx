"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import { getStore, setStore } from "@/lib/store";
import type { BrainData } from "./brainGen";
import { ProjectorBase, RingLines } from "./holo";

/** Generate the brain off the main thread so the boot sequence stays smooth. */
function useBrainData(count: number) {
  const [data, setData] = useState<BrainData | null>(null);
  useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL("./brain.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<BrainData>) => !cancelled && setData(e.data);
      worker.postMessage({ count });
    } catch {
      import("./brainGen").then(({ makeBrain }) => !cancelled && setData(makeBrain(count)));
    }
    return () => {
      cancelled = true;
      worker?.terminate();
    };
  }, [count]);
  return data;
}

/* ───────────────────────── shaders ───────────────────────── */

const PULSES = 6;

const pointsVert = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScan;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform vec4 uPulses[${PULSES}];
  attribute vec3 aNormal;
  attribute float aRand;
  attribute float aRegion;
  attribute float aGroove;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 base = position;
    // interior neurons drift
    if (aRegion > 2.5) {
      base += 0.03 * vec3(sin(uTime * 0.7 + aRand * 40.0), cos(uTime * 0.5 + aRand * 30.0), sin(uTime * 0.6 + aRand * 20.0));
    }
    // intro: particles fly in from a wide scattered cloud
    vec3 scattered = normalize(base + vec3(0.0001)) * (2.4 + aRand * 3.5)
      + vec3(sin(aRand * 91.0), cos(aRand * 57.0), sin(aRand * 33.0)) * 1.4;
    float r = smoothstep(aRand * 0.55, aRand * 0.55 + 0.45, uReveal);
    vec3 p = mix(scattered, base, r);

    // pointer: points near the cursor lift off the surface and brighten
    vec3 dp = p - uPointer;
    float pd = length(dp);
    float touch = smoothstep(0.42, 0.0, pd) * uPointerStrength;
    p += aNormal * touch * 0.09;

    // synapse pulses: expanding shells from a firing site
    float energy = 0.0;
    for (int i = 0; i < ${PULSES}; i++) {
      vec4 pu = uPulses[i];
      float age = uTime - pu.w;
      if (age > 0.0 && age < 2.6) {
        float front = age * 0.85;
        float d = distance(base, pu.xyz);
        energy += smoothstep(0.11, 0.0, abs(d - front)) * (1.0 - age / 2.6);
      }
    }
    energy = clamp(energy, 0.0, 1.4);

    float scan = smoothstep(0.05, 0.0, abs(base.y - uScan));
    float twinkle = 0.6 + 0.4 * sin(uTime * 1.7 + aRand * 80.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float crest = 1.0 - aGroove;
    float size = uSize * (0.55 + aRand * 0.9) * (1.0 + energy * 1.5 + scan * 0.5 + touch * 1.4) * mix(0.7, 1.0, crest);
    if (aRegion > 2.5) size *= 1.5;
    gl_PointSize = size * uPixelRatio / -mv.z;

    vec3 n = normalize(normalMatrix * aNormal);
    float fres = pow(1.0 - abs(dot(n, normalize(-mv.xyz))), 1.6);

    vec3 cyan = vec3(0.31, 0.89, 1.0);
    vec3 deep = vec3(0.12, 0.42, 0.72);
    vec3 amber = vec3(1.0, 0.71, 0.28);
    vec3 col = mix(deep, cyan, 0.35 + 0.65 * fres);
    if (aRegion > 0.5 && aRegion < 2.5) col = mix(col, vec3(0.55, 0.8, 1.0), 0.35);
    col = mix(col * 0.55, col, crest);
    col = mix(col, amber, clamp(energy, 0.0, 1.0));
    col += vec3(0.9, 1.0, 1.0) * scan * 0.3 + vec3(1.0, 0.85, 0.6) * touch * 0.5;
    vColor = col;

    float a = ((0.12 + 0.62 * fres) * twinkle) * mix(0.18, 1.0, crest) + energy * 0.55 + scan * 0.18 + touch * 0.5;
    if (aRegion > 2.5) a = 0.35 * twinkle + energy;
    vAlpha = a * mix(0.25, 1.0, r);
  }
`;

const pointsFrag = /* glsl */ `
  uniform float uFade;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    core = pow(core, 1.7);
    gl_FragColor = vec4(vColor * (0.8 + core), core * vAlpha * uFade);
  }
`;

const linesVert = /* glsl */ `
  uniform float uReveal;
  attribute float aSeed;
  attribute float aEnd;
  varying float vSeed;
  varying float vEnd;
  void main() {
    vSeed = aSeed;
    vEnd = aEnd;
    vec3 p = position * mix(1.6, 1.0, smoothstep(0.5, 1.0, uReveal));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const linesFrag = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uFade;
  varying float vSeed;
  varying float vEnd;
  void main() {
    float head = fract(uTime * (0.25 + vSeed * 0.5) + vSeed * 10.0);
    float g = smoothstep(0.22, 0.0, abs(vEnd - head));
    vec3 col = mix(vec3(0.3, 0.85, 1.0), vec3(1.0, 0.72, 0.3), step(0.82, vSeed));
    float a = (0.05 + g * 0.75) * smoothstep(0.6, 1.0, uReveal) * uFade;
    gl_FragColor = vec4(col * (0.6 + g), a);
  }
`;

/* ───────────────────────── scene parts ───────────────────────── */

export type BrainLabel = { name: string; note: string; anchor: [number, number, number] };

export const BRAIN_LABELS: BrainLabel[] = [
  { name: "Frontal lobe", note: "product thinking", anchor: [0.22, 0.34, 0.8] },
  { name: "Parietal lobe", note: "systems design", anchor: [0.34, 0.6, -0.2] },
  { name: "Temporal lobe", note: "listening to owners", anchor: [0.66, -0.26, 0.28] },
  { name: "Occipital lobe", note: "interface design", anchor: [0.24, 0.16, -0.9] },
  { name: "Cerebellum", note: "infra & ops · balance", anchor: [0.3, -0.46, -0.66] },
  { name: "Brain stem", note: "keeps servers breathing", anchor: [0.0, -0.86, -0.38] },
];

function Dust({ count = 380 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const r = mulberry32(99);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() - 0.5) * 9;
      arr[i * 3 + 1] = (r() - 0.5) * 5;
      arr[i * 3 + 2] = (r() - 0.5) * 5 - 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.01;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.012} color="#9ef3ff" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Brain({ labelRefs, mobile }: { labelRefs?: RefObject<(HTMLDivElement | null)[]>; mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const { camera, size, gl, pointer, raycaster } = useThree();
  const data = useBrainData(mobile ? 9000 : 16000);

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointsVert,
        fragmentShader: pointsFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uSize: { value: 22 },
          uPixelRatio: { value: 1 },
          uScan: { value: -2 },
          uPointer: { value: new THREE.Vector3(9, 9, 9) },
          uPointerStrength: { value: 0 },
          uPulses: { value: Array.from({ length: PULSES }, () => new THREE.Vector4(0, 0, 0, -100)) },
          uFade: { value: 1 },
        },
      }),
    [],
  );
  const linesMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: linesVert,
        fragmentShader: linesFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uFade: { value: 1 } },
      }),
    [],
  );

  const pointsGeo = useMemo(() => {
    if (!data) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.pos, 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(data.nor, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(data.rnd, 1));
    g.setAttribute("aRegion", new THREE.BufferAttribute(data.reg, 1));
    g.setAttribute("aGroove", new THREE.BufferAttribute(data.groove, 1));
    return g;
  }, [data]);
  const linesGeo = useMemo(() => {
    if (!data) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.links, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    g.setAttribute("aEnd", new THREE.BufferAttribute(data.ends, 1));
    return g;
  }, [data]);

  useEffect(() => {
    pointsMat.uniforms.uPixelRatio.value = gl.getPixelRatio();
  }, [gl, pointsMat, size]);

  const state = useRef({
    reveal: 0,
    nextPulse: 1.5,
    pulseIdx: 0,
    fired: 0,
    lastReport: 0,
    tiltX: 0,
    tiltY: 0,
  });
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), 1.05), []);
  const inv = useMemo(() => new THREE.Matrix4(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const anchors = useMemo(() => BRAIN_LABELS.map((l) => new THREE.Vector3(...l.anchor)), []);

  const firePulse = (t: number, at?: THREE.Vector3) => {
    const s = state.current;
    const v = pointsMat.uniforms.uPulses.value[s.pulseIdx % PULSES] as THREE.Vector4;
    if (at) v.set(at.x, at.y, at.z, t);
    else if (data) {
      const i = Math.floor(Math.random() * data.surfaceCount);
      v.set(data.pos[i * 3], data.pos[i * 3 + 1], data.pos[i * 3 + 2], t);
    }
    s.pulseIdx++;
    s.fired++;
  };

  useEffect(() => {
    const onDown = () => {
      const u = pointsMat.uniforms;
      if (u.uPointerStrength.value > 0.5) firePulse(u.uTime.value, (u.uPointer.value as THREE.Vector3).clone());
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((st, delta) => {
    const t = st.clock.elapsedTime;
    const s = state.current;
    const u = pointsMat.uniforms;
    const engaged = getStore().engaged;
    const scroll = Math.min(1.2, window.scrollY / Math.max(1, window.innerHeight));

    // intro assembly (waits for the worker)
    if (engaged && data) s.reveal = Math.min(1, s.reveal + delta / 3.2);
    const eased = 1 - Math.pow(1 - s.reveal, 3);
    u.uTime.value = t;
    u.uReveal.value = eased;
    u.uScan.value = Math.sin(t * 0.55) * 0.85;
    u.uFade.value = 1 - Math.min(1, scroll) * 0.75;
    linesMat.uniforms.uTime.value = t;
    linesMat.uniforms.uReveal.value = eased;
    linesMat.uniforms.uFade.value = u.uFade.value;

    // autonomous firing
    if (eased > 0.6 && t > s.nextPulse) {
      firePulse(t);
      s.nextPulse = t + 0.45 + Math.random() * 0.9;
    }
    if (t - s.lastReport > 1.5 && s.fired > 0) {
      s.lastReport = t;
      setStore({ synapses: getStore().synapses + s.fired });
      s.fired = 0;
    }

    const g = group.current;
    if (!g) return;
    // rotation: slow drift + tilt toward the cursor
    s.tiltX += (pointer.y * 0.25 - s.tiltX) * 0.05;
    s.tiltY += (pointer.x * 0.45 - s.tiltY) * 0.05;
    // lateral three-quarter view, frontal lobe facing the name
    g.rotation.y = -Math.PI / 2 + 0.42 + Math.sin(t * 0.16) * 0.32 + s.tiltY;
    g.rotation.x = 0.16 - s.tiltX;
    const baseX = mobile ? 0 : 1.2;
    const baseY = mobile ? 1.05 : 0.08;
    g.position.set(baseX, baseY + scroll * 0.8, -scroll * 1.6);
    if (orbit.current) orbit.current.rotation.y = -t * 0.35;

    // cursor → local-space hit on the brain's bounding sphere
    g.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    inv.copy(g.matrixWorld).invert();
    const ray = raycaster.ray.clone().applyMatrix4(inv);
    const target = ray.intersectSphere(sphere, hit) ? 1 : 0;
    if (target) u.uPointer.value.copy(hit);
    u.uPointerStrength.value += (target * eased - u.uPointerStrength.value) * 0.12;

    // project region labels into the DOM overlay
    const els = labelRefs?.current;
    if (els) {
      for (let i = 0; i < anchors.length; i++) {
        const el = els[i];
        if (!el) continue;
        tmp.copy(anchors[i]).applyMatrix4(g.matrixWorld);
        const facing = tmp.clone().sub(camera.position).normalize().dot(tmp.clone().sub(g.position).normalize());
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * size.width;
        const y = (-tmp.y * 0.5 + 0.5) * size.height;
        const center = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld).project(camera);
        const bx = (center.x * 0.5 + 0.5) * size.width;
        const left = x > size.width - 250 || (x < bx && x > 260);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.dataset.side = left ? "left" : "right";
        const vis = facing < 0.15 ? 1 : 0.18;
        el.style.opacity = String(eased > 0.95 ? vis * (1 - Math.min(1, scroll * 2)) : 0);
      }
    }
  });

  return (
    <>
      <group ref={group}>
        {pointsGeo && <points geometry={pointsGeo} material={pointsMat} />}
        {linesGeo && <lineSegments geometry={linesGeo} material={linesMat} />}
        <group ref={orbit} rotation={[0.35, 0, 0.2]}>
          <RingLines radius={1.28} ticks={0} opacity={0.18} dashed />
        </group>
        <group rotation={[Math.PI / 2 - 0.2, 0, 0]}>
          <RingLines radius={1.12} ticks={0} opacity={0.12} color="#ffb547" dashed />
        </group>
        <ProjectorBase />
      </group>
    </>
  );
}

export function BrainScene({ labelRefs, mobile }: { labelRefs?: RefObject<(HTMLDivElement | null)[]>; mobile: boolean }) {
  return (
    <>
      <color attach="background" args={["#020409"]} />
      <fog attach="fog" args={["#020409", 4.5, 9]} />
      <Brain labelRefs={labelRefs} mobile={mobile} />
      <Dust count={mobile ? 180 : 380} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.85} luminanceThreshold={0.16} luminanceSmoothing={0.4} mipmapBlur radius={0.6} />
      </EffectComposer>
    </>
  );
}
