"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Monogram } from "../hud/Hud";
import { AR_IDS, AR_MODELS, type ArId } from "./arCatalog";
import { ModelViewer } from "./ModelViewer";

/**
 * Where the QR code lands on a phone: the hologram, full screen, one tap
 * from AR. `?export=1` exposes the model builder for `npm run ar:models`.
 */
export function ArPage({ id }: { id: ArId }) {
  const [arOk, setArOk] = useState<boolean | null>(null);
  const m = AR_MODELS[id];

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("export") !== "1") return;
    (window as unknown as { __svExportGlb: () => Promise<string> }).__svExportGlb = async () => {
      const { exportArGlb } = await import("./arModels");
      const bytes = new Uint8Array(await exportArGlb(id));
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    };
  }, [id]);

  return (
    <main className="relative flex min-h-[100svh] flex-col bg-void text-ice">
      <div className="atmos-grid" />
      <header className="relative z-[2] flex items-center gap-3 px-5 py-4">
        <Monogram size={30} />
        <div>
          <div className="font-display text-[12px] font-semibold uppercase tracking-[0.24em]">Srinivaas Vaibhav</div>
          <div className="font-mono text-[9.5px] tracking-[0.25em] text-holo/60">AR PROJECTOR</div>
        </div>
      </header>

      <div className="relative z-[1] min-h-[56svh] flex-1 bg-[radial-gradient(circle_at_50%_60%,rgba(79,227,255,0.14),transparent_65%)]">
        {/* a % height does not resolve in a flex-1 box, so pin the viewer to it */}
        <div className="absolute inset-0">
          <ModelViewer id={id} onArSupport={setArOk} />
        </div>
      </div>

      <section className="relative z-[2] border-t border-holo/15 bg-void/90 px-5 pb-8 pt-5 backdrop-blur-md">
        <div className="hud-label !text-amber">Place it in your room</div>
        <h1 className="mt-1 font-display text-[24px] font-semibold uppercase tracking-wide">{m.title}</h1>
        <p className="mt-1 text-[14px] leading-relaxed text-ice/75">{m.caption}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-fog">
          {arOk === false
            ? "This browser can't open AR. Try Safari on an iPhone, or Chrome on an Android phone with ARCore."
            : "Tap “Place it in your room”, point at the floor or a table, and the hologram lands in your space."}
        </p>
        <nav aria-label="Other holograms" className="mt-5 flex flex-wrap gap-2">
          {AR_IDS.filter((x) => x !== id).map((x) => (
            <Link key={x} href={`/ar/${x}`} className="border border-holo/25 px-3 py-1.5 font-mono text-[10.5px] tracking-[0.15em] text-holo-soft hover:border-amber hover:text-amber">
              ◈ {AR_MODELS[x].title}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mt-5 inline-block font-mono text-[11px] tracking-[0.2em] text-amber hover:text-ice">
          OPEN THE FULL STORY ↗
        </Link>
      </section>
    </main>
  );
}
