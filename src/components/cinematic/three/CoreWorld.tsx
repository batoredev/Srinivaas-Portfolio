"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useIsDesktop, usePrefersReducedMotion } from "@/lib/hooks";
import { mulberry32 } from "@/lib/random";
import { getStore, setStore } from "@/lib/store";
import { BRAIN_LABELS, CORE_TINTS, labelEls } from "./coreLabels";
import type { CoreData, CoreShape } from "./coreShapes";
import { ProjectorBase, RingLines } from "./holo";
import {
  FOOTER_POSE,
  HERO_POSE,
  PROLOGUE_POSE,
  SHAPE_OF,
  STAGE_POSE,
  WARM_FROM,
  backdropPose,
  mixPose,
  readStops,
  smoothstep,
  warmthOf,
  type Pose,
  type Stop,
} from "./storyline";

/** Build every shape off the main thread so the boot stays smooth. */
function useCoreData(count: number) {
  const [data, setData] = useState<CoreData | null>(null);
  useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL("./core.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<CoreData>) => !cancelled && setData(e.data);
      worker.postMessage({ count });
    } catch {
      import("./coreShapes").then(({ makeCore }) => !cancelled && setData(makeCore(count)));
    }
    return () => {
      cancelled = true;
      worker?.terminate();
    };
  }, [count]);
  return data;
}

/* ───────────────────────── shaders ───────────────────────── */

const PULSES = 8;

const pointsVert = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScan;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform vec4 uPulses[${PULSES}];
  uniform float uMorph;
  uniform float uBrain;
  uniform float uScatter;
  uniform float uSeed;
  uniform float uWarm;
  uniform float uOpacity;
  uniform vec3 uTint;
  uniform float uTintAmt;
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aNormal;
  attribute float aRand;
  attribute float aRegion;
  attribute float aGroove;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // each particle travels on its own schedule, so the shape re-forms as a wave
    float k = smoothstep(aRand * 0.35, aRand * 0.35 + 0.65, uMorph);
    vec3 base = mix(aFrom, aTo, k);
    float transit = sin(k * 3.14159265);
    base += transit * 0.3 * vec3(
      sin(aRand * 61.0 + uTime * 0.9 + uSeed),
      cos(aRand * 47.0 + uTime * 0.7 + uSeed * 1.3),
      sin(aRand * 29.0 + uTime * 0.8 + uSeed * 0.7));

    float interior = step(2.5, aRegion) * uBrain;
    base += interior * 0.03 * vec3(sin(uTime * 0.7 + aRand * 40.0), cos(uTime * 0.5 + aRand * 30.0), sin(uTime * 0.6 + aRand * 20.0));
    // non-brain shapes breathe a little
    base *= 1.0 + (1.0 - uBrain) * 0.012 * sin(uTime * 1.3 + aRand * 6.2831);

    vec3 radial = normalize(base + vec3(0.0001));
    // ignition: particles fly in from a wide scattered cloud
    vec3 scattered = radial * (2.4 + aRand * 3.5) + vec3(sin(aRand * 91.0), cos(aRand * 57.0), sin(aRand * 33.0)) * 1.4;
    float r = smoothstep(aRand * 0.55, aRand * 0.55 + 0.45, uReveal);
    vec3 p = mix(scattered, base, r);
    // retraining: weights blown apart, then pulled back into shape
    p += radial * uScatter * (0.5 + aRand * 1.8);

    vec3 nrm = normalize(mix(radial, aNormal, uBrain));

    vec3 dp = p - uPointer;
    float touch = smoothstep(0.42, 0.0, length(dp)) * uPointerStrength;
    p += nrm * touch * 0.09;

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

    float crest = mix(1.0, 1.0 - aGroove, uBrain);
    float size = uSize * (0.55 + aRand * 0.9) * (1.0 + energy * 1.5 + scan * 0.5 + touch * 1.4) * mix(0.7, 1.0, crest);
    size *= mix(0.88, 1.0, uBrain);
    if (interior > 0.5) size *= 1.5;
    gl_PointSize = size * uPixelRatio / -mv.z;

    vec3 n = normalize(normalMatrix * nrm);
    float facing = dot(n, normalize(-mv.xyz));
    float fres = pow(1.0 - abs(facing), 1.6);
    // as a brain, the far side fades out so the folds on the near side read
    float nearSide = mix(1.0, 0.06 + 0.94 * smoothstep(-0.15, 0.4, facing), uBrain);

    // cool training light → warm production light
    vec3 deep = mix(vec3(0.12, 0.42, 0.72), vec3(0.5, 0.2, 0.05), uWarm);
    vec3 hi = mix(vec3(0.31, 0.89, 1.0), vec3(1.0, 0.71, 0.28), uWarm);
    vec3 spark = mix(vec3(1.0, 0.71, 0.28), vec3(0.78, 0.96, 1.0), uWarm);
    vec3 col = mix(deep, hi, 0.35 + 0.65 * fres);
    if (aRegion > 0.5 && aRegion < 2.5) col = mix(col, vec3(0.55, 0.8, 1.0), 0.35 * uBrain * (1.0 - uWarm));
    col = mix(col * 0.55, col, crest);
    col = mix(col, uTint, uTintAmt * 0.6);
    col = mix(col, spark, clamp(energy, 0.0, 1.0));
    col += vec3(0.9, 1.0, 1.0) * scan * 0.3 + vec3(1.0, 0.85, 0.6) * touch * 0.5;
    vColor = col;

    float aBrain = (0.34 + 0.5 * fres) * mix(1.0, twinkle, 0.5) * mix(0.1, 1.0, crest) * nearSide;
    float aShape = (0.3 + 0.5 * fres) * twinkle;
    float a = mix(aShape, aBrain, uBrain) + energy * 0.55 + scan * 0.18 + touch * 0.5;
    if (interior > 0.5) a = 0.22 * twinkle + energy;
    vAlpha = a * mix(0.25, 1.0, r) * uOpacity;
  }
