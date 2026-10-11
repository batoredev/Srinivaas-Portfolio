"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useFinePointer } from "@/lib/hooks";
import { setStore, useStore } from "@/lib/store";
import { getLenis } from "../scroll";
import { AR_MODELS } from "./arCatalog";
import { ModelViewer } from "./ModelViewer";
import { QrCode } from "./QrCode";

const useOrigin = () =>
  useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

/**
 * "Place it in your room": a 3D preview of the hologram. On a phone with AR it
 * opens straight into the room; on a desktop it hands off to the phone with a
 * QR code.
 */
export function ArModal() {
  const id = useStore((s) => s.ar);
  const desktop = useFinePointer();
  const origin = useOrigin();
  const [arOk, setArOk] = useState<boolean | null>(null);
  const close = useCallback(() => setStore({ ar: null }), []);

  useEffect(() => {
    if (!id) return;
    const lenis = getLenis();
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [id, close]);

  const m = id ? AR_MODELS[id] : null;
  const url = id ? `${origin}/ar/${id}` : "";

  return (
    <AnimatePresence>
      {id && m && (
        <motion.div
          key="ar"
          role="dialog"
          aria-modal="true"
          aria-label={`${m.title} in augmented reality`}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-void/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="panel relative grid w-full max-w-[980px] overflow-hidden lg:grid-cols-[1.4fr_1fr]"
            initial={{ y: 30, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[52svh] min-h-[320px] border-b border-holo/15 bg-[radial-gradient(circle_at_50%_60%,rgba(79,227,255,0.12),transparent_65%)] lg:h-[560px] lg:border-b-0 lg:border-r">
              <ModelViewer id={id} onArSupport={setArOk} />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                <span className="live-dot" />
                <span className="hud-label">AR projector · {m.title}</span>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-6 sm:p-8">
              <div>
                <div className="hud-label !text-amber">Augmented reality</div>
                <h2 className="mt-2 font-display text-[26px] font-semibold uppercase leading-tight tracking-wide text-ice">Place it in your room</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ice/75">{m.caption}</p>
              </div>

              {desktop ? (
                <div className="flex items-center gap-5">
                  <div className="shrink-0 border border-holo/25 p-2">{url && <QrCode value={url} size={150} />}</div>
                  <p className="text-[13.5px] leading-relaxed text-fog">
                    Scan with your phone&apos;s camera. It opens the hologram, ready to drop on your desk or floor. Works on iPhone and on Android phones with
                    ARCore.
                  </p>
                </div>
              ) : (
                <p className="text-[13.5px] leading-relaxed text-fog">
                  {arOk === false
                    ? "This browser can't open AR. Try Safari on an iPhone, or Chrome on an Android phone with ARCore."
                    : "Tap “Place it in your room”, point your camera at the floor or a table, and the hologram lands in your space."}
                </p>
              )}

              <ul className="mt-auto space-y-1.5 font-mono text-[11px] tracking-[0.12em] text-holo-soft/70">
                <li>▸ Drag to orbit · pinch to zoom</li>
                <li>▸ Real scale, table-top size</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 border border-holo/30 bg-void/70 px-2.5 py-1 font-mono text-[12px] text-ice hover:border-amber hover:text-amber"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small "AR" trigger used next to holograms. */
export function ArButton({ id, label = "AR", className = "" }: { id: keyof typeof AR_MODELS; label?: string; className?: string }) {
  return (
    <button
      type="button"
      data-lock={`${AR_MODELS[id].title} in AR`}
      onClick={() => setStore({ ar: id })}
      className={`border border-holo/30 bg-void/60 px-2.5 py-1.5 font-mono text-[10.5px] tracking-[0.2em] text-holo-soft transition-colors hover:border-amber hover:text-amber ${className}`}
    >
      ◈ {label}
    </button>
  );
}
