"use client";

import { useEffect, useRef, useState } from "react";
import { AR_MODELS, type ArId } from "./arCatalog";

/*
 * Google's <model-viewer>, self-hosted from /public/vendor (the npm package
 * pins an older three.js than this site uses). It previews the model in 3D
 * and hands off to the phone's AR: WebXR or Scene Viewer on Android, Quick
 * Look on iPhone.
 */

const SRC = "/vendor/model-viewer-4.4.0.min.js";
let loading: Promise<void> | null = null;

export function loadModelViewer() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("model-viewer failed to load"));
    document.head.appendChild(s);
  }).then(() => customElements.whenDefined("model-viewer").then(() => undefined));
  return loading;
}

type ModelViewerElement = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

export function ModelViewer({ id, onArSupport }: { id: ArId; onArSupport?: (ok: boolean) => void }) {
  const ref = useRef<ModelViewerElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadModelViewer()
      .then(() => alive && setReady(true))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    const report = () => onArSupport?.(!!el.canActivateAR);
    el.addEventListener("load", report);
    report();
    return () => el.removeEventListener("load", report);
  }, [ready, onArSupport, id]);

  const m = AR_MODELS[id];
  if (failed) return <p className="grid h-full place-items-center font-mono text-[12px] text-fog">3D preview unavailable</p>;
  return (
    <model-viewer
      ref={ref}
      key={id}
      src={m.src}
      alt={`${m.title}, a holographic model you can place in your room`}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="auto"
      ar-placement="floor"
      camera-controls
      auto-rotate
      touch-action="pan-y"
      interaction-prompt="none"
      shadow-intensity="0.4"
      exposure="1.1"
      tone-mapping="neutral"
      camera-orbit="35deg 72deg 105%"
      style={{ width: "100%", height: "100%", background: "transparent", ["--poster-color" as string]: "transparent" }}
    >
      <button
        slot="ar-button"
        type="button"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-amber bg-amber px-5 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-void shadow-[0_0_30px_rgba(255,181,71,0.45)]"
      >
        ◈ Place it in your room
      </button>
    </model-viewer>
  );
}