`;

const pointsFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = pow(smoothstep(0.5, 0.0, d), 1.7);
    gl_FragColor = vec4(vColor * (0.8 + core), core * vAlpha);
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
  uniform float uWarm;
  varying float vSeed;
  varying float vEnd;
  void main() {
    float head = fract(uTime * (0.25 + vSeed * 0.5) + vSeed * 10.0);
    float g = smoothstep(0.22, 0.0, abs(vEnd - head));
    vec3 cool = mix(vec3(0.3, 0.85, 1.0), vec3(1.0, 0.72, 0.3), step(0.82, vSeed));
    vec3 col = mix(cool, vec3(1.0, 0.72, 0.3), uWarm);
    float a = (0.05 + g * 0.75) * smoothstep(0.6, 1.0, uReveal) * uFade;
    gl_FragColor = vec4(col * (0.6 + g), a);
  }
`;

/* ───────────────────────── motion ───────────────────────── */

type RotStyle = "brain" | "face" | "spin";
const ROT: Record<CoreShape, { style: RotStyle; x: number; y: number }> = {
  brain: { style: "brain", x: 0.16, y: -Math.PI / 2 + 0.42 },
  fingerprint: { style: "face", x: 0.04, y: 0 },
  network: { style: "face", x: 0.12, y: -0.42 },
  helix: { style: "spin", x: 0.14, y: 0 },
  lattice: { style: "spin", x: 0.28, y: 0 },
  tensor: { style: "face", x: 0.16, y: -0.62 },
  orbits: { style: "spin", x: 0.32, y: 0 },
  handshake: { style: "face", x: 0.05, y: 0 },
  point: { style: "spin", x: 0.2, y: 0 },
};

function restingYaw(shape: CoreShape, t: number, spin: number) {
  const r = ROT[shape];
  if (r.style === "brain") return r.y + Math.sin(t * 0.16) * 0.32;
  if (r.style === "face") return r.y + Math.sin(t * 0.2) * 0.3;
  return r.y + spin;
}

/** Angle a → b by fraction k along the shortest way round. */
function lerpAngle(a: number, b: number, k: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * k;
}

type Target = { from: CoreShape; to: CoreShape; morph: number; pose: Pose; warm: number; hero: number; labels: number };

