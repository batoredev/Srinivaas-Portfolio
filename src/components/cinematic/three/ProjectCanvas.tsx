"use client";

import type { Project } from "@/data/content";
import { Stage } from "./Stage";
import { ProjectHologramScene } from "./ProjectHologram";

export default function ProjectCanvas({ active }: { active: Project["id"] }) {
  return (
    <Stage className="absolute inset-0" camera={{ position: [0, 1.15, 5.2], fov: 38 }} dpr={[1, 1.5]}>
      <ProjectHologramScene active={active} />
    </Stage>
  );
}
