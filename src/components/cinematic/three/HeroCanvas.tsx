"use client";

import type { RefObject } from "react";
import { Stage } from "./Stage";
import { BrainScene } from "./NeuralBrain";

export default function HeroCanvas({
  labelRefs,
  mobile,
}: {
  labelRefs: RefObject<(HTMLDivElement | null)[]>;
  mobile: boolean;
}) {
  return (
    <Stage
      eager
      className="absolute inset-0"
      camera={{ position: [0, 0.1, mobile ? 5.6 : 4.2], fov: mobile ? 46 : 38 }}
      dpr={[1, 1.6]}
      fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(79,227,255,0.18),transparent_55%)]" />}
    >
      <BrainScene labelRefs={labelRefs} mobile={mobile} />
    </Stage>
  );
}