/** Reads where the visitor is in the story and returns what the Core should do. */
function storyTarget(stops: Stop[], mobile: boolean): Target {
  const pick = (r: { desktop: Pose; mobile: Pose }) => (mobile ? r.mobile : r.desktop);
  const cy = window.innerHeight * 0.5;
  let idx = -1;
  let p = 0;
  for (let i = 0; i < stops.length; i++) {
    const b = stops[i].el.getBoundingClientRect();
    if (cy >= b.top && cy < b.bottom) {
      idx = i;
      p = (cy - b.top) / Math.max(1, b.height);
      break;
    }
  }
  if (idx === -1) {
    const first = stops[0]?.el.getBoundingClientRect();
    idx = first && cy < first.top ? 0 : stops.length - 1;
    p = idx === 0 ? 0 : 1;
  }
  const stop = stops[idx];
  if (!stop) return { from: "brain", to: "brain", morph: 1, pose: pick(HERO_POSE), warm: 0, hero: 1, labels: 1 };

  // the resting pose of whatever came before this stop
  const restingBefore = (i: number): { shape: CoreShape; pose: Pose } => {
    for (let j = i - 1; j >= 0; j--) {
      const s = stops[j];
      if (s.kind === "section") return { shape: SHAPE_OF[s.id], pose: backdropPose(s.id, mobile) };
      if (s.kind === "prologue") return { shape: "brain", pose: pick(PROLOGUE_POSE) };
      if (s.kind === "hero") return { shape: "brain", pose: pick(HERO_POSE) };
    }
    return { shape: "brain", pose: pick(HERO_POSE) };
  };

  switch (stop.kind) {
    case "hero": {
      const t = smoothstep(0.5, 1, p);
      // p is measured at the centre line, so it already reads 0.5 at the top
      // of the page; the callouts fade on how far the hero has scrolled away
      const b = stop.el.getBoundingClientRect();
      const away = -b.top / Math.max(1, b.height);
      return { from: "brain", to: "brain", morph: 1, pose: mixPose(pick(HERO_POSE), pick(PROLOGUE_POSE), t), warm: 0, hero: 1 - t, labels: 1 - smoothstep(0.04, 0.2, away) };
    }
    case "prologue":
      return { from: "brain", to: "brain", morph: 1, pose: pick(PROLOGUE_POSE), warm: 0, hero: 0, labels: 0 };
    case "interlude": {
      const prev = restingBefore(idx);
      const shape = SHAPE_OF[stop.id];
      const stage = pick(STAGE_POSE);
      let pose: Pose;
      if (p < 0.3) pose = mixPose(prev.pose, stage, smoothstep(0, 0.3, p));
      else if (p < 0.76) pose = stage;
      else pose = mixPose(stage, backdropPose(stop.id, mobile), smoothstep(0.76, 1, p));
      const warm = stop.id === WARM_FROM ? smoothstep(0.25, 0.7, p) : warmthOf(stop.id);
      return { from: prev.shape, to: shape, morph: smoothstep(0.06, 0.4, p), pose, warm, hero: 0, labels: 0 };
    }
    case "section":
      return { from: SHAPE_OF[stop.id], to: SHAPE_OF[stop.id], morph: 1, pose: backdropPose(stop.id, mobile), warm: warmthOf(stop.id), hero: 0, labels: 0 };
    case "footer": {
      const prev = restingBefore(idx);
      const b = stop.el.getBoundingClientRect();
      const t = smoothstep(0, 1, (window.innerHeight - b.top) / window.innerHeight);
      const pose = mixPose(prev.pose, pick(FOOTER_POSE), t);
      // a footer taller than the screen scrolls under the point, so let it fade
      pose.o *= 1 - 0.75 * smoothstep(0.04, 0.3, -b.top / window.innerHeight);
      return { from: prev.shape, to: "point", morph: t, pose, warm: 1 - t * 0.7, hero: 0, labels: 0 };
    }
  }
}

/* ───────────────────────── scene ───────────────────────── */

