import { sections, type SectionId } from "@/data/content";
import type { CoreShape } from "./coreShapes";

/*
 * The story timeline. The page is a sequence of stops (hero, prologue, then a
 * chapter interlude and a section for every chapter, then the footer). In an
 * interlude the Core takes the stage and re-forms into the next chapter's
 * shape; in a section it steps back so the content can lead.
 */

export const SHAPE_OF: Record<SectionId, CoreShape> = {
  hero: "brain",
  about: "fingerprint",
  stack: "network",
  certifications: "lattice",
  experience: "helix",
  projects: "lattice",
  coding: "tensor",
  writing: "network",
  building: "orbits",
  testimonials: "handshake",
  contact: "handshake",
  footer: "point",
};

/** Position (scene units), scale and opacity of the Core. */
export type Pose = { x: number; y: number; z: number; s: number; o: number };

type Responsive = { desktop: Pose; mobile: Pose };

export const HERO_POSE: Responsive = {
  desktop: { x: 1.2, y: 0.08, z: 0, s: 1, o: 1 },
  mobile: { x: 0, y: 1.6, z: -0.3, s: 0.72, o: 0.9 },
};
export const PROLOGUE_POSE: Responsive = {
  desktop: { x: 0, y: 0.02, z: -0.2, s: 1.1, o: 0.4 },
  mobile: { x: 0, y: 0.15, z: -0.8, s: 1.05, o: 0.38 },
};
/** Centre stage, above the narrator line, during an interlude. */
export const STAGE_POSE: Responsive = {
  desktop: { x: 0, y: 0.5, z: 0, s: 0.72, o: 1 },
  mobile: { x: 0, y: 0.82, z: -0.4, s: 0.7, o: 1 },
};
export const FOOTER_POSE: Responsive = {
  desktop: { x: 1.75, y: 0.62, z: 0, s: 0.8, o: 1 },
  mobile: { x: 0, y: 1.95, z: -0.6, s: 0.6, o: 0.9 },
};

/** Where the Core rests behind each section: off to the emptier side, faint. */
const BACKDROP_X: Partial<Record<SectionId, number>> = {
  about: 1.9,
  stack: -1.9,
  certifications: 1.8,
  experience: 1.9,
  projects: -2.0,
  coding: 1.9,
  writing: -1.8,
  building: -1.8,
  testimonials: 1.8,
  contact: -1.9,
};

/** Sections with their own centrepiece (contact has the robotic hand) keep the Core faint. */
const BACKDROP_O: Partial<Record<SectionId, number>> = { contact: 0.04 };

export function backdropPose(id: SectionId, mobile: boolean): Pose {
  if (mobile) return { x: 0, y: 0.2, z: -2.2, s: 1.35, o: Math.min(0.16, BACKDROP_O[id] ?? 1) };
  return { x: BACKDROP_X[id] ?? 0, y: 0.1, z: -1.4, s: 1.3, o: BACKDROP_O[id] ?? 0.24 };
}

/** The world turns from cool training light to warm production light here. */
export const WARM_FROM: SectionId = "experience";

export function warmthOf(id: SectionId) {
  const order = sections.map((s) => s.id);
  const i = order.indexOf(id);
  const w = order.indexOf(WARM_FROM);
  return i >= 0 && w >= 0 && i >= w ? 1 : 0;
}

export type Stop =
  | { kind: "hero"; id: "hero"; el: HTMLElement }
  | { kind: "prologue"; id: "prologue"; el: HTMLElement }
  | { kind: "interlude"; id: SectionId; el: HTMLElement }
  | { kind: "section"; id: SectionId; el: HTMLElement }
  | { kind: "footer"; id: "footer"; el: HTMLElement };

/** Reads the stops from the DOM, in page order. */
export function readStops(): Stop[] {
  const stops: Stop[] = [];
  const hero = document.getElementById("hero");
  if (hero) stops.push({ kind: "hero", id: "hero", el: hero });
  const prologue = document.getElementById("prologue");
  if (prologue) stops.push({ kind: "prologue", id: "prologue", el: prologue });
  for (const s of sections) {
    if (s.id === "hero" || s.id === "footer") continue;
    const ch = document.getElementById(`chapter-${s.id}`);
    const el = document.getElementById(s.id);
    if (ch) stops.push({ kind: "interlude", id: s.id, el: ch });
    if (el) stops.push({ kind: "section", id: s.id, el });
  }
  const footer = document.getElementById("footer");
  if (footer) stops.push({ kind: "footer", id: "footer", el: footer });
  return stops;
}

export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
  s: a.s + (b.s - a.s) * t,
  o: a.o + (b.o - a.o) * t,
});

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
