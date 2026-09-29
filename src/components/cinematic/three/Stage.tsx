"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * A WebGL canvas that is only created when its box nears the viewport and
 * stops rendering whenever it scrolls out of view. Keeps four 3D scenes on
 * one page affordable.
 */
export function Stage({
  children,
  className,
  fallback,
  eager = false,
  camera,
  dpr = [1, 1.75],
  gl,
}: {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  eager?: boolean;
  camera?: CanvasProps["camera"];
  dpr?: CanvasProps["dpr"];
  gl?: CanvasProps["gl"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(eager);
  const [visible, setVisible] = useState(eager);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Feature detection has to run in the browser, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(webglAvailable());
    const el = ref.current;
    if (!el) return;
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: "600px 0px" });
    const onscreen = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px 0px" });
    near.observe(el);
    onscreen.observe(el);
    return () => {
      near.disconnect();
      onscreen.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {supported ? (
        mounted && (
          <Canvas
            frameloop={visible ? "always" : "never"}
            dpr={dpr}
            camera={camera}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance", ...(gl as object) }}
            style={{ width: "100%", height: "100%" }}
          >
            {children}
          </Canvas>
        )
      ) : (
        fallback ?? null
      )}
    </div>
  );
}