function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const r = mulberry32(99);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() - 0.5) * 10;
      arr[i * 3 + 1] = (r() - 0.5) * 6;
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
      <pointsMaterial size={0.012} color="#9ef3ff" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Core({ mobile, reduced, onLowPower }: { mobile: boolean; reduced: boolean; onLowPower: () => void }) {
  const group = useRef<THREE.Group>(null);
  const projector = useRef<THREE.Group>(null);
  const { camera, size, gl, raycaster, setDpr } = useThree();
  const data = useCoreData(mobile ? 9000 : 16000);

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
          uMorph: { value: 1 },
          uBrain: { value: 1 },
          uScatter: { value: 0 },
          uSeed: { value: 0 },
          uWarm: { value: 0 },
          uOpacity: { value: 1 },
          uTint: { value: new THREE.Color("#4fe3ff") },
          uTintAmt: { value: 0 },
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
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uFade: { value: 1 }, uWarm: { value: 0 } },
      }),
    [],
  );

  const pointsGeo = useMemo(() => {
    if (!data) return null;
    const b = data.brain;
    const g = new THREE.BufferGeometry();
    // `position` only feeds bounds; the shader morphs aFrom → aTo
    g.setAttribute("position", new THREE.BufferAttribute(b.pos, 3));
    g.setAttribute("aFrom", new THREE.BufferAttribute(new Float32Array(b.pos), 3));
    g.setAttribute("aTo", new THREE.BufferAttribute(new Float32Array(b.pos), 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(b.nor, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(b.rnd, 1));
    g.setAttribute("aRegion", new THREE.BufferAttribute(b.reg, 1));
    g.setAttribute("aGroove", new THREE.BufferAttribute(b.groove, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);
    return g;
  }, [data]);
  const linesGeo = useMemo(() => {
    if (!data) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.brain.links, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.brain.seeds, 1));
    g.setAttribute("aEnd", new THREE.BufferAttribute(data.brain.ends, 1));
    return g;
  }, [data]);

  useEffect(() => {
    pointsMat.uniforms.uPixelRatio.value = gl.getPixelRatio();
  }, [gl, pointsMat, size]);

  // camera framing follows the breakpoint
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(0, 0.1, mobile ? 5.6 : 4.2);
    cam.fov = mobile ? 46 : 38;
    cam.updateProjectionMatrix();
  }, [camera, mobile]);

  // the cursor in normalised coordinates; level until the visitor moves it
  const pointer = useRef(new THREE.Vector2(0, 0));
  const pointerLive = useRef(false);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerLive.current = true;
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const s = useRef({
    reveal: 0,
    nextPulse: 1.5,
    pulseIdx: 0,
    fired: 0,
    lastReport: 0,
    tiltX: 0,
    tiltY: 0,
    spin: 0,
    from: "brain" as CoreShape,
    to: "brain" as CoreShape,
    morph: 1,
    pose: { x: 1.2, y: 0.08, z: 0, s: 1, o: 1 } as Pose,
    warm: 0,
    hero: 1,
    labels: 0,
    stops: [] as Stop[],
    stopsAt: -10,
    beat: 0,
    bump: 0,
    retrain: 0,
    scatter: 0,
    tintAmt: 0,
    reignite: 0,
    frames: 0,
    frameTime: 0,
    level: 0,
    lastWarmCss: -1,
  });
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), 1.1), []);
  const inv = useMemo(() => new THREE.Matrix4(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const anchors = useMemo(() => BRAIN_LABELS.map((l) => new THREE.Vector3(...l.anchor)), []);
  const normals = useMemo(() => BRAIN_LABELS.map((l) => new THREE.Vector3(...l.normal).normalize()), []);
  const wq = useMemo(() => new THREE.Quaternion(), []);
  const nw = useMemo(() => new THREE.Vector3(), []);

  const shownShape = () => (s.current.morph > 0.5 ? s.current.to : s.current.from);

  const firePulse = (t: number, at?: THREE.Vector3) => {
    const st = s.current;
    const v = pointsMat.uniforms.uPulses.value[st.pulseIdx % PULSES] as THREE.Vector4;
    if (at) v.set(at.x, at.y, at.z, t);
    else if (data) {
      const arr = data.shapes[shownShape()];
      const i = Math.floor(Math.random() * data.count);
      v.set(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2], t);
    }
    st.pulseIdx++;
    st.fired++;
  };

  useEffect(() => {
    const onDown = () => {
      const u = pointsMat.uniforms;
      if (u.uPointerStrength.value > 0.5) firePulse(u.uTime.value, (u.uPointer.value as THREE.Vector3).clone());
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const st = s.current;
    const u = pointsMat.uniforms;
    const store = getStore();
    const dt = Math.min(delta, 0.1);

    // adaptive quality: step down if frames run long for two seconds
    st.frames++;
    st.frameTime += delta;
    if (st.frames >= 120) {
      const avg = st.frameTime / st.frames;
      st.frames = 0;
      st.frameTime = 0;
      if (store.engaged && avg > 1 / 38 && st.level < 2) {
        st.level++;
        if (st.level === 1) {
          setDpr(1);
          onLowPower();
        } else if (pointsGeo) {
          pointsGeo.setDrawRange(0, Math.floor((data?.count ?? 0) / 2));
        }
      }
    }

    // where are we in the story?
    if (t - st.stopsAt > 1 || st.stops.length === 0) {
      st.stops = readStops();
      st.stopsAt = t;
    }
    const target = storyTarget(st.stops, mobile);

    // swap the morph endpoints when the pair changes
    if (data && pointsGeo && (target.from !== st.from || target.to !== st.to)) {
      const fromAttr = pointsGeo.getAttribute("aFrom") as THREE.BufferAttribute;
      const toAttr = pointsGeo.getAttribute("aTo") as THREE.BufferAttribute;
      (fromAttr.array as Float32Array).set(data.shapes[target.from]);
      (toAttr.array as Float32Array).set(data.shapes[target.to]);
      fromAttr.needsUpdate = true;
      toAttr.needsUpdate = true;
      // keep the displayed shape continuous across the swap
      if (target.from === st.to && target.to !== st.to) st.morph = 0;
      else if (target.to === st.from && target.from !== st.from) st.morph = 1;
      else if (target.from === target.to) st.morph = 1;
      st.from = target.from;
      st.to = target.to;
    }

    const ease = 1 - Math.exp(-dt * (reduced ? 12 : 4.5));
    st.morph += (target.morph - st.morph) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
    st.pose = mixPose(st.pose, target.pose, ease);
    st.warm += (target.warm - st.warm) * (1 - Math.exp(-dt * 2.5));
    st.hero += (target.hero - st.hero) * ease;
    st.labels += (target.labels - st.labels) * ease;

    // story events from the DOM: beats, retraining, replays
    if (store.beat !== st.beat) {
      st.beat = store.beat;
      st.bump = 1;
      for (let i = 0; i < 3; i++) firePulse(t + i * 0.12);
    }
    if (store.retrain !== st.retrain) {
      st.retrain = store.retrain;
      st.scatter = reduced ? 0 : 1;
      (u.uTint.value as THREE.Color).set(CORE_TINTS[st.retrain % CORE_TINTS.length]);
      u.uSeed.value = Math.random() * 100;
      st.tintAmt = 1;
    }
    if (store.reignite !== st.reignite) {
      st.reignite = store.reignite;
      st.reveal = 0;
    }
    st.bump *= Math.exp(-dt * 3.5);
    st.scatter *= Math.exp(-dt * 2.4);
    st.tintAmt += (0.55 - st.tintAmt) * (1 - Math.exp(-dt * 0.8));

    if (store.engaged && data) st.reveal = Math.min(1, st.reveal + dt / 3.2);
    const eased = 1 - Math.pow(1 - st.reveal, 3);

    const brainness = (st.from === "brain" ? 1 - st.morph : 0) + (st.to === "brain" ? st.morph : 0);
    u.uTime.value = t;
    u.uReveal.value = eased;
    u.uMorph.value = st.morph;
    u.uBrain.value = brainness;
    u.uScatter.value = st.scatter;
    u.uWarm.value = st.warm;
    u.uOpacity.value = st.pose.o;
    u.uTintAmt.value = st.retrain > 0 ? st.tintAmt : 0;
    u.uScan.value = Math.sin(t * 0.55) * 0.85;
    linesMat.uniforms.uTime.value = t;
    linesMat.uniforms.uReveal.value = eased;
    linesMat.uniforms.uFade.value = brainness * st.pose.o * (1 - st.scatter) * (st.level >= 2 ? 0 : 1);
    linesMat.uniforms.uWarm.value = st.warm;

    // warmth reaches the page atmosphere too
    if (Math.abs(st.warm - st.lastWarmCss) > 0.01) {
      st.lastWarmCss = st.warm;
      document.documentElement.style.setProperty("--warm", st.warm.toFixed(3));
    }

    if (eased > 0.6 && st.pose.o > 0.3 && t > st.nextPulse) {
      firePulse(t);
      st.nextPulse = t + 0.45 + Math.random() * 0.9;
    }
    if (t - st.lastReport > 1.5 && st.fired > 0) {
      st.lastReport = t;
      setStore({ synapses: store.synapses + st.fired });
      st.fired = 0;
    }

    const g = group.current;
    if (!g) return;
    st.tiltX += (pointer.current.y * 0.25 - st.tiltX) * 0.05;
    st.tiltY += (pointer.current.x * 0.45 - st.tiltY) * 0.05;
    st.spin += dt * 0.18;
    const k = smoothstep(0, 1, st.morph);
    const yaw = lerpAngle(restingYaw(st.from, t, st.spin), restingYaw(st.to, t, st.spin), k);
    const pitch = ROT[st.from].x + (ROT[st.to].x - ROT[st.from].x) * k;
    g.rotation.y = yaw + st.tiltY;
    g.rotation.x = pitch - st.tiltX;
    g.position.set(st.pose.x, st.pose.y, st.pose.z);
    g.scale.setScalar(st.pose.s * (1 + st.bump * 0.06));
    if (projector.current) {
      // the projector sinks away once the Core leaves the hero
      projector.current.visible = st.hero > 0.02;
      projector.current.scale.setScalar(0.6 + 0.4 * st.hero);
      projector.current.position.y = -(1 - st.hero) * 0.8;
    }

    // cursor → a hit on the Core's bounding sphere, in its local space
    g.updateMatrixWorld();
    raycaster.setFromCamera(pointer.current, camera);
    inv.copy(g.matrixWorld).invert();
    const ray = raycaster.ray.clone().applyMatrix4(inv);
    const on = pointerLive.current && st.pose.o > 0.5 && ray.intersectSphere(sphere, hit) ? 1 : 0;
    if (on) u.uPointer.value.copy(hit);
    u.uPointerStrength.value += (on * eased - u.uPointerStrength.value) * 0.12;

    // brain-region callouts in the hero
    for (let i = 0; i < anchors.length; i++) {
      const el = labelEls[i];
      if (!el) continue;
      if (st.labels < 0.02 || brainness < 0.9) {
        el.style.opacity = "0";
        continue;
      }
      tmp.copy(anchors[i]).applyMatrix4(g.matrixWorld);
      g.getWorldQuaternion(wq);
      nw.copy(normals[i]).applyQuaternion(wq);
      // > 0 when the surface there faces the camera
      const facing = nw.dot(camera.position.clone().sub(tmp).normalize());
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;
      const center = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld).project(camera);
      const bx = (center.x * 0.5 + 0.5) * size.width;
      const pinned = BRAIN_LABELS[i].side;
      const left = pinned ? pinned === "left" : x > size.width - 250 || (x < bx && x > 260);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.dataset.side = left ? "left" : "right";
      const vis = smoothstep(0.08, 0.3, facing);
      el.style.opacity = String(eased > 0.95 ? vis * st.labels : 0);
    }
  });

  return (
    <group ref={group}>
      {pointsGeo && <points geometry={pointsGeo} material={pointsMat} frustumCulled={false} />}
      {linesGeo && <lineSegments geometry={linesGeo} material={linesMat} frustumCulled={false} />}
      <group rotation={[0.35, 0, 0.2]}>
        <RingLines radius={1.32} ticks={0} opacity={0.16} dashed />
      </group>
      <group rotation={[Math.PI / 2 - 0.2, 0, 0]}>
        <RingLines radius={1.16} ticks={0} opacity={0.1} color="#ffb547" dashed />
      </group>
      <group ref={projector}>
        <ProjectorBase />
      </group>
    </group>
  );
}

function CoreScene({ mobile }: { mobile: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [bloom, setBloom] = useState(true);
  return (
    <>
      <color attach="background" args={["#020409"]} />
      <fog attach="fog" args={["#020409", 4.5, 10]} />
      <Core mobile={mobile} reduced={reduced} onLowPower={() => setBloom(false)} />
      <Dust count={mobile ? 160 : 340} />
      {bloom && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.16} luminanceSmoothing={0.4} mipmapBlur radius={0.6} />
        </EffectComposer>
      )}
    </>
  );
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The one world the whole cinematic story happens in: a fixed canvas behind
 * every chapter, holding the Core.
 */
export default function CoreWorld() {
  const desktop = useIsDesktop();
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    // feature detection has to wait for the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(webglAvailable());
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {supported === false && <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(79,227,255,0.18),transparent_55%)]" />}
      {supported && (
        <Canvas
          dpr={[1, desktop ? 1.6 : 1.4]}
          camera={{ position: [0, 0.1, desktop ? 4.2 : 5.6], fov: desktop ? 38 : 46 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%" }}
        >
          <CoreScene mobile={!desktop} />
        </Canvas>
      )}
    </div>
  );
}
